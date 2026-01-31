-- Create helper function to check if user is restaurant staff
CREATE OR REPLACE FUNCTION public.is_restaurant_staff(_user_id uuid, _restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.restaurants WHERE id = _restaurant_id AND owner_id = _user_id
    ) OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.staff_table_assignments sta ON sta.staff_user_id = ur.user_id
        WHERE ur.user_id = _user_id 
        AND sta.restaurant_id = _restaurant_id
        AND ur.role::text IN ('supervisor', 'wait_staff')
    )
$$;

-- Suppliers policies
CREATE POLICY "Restaurant owners can manage suppliers" ON public.suppliers FOR ALL USING (
    EXISTS (SELECT 1 FROM restaurants WHERE id = suppliers.restaurant_id AND owner_id = auth.uid())
);
CREATE POLICY "Staff can view suppliers" ON public.suppliers FOR SELECT USING (
    public.is_restaurant_staff(auth.uid(), restaurant_id)
);

-- Inventory items policies
CREATE POLICY "Restaurant owners can manage inventory" ON public.inventory_items FOR ALL USING (
    EXISTS (SELECT 1 FROM restaurants WHERE id = inventory_items.restaurant_id AND owner_id = auth.uid())
);
CREATE POLICY "Staff can view inventory" ON public.inventory_items FOR SELECT USING (
    public.is_restaurant_staff(auth.uid(), restaurant_id)
);

-- Menu item ingredients policies
CREATE POLICY "Restaurant owners can manage ingredients" ON public.menu_item_ingredients FOR ALL USING (
    EXISTS (SELECT 1 FROM menu_items mi JOIN restaurants r ON mi.restaurant_id = r.id 
            WHERE mi.id = menu_item_ingredients.menu_item_id AND r.owner_id = auth.uid())
);
CREATE POLICY "Anyone can view ingredients" ON public.menu_item_ingredients FOR SELECT USING (true);

-- Purchase orders policies
CREATE POLICY "Restaurant owners can manage purchase orders" ON public.purchase_orders FOR ALL USING (
    EXISTS (SELECT 1 FROM restaurants WHERE id = purchase_orders.restaurant_id AND owner_id = auth.uid())
);
CREATE POLICY "Staff can view purchase orders" ON public.purchase_orders FOR SELECT USING (
    public.is_restaurant_staff(auth.uid(), restaurant_id)
);

-- Purchase order items policies
CREATE POLICY "Restaurant owners can manage PO items" ON public.purchase_order_items FOR ALL USING (
    EXISTS (SELECT 1 FROM purchase_orders po JOIN restaurants r ON po.restaurant_id = r.id 
            WHERE po.id = purchase_order_items.purchase_order_id AND r.owner_id = auth.uid())
);
CREATE POLICY "Staff can view PO items" ON public.purchase_order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id 
            AND public.is_restaurant_staff(auth.uid(), po.restaurant_id))
);

-- Waste log policies
CREATE POLICY "Restaurant owners can manage waste log" ON public.waste_log FOR ALL USING (
    EXISTS (SELECT 1 FROM restaurants WHERE id = waste_log.restaurant_id AND owner_id = auth.uid())
);
CREATE POLICY "Staff can create waste entries" ON public.waste_log FOR INSERT WITH CHECK (
    public.is_restaurant_staff(auth.uid(), restaurant_id)
);
CREATE POLICY "Staff can view waste log" ON public.waste_log FOR SELECT USING (
    public.is_restaurant_staff(auth.uid(), restaurant_id)
);

-- Restaurant tables policies
CREATE POLICY "Anyone can view tables" ON public.restaurant_tables FOR SELECT USING (true);
CREATE POLICY "Restaurant owners can manage tables" ON public.restaurant_tables FOR ALL USING (
    EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_tables.restaurant_id AND owner_id = auth.uid())
);

-- Shifts policies
CREATE POLICY "Restaurant owners can manage shifts" ON public.shifts FOR ALL USING (
    EXISTS (SELECT 1 FROM restaurants WHERE id = shifts.restaurant_id AND owner_id = auth.uid())
);
CREATE POLICY "Staff can view shifts" ON public.shifts FOR SELECT USING (
    public.is_restaurant_staff(auth.uid(), restaurant_id)
);

-- Staff table assignments policies
CREATE POLICY "Restaurant owners can manage assignments" ON public.staff_table_assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM restaurants WHERE id = staff_table_assignments.restaurant_id AND owner_id = auth.uid())
);
CREATE POLICY "Staff can view their assignments" ON public.staff_table_assignments FOR SELECT USING (
    staff_user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM restaurants WHERE id = staff_table_assignments.restaurant_id AND owner_id = auth.uid())
);

-- Staff notifications policies
CREATE POLICY "Staff can view their notifications" ON public.staff_notifications FOR SELECT USING (
    staff_user_id = auth.uid()
);
CREATE POLICY "Staff can update their notifications" ON public.staff_notifications FOR UPDATE USING (
    staff_user_id = auth.uid()
);
CREATE POLICY "System can create notifications" ON public.staff_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can view staff notifications" ON public.staff_notifications FOR SELECT USING (
    EXISTS (SELECT 1 FROM restaurants WHERE id = staff_notifications.restaurant_id AND owner_id = auth.uid())
);

-- Enable realtime for notifications and inventory
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;

-- Create trigger to auto-deduct inventory on order completion
CREATE OR REPLACE FUNCTION public.deduct_inventory_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE public.inventory_items ii
        SET quantity_in_stock = ii.quantity_in_stock - (
            SELECT COALESCE(SUM(oi.quantity * mii.quantity_required), 0)
            FROM public.order_items oi
            JOIN public.menu_item_ingredients mii ON oi.menu_item_id = mii.menu_item_id
            WHERE oi.order_id = NEW.id AND mii.inventory_item_id = ii.id
        )
        WHERE ii.id IN (
            SELECT mii.inventory_item_id
            FROM public.order_items oi
            JOIN public.menu_item_ingredients mii ON oi.menu_item_id = mii.menu_item_id
            WHERE oi.order_id = NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER deduct_inventory_trigger
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.deduct_inventory_on_order();

-- Create trigger to notify assigned staff on new orders
CREATE OR REPLACE FUNCTION public.notify_staff_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    staff_id UUID;
BEGIN
    -- Find staff assigned to the table for today's shift
    SELECT sta.staff_user_id INTO staff_id
    FROM public.staff_table_assignments sta
    JOIN public.restaurant_tables rt ON sta.table_id = rt.id
    WHERE rt.restaurant_id = NEW.restaurant_id 
    AND rt.table_number = NEW.table_number
    AND sta.assignment_date = CURRENT_DATE
    AND sta.is_active = true
    LIMIT 1;
    
    IF staff_id IS NOT NULL THEN
        INSERT INTO public.staff_notifications (restaurant_id, staff_user_id, order_id, type, message)
        VALUES (NEW.restaurant_id, staff_id, NEW.id, 'new_order', 
                'New order from Table ' || NEW.table_number || ' - $' || NEW.total_amount);
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER notify_staff_trigger
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_staff_on_order();