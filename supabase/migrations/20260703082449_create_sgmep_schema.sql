/*
# SGMEP - Système de Gestion des Mandataires et Élus du Parti

## Description
Crée le schéma complet pour centraliser les mandataires et élus du parti politique.
L'application dispose d'un écran de connexion (sign-in) donc toutes les politiques
sont scopées à `authenticated` avec vérification de propriété via `auth.uid()`.

## Nouvelles tables
1. `profiles` — Profil utilisateur lié à auth.users avec rôle RBAC
2. `structures` — Structures publiques/privées où sont affectés les mandataires
3. `mandataires` — Mandataires et élus du parti
4. `documents` — Documents joints (CV, diplômes, arrêtés)
5. `cotisations` — Cotisations financières des mandataires
6. `activity_logs` — Journal des activités des utilisateurs
7. `notifications` — Notifications système

## Sécurité (RLS)
- RLS activée sur toutes les tables
- Politiques scopées à `authenticated` avec vérification de propriété
- Le Président et le Secrétaire National ont accès à toutes les données
- Le Point Focal n'accède qu'aux données de sa structure
- Le Comptable gère uniquement les cotisations

## Notes importantes
1. Les tables sont créées avant les fonctions helper pour éviter les dépendances circulaires
2. Un trigger `handle_new_user` crée automatiquement un profil à l'inscription
3. Les politiques utilisent des fonctions helper pour vérifier le rôle
*/

-- ============================================================
-- TABLE: profiles (créée en premier, sans FK vers structures)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'focal' CHECK (role IN ('president', 'secretary', 'focal', 'accountant')),
  phone text,
  structure_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: structures
-- ============================================================

CREATE TABLE IF NOT EXISTS public.structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('ministere', 'entreprise_publique', 'agence', 'institution', 'province', 'commune', 'autre')),
  address text,
  province text,
  city text,
  focal_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.structures ENABLE ROW LEVEL SECURITY;

-- Lien profiles.structure_id -> structures.id (ajouté après création des deux tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_structure_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_structure_id_fkey
    FOREIGN KEY (structure_id) REFERENCES public.structures(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- TABLE: mandataires
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mandataires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matricule text NOT NULL UNIQUE,
  nom text NOT NULL,
  postnom text NOT NULL,
  prenom text NOT NULL,
  sexe text NOT NULL CHECK (sexe IN ('M', 'F')),
  date_naissance date,
  province_origine text,
  telephone text,
  email text,
  adresse text,
  structure_id uuid REFERENCES public.structures(id) ON DELETE SET NULL,
  poste_actuel text,
  date_nomination date,
  anciennete text,
  niveau_etudes text,
  competences text,
  experiences text,
  statut text NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'suspendu', 'retraite')),
  ambitions text,
  observations text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mandataires_structure_id ON public.mandataires(structure_id);
CREATE INDEX IF NOT EXISTS idx_mandataires_statut ON public.mandataires(statut);
CREATE INDEX IF NOT EXISTS idx_mandataires_nom ON public.mandataires(nom);
CREATE INDEX IF NOT EXISTS idx_mandataires_matricule ON public.mandataires(matricule);

ALTER TABLE public.mandataires ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: documents
-- ============================================================

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandataire_id uuid NOT NULL REFERENCES public.mandataires(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('cv', 'diplome', 'arrete', 'autre')),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_mandataire_id ON public.documents(mandataire_id);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: cotisations
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cotisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandataire_id uuid NOT NULL REFERENCES public.mandataires(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('mensuelle', 'don', 'exceptionnelle')),
  montant numeric(12,2) NOT NULL CHECK (montant >= 0),
  date_paiement date NOT NULL DEFAULT CURRENT_DATE,
  mode_paiement text NOT NULL CHECK (mode_paiement IN ('especes', 'virement', 'mobile_money', 'cheque')),
  reference text,
  commentaire text,
  recorded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cotisations_mandataire_id ON public.cotisations(mandataire_id);
CREATE INDEX IF NOT EXISTS idx_cotisations_date_paiement ON public.cotisations(date_paiement);
CREATE INDEX IF NOT EXISTS idx_cotisations_type ON public.cotisations(type);

ALTER TABLE public.cotisations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: activity_logs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS pour RBAC (créées après les tables)
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('president', 'secretary')
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_structure_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT structure_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- POLITIQUES RLS: profiles
-- ============================================================

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
CREATE POLICY "profiles_insert_admin"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin"
ON public.profiles FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================
-- POLITIQUES RLS: structures
-- ============================================================

DROP POLICY IF EXISTS "structures_select_all_or_focal" ON public.structures;
CREATE POLICY "structures_select_all_or_focal"
ON public.structures FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR id = public.current_user_structure_id()
  OR focal_id = auth.uid()
);

