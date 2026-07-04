export type UserRole = 'president' | 'secretary' | 'focal' | 'accountant';

export type StructureType =
  | 'ministere'
  | 'entreprise_publique'
  | 'agence'
  | 'institution'
  | 'province'
  | 'commune'
  | 'autre';

export type StructureStatus = 'active' | 'inactive';

export type MandataireSexe = 'M' | 'F';

export type MandataireStatut = 'actif' | 'inactif' | 'suspendu' | 'retraite';

export type CarteType = 'premium' | 'gold' | 'sylver';

export type DocumentType = 'cv' | 'diplome' | 'arrete' | 'autre';

export type CotisationType = 'mensuelle' | 'don' | 'exceptionnelle';

export type ModePaiement = 'especes' | 'virement' | 'mobile_money' | 'cheque';

export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  structure_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Structure {
  id: string;
  name: string;
  type: StructureType;
  address: string | null;
  province: string | null;
  city: string | null;
  focal_id: string | null;
  status: StructureStatus;
  created_at: string;
  updated_at: string;
  focal?: Profile | null;
  mandataire_count?: number;
}

export interface Mandataire {
  id: string;
  matricule: string;
  nom: string;
  postnom: string;
  prenom: string;
  sexe: MandataireSexe;
  date_naissance: string | null;
  province_origine: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  structure_id: string | null;
  poste_actuel: string | null;
  date_nomination: string | null;
  anciennete: string | null;
  niveau_etudes: string | null;
  competences: string | null;
  experiences: string | null;
  statut: MandataireStatut;
  ambitions: string | null;
  observations: string | null;
  carte_type: CarteType | null;
  photo_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  structure?: Structure | null;
  documents?: Document[];
  cotisations?: Cotisation[];
}

export interface Document {
  id: string;
  mandataire_id: string;
  type: DocumentType;
  file_name: string;
  file_url: string;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface Cotisation {
  id: string;
  mandataire_id: string;
  type: CotisationType;
  montant: number;
  date_paiement: string;
  mode_paiement: ModePaiement;
  reference: string | null;
  commentaire: string | null;
  recorded_by: string | null;
  created_at: string;
  mandataire?: Pick<Mandataire, 'id' | 'matricule' | 'nom' | 'postnom' | 'prenom'> & {
    structure?: Pick<Structure, 'id' | 'name'> | null;
  };
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user?: Pick<Profile, 'id' | 'full_name' | 'role'> | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalStructures: number;
  totalMandataires: number;
  totalCotisations: number;
  tauxCotisation: number;
  mandatairesActifs: number;
  mandatairesParStatut: { statut: string; count: number }[];
  cotisationsParMois: { mois: string; montant: number }[];
  cotisationsParType: { type: string; montant: number }[];
  mandatairesParProvince: { province: string; count: number }[];
  retardataires: number;
}

export interface PointFocal {
  id: string;
  numero: number;
  structure: string;
  nom_point_focal: string;
  contact: string | null;
  created_at: string;
  updated_at: string;
}
