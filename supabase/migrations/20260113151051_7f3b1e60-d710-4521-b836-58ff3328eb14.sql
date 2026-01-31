-- Staff invitations table for inviting team members
CREATE TABLE public.staff_invitations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'wait_staff' CHECK (role IN ('supervisor', 'wait_staff')),
    invited_by UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (restaurant_id, email)
);

-- Enable RLS
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

-- Restaurant owners can manage invitations
CREATE POLICY "Restaurant owners can manage invitations"
ON public.staff_invitations
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants
        WHERE restaurants.id = staff_invitations.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
);

-- Anyone can view invitation by token (for accepting)
CREATE POLICY "Anyone can view invitation by token"
ON public.staff_invitations
FOR SELECT
USING (true);

-- Restaurant staff members table to link users to restaurants
CREATE TABLE public.restaurant_staff (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'wait_staff' CHECK (role IN ('supervisor', 'wait_staff')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (restaurant_id, user_id)
);

-- Enable RLS
ALTER TABLE public.restaurant_staff ENABLE ROW LEVEL SECURITY;

-- Restaurant owners can manage staff
CREATE POLICY "Restaurant owners can manage staff"
ON public.restaurant_staff
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.restaurants
        WHERE restaurants.id = restaurant_staff.restaurant_id
        AND restaurants.owner_id = auth.uid()
    )
);

-- Staff can view their own membership
CREATE POLICY "Staff can view their own membership"
ON public.restaurant_staff
FOR SELECT
USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_restaurant_staff_updated_at
    BEFORE UPDATE ON public.restaurant_staff
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();