DROP POLICY IF EXISTS "structures_insert_admin" ON public.structures;
CREATE POLICY "structures_insert_admin"
ON public.structures FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "structures_update_admin_or_focal" ON public.structures;
CREATE POLICY "structures_update_admin_or_focal"
ON public.structures FOR UPDATE
TO authenticated
USING (public.is_admin() OR focal_id = auth.uid())
WITH CHECK (public.is_admin() OR focal_id = auth.uid());

DROP POLICY IF EXISTS "structures_delete_admin" ON public.structures;
CREATE POLICY "structures_delete_admin"
ON public.structures FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================
-- POLITIQUES RLS: mandataires
-- ============================================================

DROP POLICY IF EXISTS "mandataires_select_allowed" ON public.mandataires;
CREATE POLICY "mandataires_select_allowed"
ON public.mandataires FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR structure_id = public.current_user_structure_id()
);

DROP POLICY IF EXISTS "mandataires_insert_admin_or_focal" ON public.mandataires;
CREATE POLICY "mandataires_insert_admin_or_focal"
ON public.mandataires FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
  OR structure_id = public.current_user_structure_id()
);

DROP POLICY IF EXISTS "mandataires_update_admin_or_focal" ON public.mandataires;
CREATE POLICY "mandataires_update_admin_or_focal"
ON public.mandataires FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  OR structure_id = public.current_user_structure_id()
)
WITH CHECK (
  public.is_admin()
  OR structure_id = public.current_user_structure_id()
);

DROP POLICY IF EXISTS "mandataires_delete_admin" ON public.mandataires;
CREATE POLICY "mandataires_delete_admin"
ON public.mandataires FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================
-- POLITIQUES RLS: documents
-- ============================================================

DROP POLICY IF EXISTS "documents_select_allowed" ON public.documents;
CREATE POLICY "documents_select_allowed"
ON public.documents FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.mandataires m
    WHERE m.id = documents.mandataire_id
    AND m.structure_id = public.current_user_structure_id()
  )
);

DROP POLICY IF EXISTS "documents_insert_admin_or_focal" ON public.documents;
CREATE POLICY "documents_insert_admin_or_focal"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.mandataires m
    WHERE m.id = documents.mandataire_id
    AND m.structure_id = public.current_user_structure_id()
  )
);

DROP POLICY IF EXISTS "documents_delete_admin" ON public.documents;
CREATE POLICY "documents_delete_admin"
ON public.documents FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================
-- POLITIQUES RLS: cotisations
-- ============================================================

DROP POLICY IF EXISTS "cotisations_select_allowed" ON public.cotisations;
CREATE POLICY "cotisations_select_allowed"
ON public.cotisations FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR public.current_user_role() = 'accountant'
  OR EXISTS (
    SELECT 1 FROM public.mandataires m
    WHERE m.id = cotisations.mandataire_id
    AND m.structure_id = public.current_user_structure_id()
  )
);

DROP POLICY IF EXISTS "cotisations_insert_allowed" ON public.cotisations;
CREATE POLICY "cotisations_insert_allowed"
ON public.cotisations FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
  OR public.current_user_role() = 'accountant'
  OR EXISTS (
    SELECT 1 FROM public.mandataires m
    WHERE m.id = cotisations.mandataire_id
    AND m.structure_id = public.current_user_structure_id()
  )
);

DROP POLICY IF EXISTS "cotisations_update_admin_accountant" ON public.cotisations;
CREATE POLICY "cotisations_update_admin_accountant"
ON public.cotisations FOR UPDATE
TO authenticated
USING (public.is_admin() OR public.current_user_role() = 'accountant')
WITH CHECK (public.is_admin() OR public.current_user_role() = 'accountant');

DROP POLICY IF EXISTS "cotisations_delete_admin" ON public.cotisations;
CREATE POLICY "cotisations_delete_admin"
ON public.cotisations FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================
-- POLITIQUES RLS: activity_logs
-- ============================================================

DROP POLICY IF EXISTS "activity_logs_select_admin" ON public.activity_logs;
CREATE POLICY "activity_logs_select_admin"
ON public.activity_logs FOR SELECT
TO authenticated
USING (public.is_admin() OR user_id = auth.uid());

DROP POLICY IF EXISTS "activity_logs_insert_authenticated" ON public.activity_logs;
CREATE POLICY "activity_logs_insert_authenticated"
ON public.activity_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ============================================================
-- POLITIQUES RLS: notifications
-- ============================================================

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_admin" ON public.notifications;
CREATE POLICY "notifications_insert_admin"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "notifications_delete_own_or_admin" ON public.notifications;
CREATE POLICY "notifications_delete_own_or_admin"
ON public.notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- ============================================================
-- TRIGGER: auto-création de profil à l'inscription
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nouvel utilisateur'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'focal')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: updated_at automatique
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS structures_updated_at ON public.structures;
CREATE TRIGGER structures_updated_at BEFORE UPDATE ON public.structures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS mandataires_updated_at ON public.mandataires;
CREATE TRIGGER mandataires_updated_at BEFORE UPDATE ON public.mandataires
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
