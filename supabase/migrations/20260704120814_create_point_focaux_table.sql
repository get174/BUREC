/*
# Create point_focaux table

## Description
Crée une table dédiée à la gestion des Points Focaux des structures.
Chaque point focal représente le contact principal d'une structure,
avec son nom et son numéro de téléphone.

## New Tables
1. `point_focaux`
   - `id` (uuid, primary key)
   - `numero` (integer, numéro d'ordre affiché dans le tableau)
   - `structure` (text, nom de la structure — ex: "Cabinet MINCOMEXT")
   - `nom_point_focal` (text, nom du point focal — ex: "Maman BIBI")
   - `contact` (text, numéro de téléphone — ex: "0898915502")
   - `created_at` (timestamptz, date de création)
   - `updated_at` (timestamptz, date de mise à jour)

## Security
- RLS activée sur `point_focaux`.
- Le Président et le Secrétaire National (is_admin) ont accès à tout.
- Les Points Focaux et Comptables peuvent lire les données.
- Seuls les admins peuvent créer, modifier et supprimer.

## Notes importantes
1. La table est indépendante de la table `structures` existante car
   les données fournies contiennent des noms de structures libres
   (certains avec "—", certains avec "/ Comité de Suivi", etc.)
   qui ne correspondent pas directement aux structures existantes.
2. Le champ `numero` est un entier pour permettre le tri par ordre.
3. Les politiques utilisent les fonctions helper existantes (is_admin).
*/

CREATE TABLE IF NOT EXISTS public.point_focaux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer NOT NULL DEFAULT 0,
  structure text NOT NULL,
  nom_point_focal text NOT NULL DEFAULT '—',
  contact text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_point_focaux_numero ON public.point_focaux(numero);
CREATE INDEX IF NOT EXISTS idx_point_focaux_structure ON public.point_focaux(structure);

ALTER TABLE public.point_focaux ENABLE ROW LEVEL SECURITY;

-- SELECT: admin ou tout utilisateur authentifié peut lire
DROP POLICY IF EXISTS "point_focaux_select_authenticated" ON public.point_focaux;
CREATE POLICY "point_focaux_select_authenticated"
ON public.point_focaux FOR SELECT
TO authenticated
USING (true);

-- INSERT: admin seulement
DROP POLICY IF EXISTS "point_focaux_insert_admin" ON public.point_focaux;
CREATE POLICY "point_focaux_insert_admin"
ON public.point_focaux FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- UPDATE: admin seulement
DROP POLICY IF EXISTS "point_focaux_update_admin" ON public.point_focaux;
CREATE POLICY "point_focaux_update_admin"
ON public.point_focaux FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- DELETE: admin seulement
DROP POLICY IF EXISTS "point_focaux_delete_admin" ON public.point_focaux;
CREATE POLICY "point_focaux_delete_admin"
ON public.point_focaux FOR DELETE
TO authenticated
USING (public.is_admin());

-- Trigger updated_at
DROP TRIGGER IF EXISTS point_focaux_updated_at ON public.point_focaux;
CREATE TRIGGER point_focaux_updated_at BEFORE UPDATE ON public.point_focaux
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
