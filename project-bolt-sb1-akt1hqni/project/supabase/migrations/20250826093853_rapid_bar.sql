/*
  # Correction du schéma des interventions

  1. Tables mises à jour
    - `interventions` avec toutes les colonnes d'intervention
    - Correction des types de données et contraintes
    - Mise à jour des politiques RLS

  2. Sécurité
    - Politiques RLS corrigées pour toutes les opérations CRUD
    - Accès basé sur l'utilisateur authentifié
*/

-- Supprimer la table existante si elle existe
DROP TABLE IF EXISTS public.interventions CASCADE;

-- Créer la table interventions avec toutes les colonnes nécessaires
CREATE TABLE IF NOT EXISTS public.interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  time time NOT NULL,
  line text NOT NULL CHECK (line IN ('A', 'B', 'C', 'Autres')),
  custom_line text,
  vehicle_number text NOT NULL,
  stop text NOT NULL,
  regulation integer NOT NULL DEFAULT 0,
  incivility integer NOT NULL DEFAULT 0,
  help integer NOT NULL DEFAULT 0,
  information integer NOT NULL DEFAULT 0,
  link integer NOT NULL DEFAULT 0,
  bike_scooter integer NOT NULL DEFAULT 0,
  stroller integer NOT NULL DEFAULT 0,
  physical_aggression integer NOT NULL DEFAULT 0,
  verbal_aggression integer NOT NULL DEFAULT 0,
  other integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can read all interventions" ON public.interventions;
DROP POLICY IF EXISTS "Users can insert their own interventions" ON public.interventions;
DROP POLICY IF EXISTS "Users can update their own interventions" ON public.interventions;
DROP POLICY IF EXISTS "Users can delete their own interventions" ON public.interventions;

-- Créer les politiques RLS
CREATE POLICY "Users can read all interventions"
  ON public.interventions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own interventions"
  ON public.interventions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interventions"
  ON public.interventions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interventions"
  ON public.interventions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS interventions_user_id_date_idx ON public.interventions(user_id, date);
CREATE INDEX IF NOT EXISTS interventions_date_idx ON public.interventions(date);
CREATE INDEX IF NOT EXISTS interventions_created_at_idx ON public.interventions(created_at);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_interventions_updated_at ON public.interventions;
CREATE TRIGGER update_interventions_updated_at
    BEFORE UPDATE ON public.interventions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();