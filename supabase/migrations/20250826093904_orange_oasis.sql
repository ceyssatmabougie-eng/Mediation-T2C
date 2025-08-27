/*
  # Correction du schéma des feuilles de route

  1. Tables mises à jour
    - `route_sheets` avec structure correcte
    - Bucket de stockage configuré

  2. Sécurité
    - Politiques RLS pour toutes les opérations
    - Accès au stockage configuré
*/

-- Supprimer la table existante si elle existe
DROP TABLE IF EXISTS public.route_sheets CASCADE;

-- Créer la table route_sheets
CREATE TABLE IF NOT EXISTS public.route_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.route_sheets ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can read all route sheets" ON public.route_sheets;
DROP POLICY IF EXISTS "Users can insert route sheets" ON public.route_sheets;
DROP POLICY IF EXISTS "Users can update their own route sheets" ON public.route_sheets;
DROP POLICY IF EXISTS "Users can delete their own route sheets" ON public.route_sheets;

-- Créer les politiques RLS
CREATE POLICY "Users can read all route sheets"
  ON public.route_sheets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert route sheets"
  ON public.route_sheets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own route sheets"
  ON public.route_sheets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own route sheets"
  ON public.route_sheets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS route_sheets_uploaded_by_idx ON public.route_sheets(uploaded_by);
CREATE INDEX IF NOT EXISTS route_sheets_created_at_idx ON public.route_sheets(created_at);

-- Créer le bucket de stockage pour les feuilles de route
INSERT INTO storage.buckets (id, name, public)
VALUES ('route-sheets', 'route-sheets', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques de stockage
DROP POLICY IF EXISTS "Users can upload route sheets" ON storage.objects;
DROP POLICY IF EXISTS "Users can view route sheets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their route sheets" ON storage.objects;

CREATE POLICY "Users can upload route sheets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'route-sheets');

CREATE POLICY "Users can view route sheets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'route-sheets');

CREATE POLICY "Users can delete their route sheets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'route-sheets');