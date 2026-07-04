y/*
# Add service card type and photo to mandataires

## Description
Ajoute la gestion des cartes de service pour les mandataires.
Trois types de cartes selon l'apport du mandataire: premium, gold, sylver.
Ajoute aussi un champ photo_url pour la photo du mandataire.

## Modified Tables
1. `mandataires`
   - `carte_type` (text, nullable, valeurs: 'premium' | 'gold' | 'sylver')
   - `photo_url` (text, nullable, URL publique de la photo)

## Security
- Aucune nouvelle politique RLS necessaire: les colonnes heritent
  des politiques existantes sur `mandataires`.
- Le bucket de storage `photos-mandataires` est public pour la lecture
  des photos (les photos sont des donnees publiques affichees sur les cartes).

## Notes importantes
1. On utilise `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` pour l'idempotence.
2. Le bucket de storage est cree avec acces public en lecture.
3. Les politiques de storage autorisent les utilisateurs authentifies
   a televerser des photos, et tout le monde a lire (public).
*/

-- Ajout des colonnes carte_type et photo_url
ALTER TABLE public.mandataires
  ADD COLUMN IF NOT EXISTS carte_type text CHECK (carte_type IN ('premium', 'gold', 'sylver')),
  ADD COLUMN IF NOT EXISTS photo_url text;

-- Index pour filtrer par type de carte
CREATE INDEX IF NOT EXISTS idx_mandataires_carte_type ON public.mandataires(carte_type);

-- ============================================================
-- STORAGE BUCKET: photos-mandataires
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('photos-mandataires', 'photos-mandataires', true)
ON CONFLICT (id) DO NOTHING;

-- Politique: lecture publique des photos
DROP POLICY IF EXISTS "photos_public_read" ON storage.objects;
CREATE POLICY "photos_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'photos-mandataires');

-- Politique: upload par utilisateurs authentifies
DROP POLICY IF EXISTS "photos_auth_upload" ON storage.objects;
CREATE POLICY "photos_auth_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos-mandataires');

-- Politique: update par utilisateurs authentifies (pour remplacer)
DROP POLICY IF EXISTS "photos_auth_update" ON storage.objects;
CREATE POLICY "photos_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'photos-mandataires')
WITH CHECK (bucket_id = 'photos-mandataires');

-- Politique: delete par utilisateurs authentifies
DROP POLICY IF EXISTS "photos_auth_delete" ON storage.objects;
CREATE POLICY "photos_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'photos-mandataires');
