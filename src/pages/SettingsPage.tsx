import { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Bell,
  Shield,
  Save,
  Database,
  Plug,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/ui/PageHeader';
import { FormField } from '../components/ui/FormField';
import { Badge } from '../components/ui/Badge';
import { ROLE_LABELS, ROLE_PERMISSIONS } from '../lib/permissions';
import { supabase } from '../lib/supabase';
import { getInitials } from '../lib/format';

type Tab = 'profile' | 'security' | 'notifications' | 'integrations';

export function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('profile');
  const [saving, setSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: profileForm.full_name, phone: profileForm.phone })
        .eq('id', profile.id);
      if (error) throw error;
      await refreshProfile();
      toast('Profil mis à jour avec succès', 'success');
    } catch (err) {
      console.error(err);
      toast('Erreur lors de la mise à jour', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      toast('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    if (passwordForm.new.length < 6) {
      toast('Le mot de passe doit contenir au moins 6 caractères', 'error');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new,
      });
      if (error) throw error;
      toast('Mot de passe modifié avec succès', 'success');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Erreur lors du changement';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Sécurité', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Intégrations', icon: Plug },
  ];

  return (
    <div>
      <PageHeader
        title="Paramètres"
        description="Gérez votre compte et les configurations système"
        icon={<SettingsIcon className="w-5 h-5" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="card p-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    tab === t.id
                      ? 'bg-primary-50 text-primary-900'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          {tab === 'profile' && (
            <div className="card p-6">
              <h3 className="text-base font-semibold text-neutral-900 mb-1">Informations du profil</h3>
              <p className="text-sm text-neutral-500 mb-6">Mettez à jour vos informations personnelles</p>

              <div className="flex items-center gap-4 pb-6 mb-6 border-b border-neutral-100">
                <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-900 flex items-center justify-center text-xl font-bold">
                  {getInitials(profile?.full_name ?? 'U')}
                </div>
                <div>
                  <p className="text-base font-semibold text-neutral-900">{profile?.full_name}</p>
                  <p className="text-sm text-neutral-500">{profile?.role ? ROLE_LABELS[profile.role] : ''}</p>
                  <Badge variant="success" dot>Compte actif</Badge>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Nom complet" required>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      className="input-field"
                      required
                    />
                  </FormField>
                  <FormField label="Téléphone">
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+243..."
                      className="input-field"
                    />
                  </FormField>
                </div>

                <FormField label="Email (non modifiable)">
                  <input
                    type="email"
                    value={profile?.id ? '' : ''}
                    disabled
                    placeholder="Contactez l'administrateur pour modifier l'email"
                    className="input-field bg-neutral-50"
                  />
                </FormField>

                <div className="flex justify-end">
                  <button type="submit" className="btn-primary" disabled={saving}>
                    <Save className="w-4 h-4" />
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {tab === 'security' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-base font-semibold text-neutral-900 mb-1">Changer le mot de passe</h3>
                <p className="text-sm text-neutral-500 mb-6">Utilisez un mot de passe fort et unique</p>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <FormField label="Nouveau mot de passe" required>
                    <input
                      type="password"
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      className="input-field"
                      required
                      minLength={6}
                    />
                  </FormField>
                  <FormField label="Confirmer le mot de passe" required>
                    <input
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      className="input-field"
                      required
                    />
                  </FormField>
                  <div className="flex justify-end">
                    <button type="submit" className="btn-primary" disabled={saving}>
                      <Lock className="w-4 h-4" />
                      {saving ? 'Modification...' : 'Changer le mot de passe'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="card p-6">
                <h3 className="text-base font-semibold text-neutral-900 mb-1">Permissions du rôle</h3>
                <p className="text-sm text-neutral-500 mb-4">
                  Votre rôle ({profile?.role ? ROLE_LABELS[profile.role] : ''}) vous accorde les permissions suivantes:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {profile && ROLE_PERMISSIONS[profile.role].map((perm) => (
                    <div key={perm} className="flex items-center gap-2 p-2.5 bg-neutral-50 rounded-lg">
                      <Shield className="w-4 h-4 text-success-500 flex-shrink-0" />
                      <span className="text-sm text-neutral-700">{perm}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="card p-6">
              <h3 className="text-base font-semibold text-neutral-900 mb-1">Préférences de notifications</h3>
              <p className="text-sm text-neutral-500 mb-6">Choisissez les notifications que vous souhaitez recevoir</p>

              <div className="space-y-3">
                {[
                  { label: 'Cotisations en retard', desc: 'Recevoir une alerte quand un mandataire est en retard', default: true },
                  { label: 'Nouveaux mandataires', desc: 'Notification lors de l\'ajout d\'un mandataire', default: true },
                  { label: 'Rapports mensuels', desc: 'Recevoir le rapport mensuel par email', default: true },
                  { label: 'Alertes système', desc: 'Notifications de maintenance et mises à jour', default: false },
                ].map((n) => (
                  <label key={n.label} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-neutral-800">{n.label}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{n.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={n.default}
                      className="w-5 h-5 rounded border-neutral-300 text-success-500 focus:ring-success-500/20"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {tab === 'integrations' && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-900 flex items-center justify-center flex-shrink-0">
                    <Database className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-neutral-900">Base de données Supabase</h3>
                      <Badge variant="success" dot>Connecté</Badge>
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">
                      Base de données PostgreSQL hébergée avec RLS activée sur toutes les tables.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-warning-50 text-warning-700 flex items-center justify-center flex-shrink-0">
                    <Plug className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-neutral-900">BUREC Pilote</h3>
                      <Badge variant="warning" dot>En préparation</Badge>
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">
                      Intégration avec le système national BUREC Pilote. L'architecture est prête pour une future connexion via API REST.
                    </p>
                    <div className="mt-4 p-3 bg-warning-50/50 border border-warning-100 rounded-lg">
                      <p className="text-xs text-warning-800">
                        L'intégration sera activée dès que l'API BUREC Pilote sera disponible. Les schémas de données sont déjà conformes aux standards nationaux.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success-50 text-success-600 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-neutral-900">Notifications SMS / WhatsApp</h3>
                      <Badge variant="neutral" dot>Planifié</Badge>
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">
                      Système d'envoi de notifications SMS et WhatsApp pour les alertes automatiques aux mandataires.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
