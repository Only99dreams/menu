-- Create storage bucket for 3D models
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('models', 'models', true, 52428800, ARRAY['model/gltf-binary', 'model/gltf+json', 'application/octet-stream']);

-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('menu-images', 'menu-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- RLS policies for models bucket
CREATE POLICY "Public can view models"
ON storage.objects FOR SELECT
USING (bucket_id = 'models');

CREATE POLICY "Restaurant owners can upload models"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'models' 
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "Restaurant owners can update their models"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'models' 
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "Restaurant owners can delete their models"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'models' 
    AND auth.uid() IS NOT NULL
);

-- RLS policies for menu-images bucket
CREATE POLICY "Public can view menu images"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

CREATE POLICY "Restaurant owners can upload menu images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'menu-images' 
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "Restaurant owners can update their menu images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'menu-images' 
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "Restaurant owners can delete their menu images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'menu-images' 
    AND auth.uid() IS NOT NULL
);