-- Add unique constraint on restaurant slug to ensure no two restaurants can share the same slug
ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_slug_unique UNIQUE (slug);

-- Add an index for faster slug lookups (used in QR code URL resolution)
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants (slug);