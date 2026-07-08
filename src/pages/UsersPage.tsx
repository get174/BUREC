import { useEffect, useState, useMemo } from 'react';
import {
  UserCog,
  Plus,
  Pencil,
  Trash2,
  Filter,
  Shield,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
} from 'lucide-react';
import { useAuth, useRole } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { FormField, Select } from '../components/ui/FormField';
import { EmptyState } from '../components/ui/EmptyState';
import { fetchProfiles, fetchStructures, updateProfile, logActivity } from '../lib/api';
import { hasPermission, ROLE_LABELS, ROLE_SHORT, ROLE_PERMISSIONS, type Permission } from '../lib/permissions';
import { formatDate, getInitials } from '../lib/format';
import type { Profile, Structure, UserRole } from '../types';

interface UsersPageProps {
  searchQuery: string;
}

const ROLE_VARIANT: Record<UserRole, 'primary' | 'success' | 'warning' | 'accent'> = {
  president: 'primary',
  secretary: 'success',
  focal: 'warning',
  accountant: 'accent',
};

export function UsersPage({ searchQuery }: UsersPageProps) {
  const { profile: currentUser } = useAuth();
  const role = useRole();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterRole, setFilterRole] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [permRole, setPermRole] = useState<UserRole | null>(null);

  const canCreate = hasPermission(role, 'users.create');
  const canEdit = hasPermission(role, 'users.edit');
  const canDelete = hasPermission(role, 'users.delete');

  const [form, setForm] = useState({
    full_name: '',
    role: 'focal' as UserRole,
    phone: '',
    structure_id: '',
    email: '',
    password: '',
    is_active: true,
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([fetchProfiles(), fetchStructures()]);
      setProfiles(p);
      setStructures(s);
    } catch (err) {
      console.error(err);
      toast('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || p.full_name.toLowerCase().includes(q) || p.phone?.toLowerCase().includes(q);
      const matchRole = !filterRole || p.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [profiles, searchQuery, filterRole]);

  function getStructureName(id: string | null): string {
    if (!id) return '—';
    return structures.find((s) => s.id === id)?.name ?? '—';
  }

  function openCreate() {
    setEditing(null);
    setForm({ full_name: '', role: 'focal', phone: '', structure_id: '', email: '', password: '', is_active: true });
    setModalOpen(true);
  }

  function openEdit(p: Profile) {
    setEditing(p);
    setForm({
      full_name: p.full_name,
      role: p.role,
      phone: p.phone ?? '',
      structure_id: p.structure_id ?? '',
      email: '',
      password: '',
      is_active: p.is_active,
    });
    setModalOpen(true);
  }

  function getPasswordStrength(pw: string) {
    const length = pw.length;
    const hasLower = /[a-z]/.test(pw);
    const hasUpper = /[A-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw);
    const score = [length >= 8, hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

    if (!pw) {
      return { label: 'Aucun mot de passe', color: 'neutral', score };
    }
    if (score <= 2) return { label: 'Très faible', color: 'error', score };
    if (score === 3) return { label: 'Faible', color: 'warning', score };
    if (score === 4) return { label: 'Moyen', color: 'primary', score };
    return { label: 'Fort', color: 'success', score };
  }

  const passwordStrength = getPasswordStrength(form.password);
  const passwordStrengthClass = {
    neutral: 'text-neutral-500',
    error: 'text-error-700',
    warning: 'text-warning-700',
    primary: 'text-primary-700',
    success: 'text-success-700',
  }[passwordStrength.color];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast('Le nom complet est obligatoire', 'error');
      return;
    }
    // validate email/password for new users
    if (!editing) {
      const email = (form.email || '').trim();
      const password = form.password || '';
      if (!email) {
        toast('L\'adresse email est obligatoire', 'error');
        setSaving(false);
        return;
      }
      const pwError = validatePassword(password);
      if (pwError) {
        toast(pwError, 'error');
        setSaving(false);
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name,
        role: form.role,
        phone: form.phone || null,
        structure_id: form.structure_id || null,
        is_active: form.is_active,
      };
      if (editing) {
        await updateProfile(editing.id, payload);
        await logActivity('UPDATE_USER', 'profile', { id: editing.id, role: form.role });
        toast('Utilisateur mis à jour', 'success');
      }
      else {
        const { supabase } = await import('../lib/supabase');

        // sauvegarder la session courante (admin) pour la restaurer après signUp
        const { data: currentSessionData } = await supabase.auth.getSession();
        const savedSession = currentSessionData.session
          ? {
              access_token: currentSessionData.session.access_token,
              refresh_token: currentSessionData.session.refresh_token,
            }
          : null;

        await logActivity('CREATE_USER_ATTEMPT', 'profile', {
          email: form.email,
          full_name: form.full_name,
          role: form.role,
          structure_id: form.structure_id || null,
        });

        const { data, error: suError } = await supabase.auth.signUp({ email: form.email, password: form.password } as any);
        if (suError) {
          await logActivity('CREATE_USER_FAILED', 'profile', {
            email: form.email,
            error: suError.message,
          });
          toast('Erreur lors de la création auth: ' + suError.message, 'error');
        } else {
          const userId = data.user?.id;
          if (!userId) {
            await logActivity('CREATE_USER_FAILED', 'profile', {
              email: form.email,
              error: 'No user ID returned from Supabase',
            });
            toast('Compte auth créé mais id introuvable. Vérifiez la configuration Supabase.', 'warning');
          } else {
            const { error: insertErr } = await supabase.from('profiles').insert([
              {
                id: userId,
                full_name: form.full_name,
                role: form.role,
                phone: form.phone || null,
                structure_id: form.structure_id || null,
                is_active: form.is_active,
              },
            ]);
            if (insertErr) {
              await logActivity('CREATE_USER_FAILED', 'profile', {
                id: userId,
                email: form.email,
                error: insertErr.message,
              });
              toast('Profil créé échoué: ' + insertErr.message, 'error');
            } else {
              await logActivity('CREATE_USER', 'profile', {
                id: userId,
                email: form.email,
                role: form.role,
                structure_id: form.structure_id || null,
              });
              toast('Utilisateur créé et profil associé', 'success');
            }
          }
        }

        // Restaurer la session admin si elle a été remplacée
        if (savedSession) {
          try {
            // setSession remet la session avec les tokens sauvegardés
            // @ts-ignore
            await supabase.auth.setSession(savedSession);
          } catch (err) {
            console.error('Erreur lors de la restauration de session:', err);
          }
        }
      }
      setModalOpen(false);
      load();
    } catch (err) {
      console.error(err);
      toast('Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSaving(false);
    }
  }

  function validatePassword(pw: string): string | null {
    if (!pw || pw.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw)) return 'Le mot de passe doit contenir des lettres minuscules et majuscules.';
    if (!/[0-9]/.test(pw)) return 'Le mot de passe doit contenir au moins un chiffre.';
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw)) return 'Le mot de passe doit contenir au moins un caractère spécial.';
    return null;
  }

  async function toggleActive(p: Profile) {
    try {
      await updateProfile(p.id, { is_active: !p.is_active });
      await logActivity('UPDATE_USER', 'profile', { id: p.id, action: p.is_active ? 'deactivate' : 'activate' });
      toast(p.is_active ? 'Utilisateur désactivé' : 'Utilisateur activé', 'success');
      load();
    } catch (err) {
      console.error(err);
      toast('Erreur lors de la mise à jour', 'error');
    }
  }

  const columns: Column<Profile>[] = [
    {
      key: 'name',
      header: 'Utilisateur',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-900 flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {getInitials(p.full_name)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-neutral-900 truncate">
              {p.full_name}
              {p.id === currentUser?.id && <span className="text-xs text-primary-900 ml-2">(Vous)</span>}
            </p>
            <p className="text-xs text-neutral-400">{ROLE_SHORT[p.role]}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rôle',
      render: (p) => (
        <button
          onClick={(e) => { e.stopPropagation(); setPermRole(p.role); setPermModalOpen(true); }}
          className="hover:opacity-80 transition-opacity"
        >
          <Badge variant={ROLE_VARIANT[p.role]} dot>
            {ROLE_SHORT[p.role]}
          </Badge>
        </button>
      ),
    },
    {
      key: 'structure',
      header: 'Structure',
      render: (p) => <span className="text-neutral-600 truncate">{getStructureName(p.structure_id)}</span>,
    },
    {
      key: 'phone',
      header: 'Téléphone',
      render: (p) => p.phone ? (
        <div className="flex items-center gap-1.5 text-neutral-600">
          <Phone className="w-3.5 h-3.5 text-neutral-400" />
          {p.phone}
        </div>
      ) : <span className="text-neutral-400">—</span>,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (p) => (
        <Badge variant={p.is_active ? 'success' : 'neutral'} dot>
          {p.is_active ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Créé le',
      render: (p) => <span className="text-neutral-500">{formatDate(p.created_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          {canEdit && p.id !== currentUser?.id && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleActive(p); }}
              className={`p-1.5 rounded-lg transition-colors ${p.is_active ? 'text-neutral-400 hover:text-warning-700 hover:bg-warning-50' : 'text-neutral-400 hover:text-success-600 hover:bg-success-50'}`}
              title={p.is_active ? 'Désactiver' : 'Activer'}
            >
              {p.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </button>
          )}
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); openEdit(p); }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-900 hover:bg-primary-50 transition-colors"
              title="Modifier"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {canDelete && p.id !== currentUser?.id && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Gestion des utilisateurs"
        description="Administration des comptes et rôles RBAC"
        icon={<UserCog className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPermRole(role ?? null); setPermModalOpen(true); }}
              className="btn-secondary"
            >
              <Shield className="w-4 h-4" />
              Mes permissions
            </button>
            {canCreate && (
              <button onClick={openCreate} className="btn-primary">
                <Plus className="w-4 h-4" />
                Nouvel utilisateur
              </button>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`btn-secondary text-sm ${showFilters ? 'border-primary-300 text-primary-700' : ''}`}
        >
          <Filter className="w-4 h-4" />
          Filtres
        </button>
        {showFilters && (
          <div className="w-48">
            <Select
              value={filterRole}
              onChange={setFilterRole}
              options={Object.entries(ROLE_SHORT).map(([value, label]) => ({ value, label }))}
              placeholder="Tous les rôles"
            />
          </div>
        )}
        <div className="ml-auto text-sm text-neutral-500">
          {filtered.length} utilisateur{filtered.length > 1 ? 's' : ''}
        </div>
      </div>

      {filtered.length === 0 && !loading ? (
        <div className="card">
          <EmptyState
            icon={UserCog}
            title={searchQuery || filterRole ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur enregistré'}
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          rowKey={(p) => p.id}
          emptyMessage="Aucun utilisateur trouvé"
          emptyIcon={UserCog}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        description="Renseignez les informations de l'utilisateur"
        size="md"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary" disabled={saving}>
              Annuler
            </button>
            <button onClick={handleSubmit} className="btn-primary" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nom complet" required>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="input-field"
              required
            />
          </FormField>

          <FormField label="Rôle" required hint="Définit les permissions de l'utilisateur">
            <Select
              value={form.role}
              onChange={(v) => setForm({ ...form, role: v as UserRole })}
              options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </FormField>

          <FormField label="Téléphone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+243..."
              className="input-field"
            />
          </FormField>

          {!editing && (
            <>
              <FormField label="Adresse email" required>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  placeholder="utilisateur@sgmep.cd"
                  required
                />
              </FormField>

              <FormField label="Mot de passe" required>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field"
                  placeholder="Mot de passe temporaire"
                  required
                />
                <div className="mt-2 text-xs text-neutral-500">
                  <span>Force : </span>
                  <span className={`font-semibold ${passwordStrengthClass}`}>{passwordStrength.label}</span>
                  <span className="ml-2">({passwordStrength.score}/5)</span>
                </div>
              </FormField>
            </>
          )}

          <FormField label="Structure rattachée" hint="Obligatoire pour les Points Focaux">
            <Select
              value={form.structure_id}
              onChange={(v) => setForm({ ...form, structure_id: v })}
              options={structures.map((s) => ({ value: s.id, label: s.name }))}
              placeholder="Aucune structure"
            />
          </FormField>

          <FormField label="Statut du compte">
            <label className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-300 text-success-500 focus:ring-success-500/20"
              />
              <div>
                <p className="text-sm font-medium text-neutral-800">Compte actif</p>
                <p className="text-xs text-neutral-500">L'utilisateur peut se connecter au système</p>
              </div>
            </label>
          </FormField>

          {!editing && (
            <div className="p-3 bg-primary-50/50 border border-primary-100 rounded-lg flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-primary-900 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-primary-700">
                Pour créer un nouvel utilisateur, utilisez l'inscription Supabase. Ce formulaire permet de modifier le profil, le rôle et la structure.
              </p>
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={permModalOpen}
        onClose={() => setPermModalOpen(false)}
        title="Permissions du rôle"
        description={permRole ? ROLE_LABELS[permRole] : ''}
        size="md"
        footer={
          <button onClick={() => setPermModalOpen(false)} className="btn-primary">
            Fermer
          </button>
        }
      >
        {permRole && (
          <div className="space-y-2">
            <p className="text-sm text-neutral-500 mb-4">
              Ce rôle dispose des permissions suivantes:
            </p>
            {Object.entries(
              ROLE_PERMISSIONS[permRole].reduce((acc, perm) => {
                const category = perm.split('.')[0];
                if (!acc[category]) acc[category] = [];
                acc[category].push(perm);
                return acc;
              }, {} as Record<string, Permission[]>)
            ).map(([category, perms]) => (
              <div key={category} className="border border-neutral-100 rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-100">
                  <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    {category}
                  </p>
                </div>
                <div className="p-3 space-y-1.5">
                  {perms.map((perm) => (
                    <div key={perm} className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-success-500 flex-shrink-0" />
                      <span className="text-sm text-neutral-700">{perm.split('.')[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            toast('Pour supprimer un utilisateur, contactez l\'administrateur système', 'info');
            setDeleteTarget(null);
          }
        }}
        title="Supprimer l'utilisateur"
        message={`La suppression de "${deleteTarget?.full_name}" nécessite une intervention administrative. Voulez-vous plutôt désactiver le compte ?`}
        confirmLabel="Compris"
      />
    </div>
  );
}
