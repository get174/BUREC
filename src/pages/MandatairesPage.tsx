import { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Filter,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  Upload,
  Download,
  X,
  User,
  Clock,
} from 'lucide-react';
import { useAuth, useRole } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { FormField, Select, Textarea } from '../components/ui/FormField';
import { EmptyState } from '../components/ui/EmptyState';
import {
  fetchMandataires,
  fetchMandataire,
  fetchStructures,
  createMandataire,
  updateMandataire,
  deleteMandataire,
  uploadDocument,
  deleteDocument,
  logActivity,
} from '../lib/api';
import { hasPermission, isAdmin } from '../lib/permissions';
import {
  SEXE_LABELS,
  MANDATAIRE_STATUT_LABELS,
  PROVINCES,
  formatDate,
  formatCurrency,
  getInitials,
  DOCUMENT_TYPE_LABELS,
} from '../lib/format';
import type {
  Mandataire,
  Structure,
  MandataireSexe,
  MandataireStatut,
  DocumentType,
  Document,
} from '../types';

interface MandatairesPageProps {
  searchQuery: string;
  filterStructureId?: string;
}

const STATUT_VARIANT: Record<MandataireStatut, 'success' | 'neutral' | 'warning' | 'primary'> = {
  actif: 'success',
  inactif: 'neutral',
  suspendu: 'warning',
  retraite: 'primary',
};

