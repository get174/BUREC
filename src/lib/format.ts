import type {
  CarteType,
  CotisationType,
  DocumentType,
  MandataireSexe,
  MandataireStatut,
  ModePaiement,
  StructureStatus,
  StructureType,
} from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FC';
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD < 30) return `Il y a ${diffD}j`;
  return formatDate(date);
}

export const STRUCTURE_TYPE_LABELS: Record<StructureType, string> = {
  ministere: 'Ministère',
  entreprise_publique: 'Entreprise Publique',
  agence: 'Agence',
  institution: 'Institution',
  province: 'Province',
  commune: 'Commune',
  autre: 'Autre',
};

export const STRUCTURE_STATUS_LABELS: Record<StructureStatus, string> = {
  active: 'Actif',
  inactive: 'Inactif',
};

export const SEXE_LABELS: Record<MandataireSexe, string> = {
  M: 'Masculin',
  F: 'Féminin',
};

export const MANDATAIRE_STATUT_LABELS: Record<MandataireStatut, string> = {
  actif: 'Actif',
  inactif: 'Inactif',
  suspendu: 'Suspendu',
  retraite: 'Retraité',
};

export const CARTE_TYPE_LABELS: Record<CarteType, string> = {
  premium: 'Premium',
  gold: 'Gold',
  sylver: 'Sylver',
};

export const CARTE_TYPE_DESCRIPTIONS: Record<CarteType, string> = {
  premium: 'Apport exceptionnel — carte de service haut de gamme',
  gold: 'Apport important — carte de service dorée',
  sylver: 'Apport régulier — carte de service argent',
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  cv: 'CV',
  diplome: 'Diplôme',
  arrete: 'Arrêté',
  autre: 'Autre',
};

export const COTISATION_TYPE_LABELS: Record<CotisationType, string> = {
  mensuelle: 'Cotisation Mensuelle',
  don: 'Don Spécial',
  exceptionnelle: 'Contribution Exceptionnelle',
};

export const MODE_PAIEMENT_LABELS: Record<ModePaiement, string> = {
  especes: 'Espèces',
  virement: 'Virement',
  mobile_money: 'Mobile Money',
  cheque: 'Chèque',
};

export const PROVINCES = [
  'Kinshasa',
  'Kongo-Central',
  'Kwango',
  'Kwilu',
  'Mai-Ndombe',
  'Équateur',
  'Mongala',
  'Sud-Ubangi',
  'Nord-Ubangi',
  'Tshuapa',
  'Kasaï',
  'Kasaï-Central',
  'Kasaï-Oriental',
  'Lomami',
  'Sankuru',
  'Maniema',
  'Sud-Kivu',
  'Nord-Kivu',
  'Ituri',
  'Haut-Uele',
  'Bas-Uele',
  'Tshopo',
  'Haut-Lomami',
  'Lualaba',
  'Haut-Katanga',
  'Tanganyika',
];

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
