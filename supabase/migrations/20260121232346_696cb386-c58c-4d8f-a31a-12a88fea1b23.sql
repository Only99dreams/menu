-- Drop and recreate the handle_new_user function to properly handle restaurant owner signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_restaurant_name TEXT;
    v_restaurant_slug TEXT;
BEGIN
    -- Create profile
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
    
    -- Check if user is signing up as restaurant owner
    v_restaurant_name := new.raw_user_meta_data ->> 'restaurant_name';
    
    IF v_restaurant_name IS NOT NULL AND v_restaurant_name != '' THEN
        -- Create restaurant slug
        v_restaurant_slug := lower(regexp_replace(v_restaurant_name, '\s+', '-', 'g'));
        v_restaurant_slug := regexp_replace(v_restaurant_slug, '[^a-z0-9-]', '', 'g');
        v_restaurant_slug := v_restaurant_slug || '-' || to_char(now(), 'YYMMDDHHMI');
        
        -- Create restaurant
        INSERT INTO public.restaurants (owner_id, name, slug)
        VALUES (new.id, v_restaurant_name, v_restaurant_slug);
        
        -- Assign restaurant_owner role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new.id, 'restaurant_owner');
    ELSE
        -- Default to customer role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new.id, 'customer');
    END IF;
    
    RETURN new;
END;
$$;

-- Fix existing users who own restaurants but don't have restaurant_owner role
INSERT INTO public.user_roles (user_id, role)
SELECT r.owner_id, 'restaurant_owner'
FROM public.restaurants r
WHERE r.owner_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = r.owner_id AND ur.role = 'restaurant_owner'
)
ON CONFLICT (user_id, role) DO NOTHING;