export function MandatairesPage({ searchQuery, filterStructureId }: MandatairesPageProps) {
  const { profile } = useAuth();
  const role = useRole();
  const { toast } = useToast();
  const admin = isAdmin(role);

  const [mandataires, setMandataires] = useState<Mandataire[]>([]);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Mandataire | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Mandataire | null>(null);
  const [detailTarget, setDetailTarget] = useState<Mandataire | null>(null);
  const [saving, setSaving] = useState(false);

  const [filterStatut, setFilterStatut] = useState('');
  const [filterStructure, setFilterStructure] = useState(filterStructureId ?? '');
  const [filterSexe, setFilterSexe] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docType, setDocType] = useState<DocumentType>('cv');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const canCreate = hasPermission(role, 'mandataires.create');
  const canEdit = hasPermission(role, 'mandataires.edit');
  const canDelete = hasPermission(role, 'mandataires.delete');

  const [form, setForm] = useState({
    matricule: '',
    nom: '',
    postnom: '',
    prenom: '',
    sexe: 'M' as MandataireSexe,
    date_naissance: '',
    province_origine: '',
    telephone: '',
    email: '',
    adresse: '',
    structure_id: '',
    poste_actuel: '',
    date_nomination: '',
    anciennete: '',
    niveau_etudes: '',
    competences: '',
    experiences: '',
    statut: 'actif' as MandataireStatut,
    ambitions: '',
    observations: '',
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [m, s] = await Promise.all([fetchMandataires(), fetchStructures()]);
      setMandataires(m);
      setStructures(s);
    } catch (err) {
      console.error(err);
      toast('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return mandataires.filter((m) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        m.nom.toLowerCase().includes(q) ||
        m.postnom.toLowerCase().includes(q) ||
        m.prenom.toLowerCase().includes(q) ||
        m.matricule.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q);
      const matchStatut = !filterStatut || m.statut === filterStatut;
      const matchStructure = !filterStructure || m.structure_id === filterStructure;
      const matchSexe = !filterSexe || m.sexe === filterSexe;
      return matchSearch && matchStatut && matchStructure && matchSexe;
    });
  }, [mandataires, searchQuery, filterStatut, filterStructure, filterSexe]);

  function getStructureName(id: string | null): string {
    if (!id) return '—';
    return structures.find((s) => s.id === id)?.name ?? '—';
  }

  function openCreate() {
    setEditing(null);
    const defaultStructure = admin ? '' : (profile?.structure_id ?? '');
    setForm({
      matricule: `MND-${String(mandataires.length + 1).padStart(3, '0')}`,
      nom: '',
      postnom: '',
      prenom: '',
      sexe: 'M',
      date_naissance: '',
      province_origine: '',
      telephone: '',
      email: '',
      adresse: '',
      structure_id: defaultStructure,
      poste_actuel: '',
      date_nomination: '',
      anciennete: '',
      niveau_etudes: '',
      competences: '',
      experiences: '',
      statut: 'actif',
      ambitions: '',
      observations: '',
    });
    setModalOpen(true);
  }

  function openEdit(m: Mandataire) {
    setEditing(m);
    setForm({
      matricule: m.matricule,
      nom: m.nom,
      postnom: m.postnom,
      prenom: m.prenom,
      sexe: m.sexe,
      date_naissance: m.date_naissance ?? '',
      province_origine: m.province_origine ?? '',
      telephone: m.telephone ?? '',
      email: m.email ?? '',
      adresse: m.adresse ?? '',
      structure_id: m.structure_id ?? '',
      poste_actuel: m.poste_actuel ?? '',
      date_nomination: m.date_nomination ?? '',
      anciennete: m.anciennete ?? '',
      niveau_etudes: m.niveau_etudes ?? '',
      competences: m.competences ?? '',
      experiences: m.experiences ?? '',
      statut: m.statut,
      ambitions: m.ambitions ?? '',
      observations: m.observations ?? '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom.trim() || !form.postnom.trim() || !form.prenom.trim()) {
      toast('Nom, postnom et prénom sont obligatoires', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        date_naissance: form.date_naissance || null,
        date_nomination: form.date_nomination || null,
        structure_id: form.structure_id || null,
        created_by: profile?.id ?? null,
      };
      if (editing) {
        await updateMandataire(editing.id, payload);
        await logActivity('UPDATE_MANDATAIRE', 'mandataire', { id: editing.id, matricule: form.matricule });
        toast('Mandataire mis à jour', 'success');
      } else {
        const created = await createMandataire(payload);
        await logActivity('CREATE_MANDATAIRE', 'mandataire', { id: created.id, matricule: form.matricule });
        toast('Mandataire créé avec succès', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement';
      toast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMandataire(deleteTarget.id);
      await logActivity('DELETE_MANDATAIRE', 'mandataire', { id: deleteTarget.id });
      toast('Mandataire supprimé', 'success');
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.error(err);
      toast('Erreur lors de la suppression', 'error');
    }
  }

  async function openDetail(m: Mandataire) {
    try {
      const full = await fetchMandataire(m.id);
      setDetailTarget(full);
    } catch (err) {
      console.error(err);
      toast('Erreur lors du chargement du détail', 'error');
    }
  }

  async function handleUploadDoc() {
    if (!detailTarget || !docFile || !profile) return;
    setUploadingDoc(true);
    try {
      await uploadDocument(detailTarget.id, docFile, docType, profile.id);
      await logActivity('UPLOAD_DOCUMENT', 'document', { mandataire_id: detailTarget.id, type: docType });
      toast('Document téléversé avec succès', 'success');
      const full = await fetchMandataire(detailTarget.id);
      setDetailTarget(full);
      setDocFile(null);
      setDocModalOpen(false);
    } catch (err) {
      console.error(err);
      toast('Erreur lors du téléversement', 'error');
    } finally {
      setUploadingDoc(false);
    }
  }

  async function handleDeleteDoc(doc: Document) {
    if (!detailTarget) return;
    try {
      await deleteDocument(doc.id);
      toast('Document supprimé', 'success');
      const full = await fetchMandataire(detailTarget.id);
      setDetailTarget(full);
    } catch (err) {
      console.error(err);
      toast('Erreur lors de la suppression', 'error');
    }
  }

  const columns: Column<Mandataire>[] = [
    {
      key: 'matricule',
      header: 'Matricule',
      render: (m) => <span className="font-mono text-xs font-medium text-neutral-600">{m.matricule}</span>,
    },
    {
      key: 'name',
      header: 'Nom complet',
      render: (m) => (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${m.sexe === 'F' ? 'bg-accent-50 text-accent-700' : 'bg-primary-50 text-primary-900'}`}>
            {getInitials(`${m.prenom} ${m.nom}`)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-neutral-900 truncate">
              {m.prenom} {m.nom} {m.postnom}
            </p>
            <p className="text-xs text-neutral-400">{m.poste_actuel ?? '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'structure',
      header: 'Structure',
      render: (m) => (
        <span className="text-neutral-600 truncate">{getStructureName(m.structure_id)}</span>
      ),
    },
    {
      key: 'sexe',
      header: 'Sexe',
      render: (m) => <span className="text-neutral-600">{SEXE_LABELS[m.sexe]}</span>,
    },
    {
      key: 'statut',
      header: 'Statut',
      render: (m) => <Badge variant={STATUT_VARIANT[m.statut]} dot>{MANDATAIRE_STATUT_LABELS[m.statut]}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (m) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openDetail(m); }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-900 hover:bg-primary-50 transition-colors"
            title="Voir détails"
          >
            <Eye className="w-4 h-4" />
          </button>
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); openEdit(m); }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-900 hover:bg-primary-50 transition-colors"
              title="Modifier"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(m); }}
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
        title="Gestion des mandataires"
        description="Annuaire centralisé des mandataires et élus du parti"
        icon={<Users className="w-5 h-5" />}
        actions={
          canCreate && (
            <button onClick={openCreate} className="btn-primary">
              <Plus className="w-4 h-4" />
              Nouveau mandataire
            </button>
          )
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
          <>
            <div className="w-40">
              <Select
                value={filterStatut}
                onChange={setFilterStatut}
                options={Object.entries(MANDATAIRE_STATUT_LABELS).map(([value, label]) => ({ value, label }))}
                placeholder="Tous statuts"
              />
            </div>
            <div className="w-44">
              <Select
                value={filterStructure}
                onChange={setFilterStructure}
                options={structures.map((s) => ({ value: s.id, label: s.name }))}
                placeholder="Toutes structures"
              />
            </div>
            <div className="w-36">
              <Select
                value={filterSexe}
                onChange={setFilterSexe}
                options={Object.entries(SEXE_LABELS).map(([value, label]) => ({ value, label }))}
                placeholder="Tous sexes"
              />
            </div>
            {(filterStatut || filterStructure || filterSexe) && (
              <button
                onClick={() => { setFilterStatut(''); setFilterStructure(''); setFilterSexe(''); }}
                className="text-sm text-neutral-500 hover:text-neutral-700"
              >
                Réinitialiser
              </button>
            )}
          </>
        )}
        <div className="ml-auto text-sm text-neutral-500">
          {filtered.length} mandataire{filtered.length > 1 ? 's' : ''}
        </div>
      </div>

      {filtered.length === 0 && !loading ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title={searchQuery || filterStatut || filterStructure || filterSexe ? 'Aucun mandataire trouvé' : 'Aucun mandataire enregistré'}
            description={
              searchQuery || filterStatut || filterStructure || filterSexe
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Commencez par ajouter votre premier mandataire.'
            }
            action={
              canCreate && !searchQuery && !filterStatut && !filterStructure && !filterSexe ? (
                <button onClick={openCreate} className="btn-primary">
                  <Plus className="w-4 h-4" />
                  Ajouter un mandataire
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          rowKey={(m) => m.id}
          emptyMessage="Aucun mandataire trouvé"
          emptyIcon={Users}
          onRowClick={openDetail}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier le mandataire' : 'Nouveau mandataire'}
        description="Renseignez les informations personnelles et professionnelles"
        size="xl"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary" disabled={saving}>
              Annuler
            </button>
            <button onClick={handleSubmit} className="btn-primary" disabled={saving}>
              {saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer le mandataire'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-900" />
              Informations personnelles
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="Matricule interne" required>
                <input
                  type="text"
                  value={form.matricule}
                  onChange={(e) => setForm({ ...form, matricule: e.target.value })}
                  className="input-field font-mono"
                  required
                />
              </FormField>
              <FormField label="Nom" required>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="input-field"
                  required
                />
              </FormField>
              <FormField label="Postnom" required>
                <input
                  type="text"
                  value={form.postnom}
                  onChange={(e) => setForm({ ...form, postnom: e.target.value })}
                  className="input-field"
                  required
                />
              </FormField>
              <FormField label="Prénom" required>
                <input
                  type="text"
                  value={form.prenom}
                  onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                  className="input-field"
                  required
                />
              </FormField>
              <FormField label="Sexe" required>
                <Select
                  value={form.sexe}
                  onChange={(v) => setForm({ ...form, sexe: v as MandataireSexe })}
                  options={Object.entries(SEXE_LABELS).map(([value, label]) => ({ value, label }))}
                />
              </FormField>
              <FormField label="Date de naissance">
                <input
                  type="date"
                  value={form.date_naissance}
                  onChange={(e) => setForm({ ...form, date_naissance: e.target.value })}
                  className="input-field"
                />
              </FormField>
              <FormField label="Province d'origine">
                <Select
                  value={form.province_origine}
                  onChange={(v) => setForm({ ...form, province_origine: v })}
                  options={PROVINCES.map((p) => ({ value: p, label: p }))}
                  placeholder="Sélectionner..."
                />
              </FormField>
              <FormField label="Téléphone">
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  placeholder="+243..."
                  className="input-field"
                />
              </FormField>
              <FormField label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                />
              </FormField>
              <div className="sm:col-span-2 lg:col-span-3">
                <FormField label="Adresse">
                  <input
                    type="text"
                    value={form.adresse}
                    onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                    className="input-field"
                  />
                </FormField>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary-900" />
              Informations professionnelles
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="Structure d'affectation">
                <Select
                  value={form.structure_id}
                  onChange={(v) => setForm({ ...form, structure_id: v })}
                  options={structures.map((s) => ({ value: s.id, label: s.name }))}
                  placeholder="Sélectionner..."
                />
              </FormField>
              <FormField label="Poste actuel">
                <input
                  type="text"
                  value={form.poste_actuel}
                  onChange={(e) => setForm({ ...form, poste_actuel: e.target.value })}
                  className="input-field"
                />
              </FormField>
              <FormField label="Date de nomination">
                <input
                  type="date"
                  value={form.date_nomination}
                  onChange={(e) => setForm({ ...form, date_nomination: e.target.value })}
                  className="input-field"
                />
              </FormField>
              <FormField label="Ancienneté">
                <input
                  type="text"
                  value={form.anciennete}
                  onChange={(e) => setForm({ ...form, anciennete: e.target.value })}
                  placeholder="Ex: 5 ans"
                  className="input-field"
                />
              </FormField>
              <FormField label="Niveau d'études">
                <input
                  type="text"
                  value={form.niveau_etudes}
                  onChange={(e) => setForm({ ...form, niveau_etudes: e.target.value })}
                  placeholder="Ex: Master en Droit"
                  className="input-field"
                />
              </FormField>
              <FormField label="Statut">
                <Select
                  value={form.statut}
                  onChange={(v) => setForm({ ...form, statut: v as MandataireStatut })}
                  options={Object.entries(MANDATAIRE_STATUT_LABELS).map(([value, label]) => ({ value, label }))}
                />
              </FormField>
              <div className="sm:col-span-2 lg:col-span-3">
                <FormField label="Compétences">
                  <Textarea
                    value={form.competences}
                    onChange={(v) => setForm({ ...form, competences: v })}
                    placeholder="Listez les compétences principales..."
                    rows={2}
                  />
                </FormField>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <FormField label="Expériences professionnelles">
                  <Textarea
                    value={form.experiences}
                    onChange={(v) => setForm({ ...form, experiences: v })}
                    placeholder="Décrivez les expériences pertinentes..."
                    rows={2}
                  />
                </FormField>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary-900" />
              Évolution politique
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <FormField label="Ambitions futures">
                <Textarea
                  value={form.ambitions}
                  onChange={(v) => setForm({ ...form, ambitions: v })}
                  placeholder="Ex: Ministre, Coordonnateur provincial..."
                  rows={2}
                />
              </FormField>
              <FormField label="Observations">
                <Textarea
                  value={form.observations}
                  onChange={(v) => setForm({ ...form, observations: v })}
                  placeholder="Notes et observations diverses..."
                  rows={2}
                />
              </FormField>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title="Détails du mandataire"
        size="xl"
        footer={
          <>
            {canEdit && detailTarget && (
              <button
                onClick={() => {
                  openEdit(detailTarget);
                  setDetailTarget(null);
                }}
                className="btn-secondary"
              >
                <Pencil className="w-4 h-4" />
                Modifier
              </button>
            )}
            <button onClick={() => setDetailTarget(null)} className="btn-primary">
              Fermer
            </button>
          </>
        }
      >
        {detailTarget && (
          <div className="space-y-6">
            <div className="flex items-start gap-4 pb-6 border-b border-neutral-100">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${detailTarget.sexe === 'F' ? 'bg-accent-50 text-accent-700' : 'bg-primary-50 text-primary-900'}`}>
                {getInitials(`${detailTarget.prenom} ${detailTarget.nom}`)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-neutral-900">
                  {detailTarget.prenom} {detailTarget.nom} {detailTarget.postnom}
                </h3>
                <p className="text-sm text-neutral-500 mt-0.5">{detailTarget.poste_actuel ?? '—'}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="font-mono text-xs text-neutral-400">{detailTarget.matricule}</span>
                  <Badge variant={STATUT_VARIANT[detailTarget.statut]} dot>
                    {MANDATAIRE_STATUT_LABELS[detailTarget.statut]}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <InfoRow icon={Building2} label="Structure" value={getStructureName(detailTarget.structure_id)} />
              <InfoRow icon={Calendar} label="Date de naissance" value={formatDate(detailTarget.date_naissance)} />
              <InfoRow icon={MapPin} label="Province d'origine" value={detailTarget.province_origine ?? '—'} />
              <InfoRow icon={Phone} label="Téléphone" value={detailTarget.telephone ?? '—'} />
              <InfoRow icon={Mail} label="Email" value={detailTarget.email ?? '—'} />
              <InfoRow icon={MapPin} label="Adresse" value={detailTarget.adresse ?? '—'} />
              <InfoRow icon={Briefcase} label="Date de nomination" value={formatDate(detailTarget.date_nomination)} />
              <InfoRow icon={Clock} label="Ancienneté" value={detailTarget.anciennete ?? '—'} />
              <InfoRow icon={GraduationCap} label="Niveau d'études" value={detailTarget.niveau_etudes ?? '—'} />
            </div>

            {(detailTarget.competences || detailTarget.experiences) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {detailTarget.competences && (
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Compétences</p>
                    <p className="text-sm text-neutral-700">{detailTarget.competences}</p>
                  </div>
                )}
                {detailTarget.experiences && (
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Expériences</p>
                    <p className="text-sm text-neutral-700">{detailTarget.experiences}</p>
                  </div>
                )}
              </div>
            )}

            {(detailTarget.ambitions || detailTarget.observations) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {detailTarget.ambitions && (
                  <div className="p-4 bg-primary-50/50 rounded-lg border border-primary-100">
                    <p className="text-xs font-semibold text-primary-900 uppercase tracking-wider mb-2">Ambitions futures</p>
                    <p className="text-sm text-neutral-700">{detailTarget.ambitions}</p>
                  </div>
                )}
                {detailTarget.observations && (
                  <div className="p-4 bg-accent-50/50 rounded-lg border border-accent-100">
                    <p className="text-xs font-semibold text-accent-700 uppercase tracking-wider mb-2">Observations</p>
                    <p className="text-sm text-neutral-700">{detailTarget.observations}</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-900" />
                  Documents joints
                </h4>
                {hasPermission(role, 'mandataires.edit') && (
                  <button
                    onClick={() => { setDocType('cv'); setDocFile(null); setDocModalOpen(true); }}
                    className="btn-secondary text-sm py-2"
                  >
                    <Upload className="w-4 h-4" />
                    Téléverser
                  </button>
                )}
              </div>
              {detailTarget.documents && detailTarget.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {detailTarget.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                      <div className="w-9 h-9 rounded-lg bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-neutral-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">{doc.file_name}</p>
                        <p className="text-xs text-neutral-400">
                          {DOCUMENT_TYPE_LABELS[doc.type]} • {formatDate(doc.uploaded_at)}
                        </p>
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-900 hover:bg-white transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {hasPermission(role, 'mandataires.delete') && (
                        <button
                          onClick={() => handleDeleteDoc(doc)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-white transition-colors"
                          title="Supprimer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-neutral-50 rounded-lg text-center">
                  <FileText className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">Aucun document joint</p>
                </div>
              )}
            </div>

            {detailTarget.cotisations && detailTarget.cotisations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary-900" />
                  Cotisations récentes
                </h4>
                <div className="space-y-2">
                  {detailTarget.cotisations.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-neutral-800">{formatCurrency(Number(c.montant))}</p>
                        <p className="text-xs text-neutral-400">{formatDate(c.date_paiement)}</p>
                      </div>
                      <Badge variant="primary">{c.type}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        title="Téléverser un document"
        size="sm"
        footer={
          <>
            <button onClick={() => setDocModalOpen(false)} className="btn-secondary" disabled={uploadingDoc}>
              Annuler
            </button>
            <button onClick={handleUploadDoc} className="btn-primary" disabled={uploadingDoc || !docFile}>
              {uploadingDoc ? 'Téléversement...' : 'Téléverser'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Type de document" required>
            <Select
              value={docType}
              onChange={(v) => setDocType(v as DocumentType)}
              options={Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </FormField>
          <FormField label="Fichier" required>
            <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-neutral-200 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors">
              {docFile ? (
                <>
                  <FileText className="w-8 h-8 text-primary-900" />
                  <p className="text-sm font-medium text-neutral-700">{docFile.name}</p>
                  <p className="text-xs text-neutral-400">{(docFile.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-neutral-400" />
                  <p className="text-sm text-neutral-500">Cliquez pour sélectionner un fichier</p>
                  <p className="text-xs text-neutral-400">PDF, JPG, PNG (max 10MB)</p>
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </FormField>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le mandataire"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.prenom} ${deleteTarget?.nom}" ? Toutes les données associées seront perdues.`}
        confirmLabel="Supprimer"
        danger
      />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-neutral-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-neutral-400">{label}</p>
        <p className="text-sm font-medium text-neutral-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
