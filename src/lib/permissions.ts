import type { UserRole } from '../types';

export const ROLE_LABELS: Record<UserRole, string> = {
  president: 'Président / Autorité Morale',
  secretary: 'Secrétaire National MUHASA',
  focal: 'Point Focal',
  accountant: 'Comptable',
};

export const ROLE_SHORT: Record<UserRole, string> = {
  president: 'Président',
  secretary: 'Secrétaire National',
  focal: 'Point Focal',
  accountant: 'Comptable',
};

export type Permission =
  | 'dashboard.view'
  | 'structures.view'
  | 'structures.create'
  | 'structures.edit'
  | 'structures.delete'
  | 'mandataires.view'
  | 'mandataires.create'
  | 'mandataires.edit'
  | 'mandataires.delete'
  | 'cotisations.view'
  | 'cotisations.create'
  | 'cotisations.edit'
  | 'cotisations.delete'
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'reports.view'
  | 'reports.export'
  | 'activity.view'
  | 'settings.manage';

const ALL_PERMISSIONS: Permission[] = [
  'dashboard.view',
  'structures.view',
  'structures.create',
  'structures.edit',
  'structures.delete',
  'mandataires.view',
  'mandataires.create',
  'mandataires.edit',
  'mandataires.delete',
  'cotisations.view',
  'cotisations.create',
  'cotisations.edit',
  'cotisations.delete',
  'users.view',
  'users.create',
  'users.edit',
  'users.delete',
  'reports.view',
  'reports.export',
  'activity.view',
  'settings.manage',
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  president: ALL_PERMISSIONS,
  secretary: ALL_PERMISSIONS,
  focal: [
    'dashboard.view',
    'structures.view',
    'mandataires.view',
    'mandataires.create',
    'mandataires.edit',
    'cotisations.view',
    'cotisations.create',
    'reports.view',
  ],
  accountant: [
    'dashboard.view',
    'mandataires.view',
    'cotisations.view',
    'cotisations.create',
    'cotisations.edit',
    'cotisations.delete',
    'reports.view',
    'reports.export',
  ],
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(role: UserRole | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  return permissions.some((p) => ROLE_PERMISSIONS[role].includes(p));
}

export function isAdmin(role: UserRole | undefined): boolean {
  return role === 'president' || role === 'secretary';
}
