-- Enable replica identity for complete row data in updates
ALTER TABLE public.orders REPLICA IDENTITY FULL;