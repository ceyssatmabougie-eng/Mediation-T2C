/*
  # Création du bucket guide-horaire et politiques RLS

  1. Bucket
    - Nom: guide-horaire
    - Privé avec limite de 10MB
    - Types MIME: image/* et application/pdf

  2. Politiques RLS
    - Lecture: tous les utilisateurs authentifiés
    - Upload/Update/Delete: admin uniquement
*/

-- Créer le bucket guide-horaire s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'guide-horaire',
  'guide-horaire', 
  false,
  10485760, -- 10MB en bytes
  ARRAY['image/*', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre la lecture à tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can read guide-horaire files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'guide-horaire');

-- Politique pour permettre l'upload uniquement à l'admin
CREATE POLICY "Admin can upload guide-horaire files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'guide-horaire' 
  AND auth.jwt() ->> 'email' = 'gregory.lima@t2c.local'
);

-- Politique pour permettre la mise à jour uniquement à l'admin
CREATE POLICY "Admin can update guide-horaire files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'guide-horaire' 
  AND auth.jwt() ->> 'email' = 'gregory.lima@t2c.local'
)
WITH CHECK (
  bucket_id = 'guide-horaire' 
  AND auth.jwt() ->> 'email' = 'gregory.lima@t2c.local'
);

-- Politique pour permettre la suppression uniquement à l'admin
CREATE POLICY "Admin can delete guide-horaire files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'guide-horaire' 
  AND auth.jwt() ->> 'email' = 'gregory.lima@t2c.local'
);