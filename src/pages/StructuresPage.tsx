import { useEffect, useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  Users,
  Pencil,
  Trash2,
  Eye,
  Filter,
} from 'lucide-react';
import { useAuth, useRole } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { FormField, Select } from '../components/ui/FormField';
import { EmptyState } from '../components/ui/EmptyState';
import {
  fetchStructures,
  createStructure,
  updateStructure,
  deleteStructure,
  fetchMandataires,
  logActivity,
} from '../lib/api';
import { hasPermission, isAdmin } from '../lib/permissions';
import {
  STRUCTURE_TYPE_LABELS,
  STRUCTURE_STATUS_LABELS,
  PROVINCES,
  formatDate,
} from '../lib/format';
import type { Structure, StructureType, StructureStatus } from '../types';

interface StructuresPageProps {
  searchQuery: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

const TYPE_OPTIONS = Object.entries(STRUCTURE_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export function StructuresPage({ searchQuery, onNavigate }: StructuresPageProps) {
  const { profile } = useAuth();
  const role = useRole();
  const { toast } = useToast();
  const admin = isAdmin(role);

  const [structures, setStructures] = useState<Structure[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Structure | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Structure | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mandatairesByStructure, setMandatairesByStructure] = useState<Record<string, number>>({});

  const [form, setForm] = useState({
    name: '',
    type: 'ministere' as StructureType,
    address: '',
    province: '',
    city: '',
    status: 'active' as StructureStatus,
  });

  const canCreate = hasPermission(role, 'structures.create');
  const canEdit = hasPermission(role, 'structures.edit');
  const canDelete = hasPermission(role, 'structures.delete');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [data, mandataires] = await Promise.all([fetchStructures(), fetchMandataires()]);
      setStructures(data);
      const counts: Record<string, number> = {};
      mandataires.forEach((m) => {
        if (m.structure_id) counts[m.structure_id] = (counts[m.structure_id] ?? 0) + 1;
      });
      setMandatairesByStructure(counts);
    } catch (err) {
      console.error(err);
      toast('Erreur lors du chargement des structures', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return structures.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.province?.toLowerCase().includes(q);
      const matchType = !filterType || s.type === filterType;
      const matchStatus = !filterStatus || s.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [structures, searchQuery, filterType, filterStatus]);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', type: 'ministere', address: '', province: '', city: '', status: 'active' });
    setModalOpen(true);
  }

  function openEdit(s: Structure) {
    setEditing(s);
    setForm({
      name: s.name,
      type: s.type,
      address: s.address ?? '',
      province: s.province ?? '',
      city: s.city ?? '',
      status: s.status,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast('Le nom de la structure est obligatoire', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateStructure(editing.id, form);
        await logActivity('UPDATE_STRUCTURE', 'structure', { id: editing.id, name: form.name });
        toast('Structure mise à jour avec succès', 'success');
      } else {
        const created = await createStructure({ ...form, focal_id: admin ? null : profile?.id ?? null });
        await logActivity('CREATE_STRUCTURE', 'structure', { id: created.id, name: form.name });
        toast('Structure créée avec succès', 'success');
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

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteStructure(deleteTarget.id);
      await logActivity('DELETE_STRUCTURE', 'structure', { id: deleteTarget.id, name: deleteTarget.name });
      toast('Structure supprimée', 'success');
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.error(err);
      toast('Erreur lors de la suppression', 'error');
    }
  }

  const columns: Column<Structure>[] = [
    {
      key: 'name',
      header: 'Structure',
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-900 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-neutral-900 truncate">{s.name}</p>
            <p className="text-xs text-neutral-400">{STRUCTURE_TYPE_LABELS[s.type]}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Localisation',
      render: (s) => (
        <div className="flex items-center gap-1.5 text-neutral-600">
          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
          <span className="truncate">
            {s.city ?? '—'}{s.province ? `, ${s.province}` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'mandataires',
      header: 'Mandataires',
      render: (s) => (
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-medium text-neutral-700">{mandatairesByStructure[s.id] ?? 0}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (s) => (
        <Badge variant={s.status === 'active' ? 'success' : 'neutral'} dot>
          {STRUCTURE_STATUS_LABELS[s.status]}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Créée le',
      render: (s) => <span className="text-neutral-500">{formatDate(s.created_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('mandataires', { structureId: s.id });
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-900 hover:bg-primary-50 transition-colors"
            title="Voir les mandataires"
          >
            <Eye className="w-4 h-4" />
          </button>
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEdit(s);
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-900 hover:bg-primary-50 transition-colors"
              title="Modifier"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(s);
              }}
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
        title="Gestion des structures"
        description="Centralisation des structures publiques et privées"
        icon={<Building2 className="w-5 h-5" />}
        actions={
          canCreate && (
            <button onClick={openCreate} className="btn-primary">
              <Plus className="w-4 h-4" />
              Nouvelle structure
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
            <div className="w-44">
              <Select
                value={filterType}
                onChange={setFilterType}
                options={TYPE_OPTIONS}
                placeholder="Tous les types"
              />
            </div>
            <div className="w-40">
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { value: 'active', label: 'Actif' },
                  { value: 'inactive', label: 'Inactif' },
                ]}
                placeholder="Tous les statuts"
              />
            </div>
            {(filterType || filterStatus) && (
              <button
                onClick={() => {
                  setFilterType('');
                  setFilterStatus('');
                }}
                className="text-sm text-neutral-500 hover:text-neutral-700"
              >
                Réinitialiser
              </button>
            )}
          </>
        )}
        <div className="ml-auto text-sm text-neutral-500">
          {filtered.length} structure{filtered.length > 1 ? 's' : ''}
        </div>
      </div>

      {filtered.length === 0 && !loading ? (
        <div className="card">
          <EmptyState
            icon={Building2}
            title={searchQuery || filterType || filterStatus ? 'Aucune structure trouvée' : 'Aucune structure enregistrée'}
            description={
              searchQuery || filterType || filterStatus
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Commencez par ajouter votre première structure.'
            }
            action={
              canCreate && !searchQuery && !filterType && !filterStatus ? (
                <button onClick={openCreate} className="btn-primary">
                  <Plus className="w-4 h-4" />
                  Ajouter une structure
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
          rowKey={(s) => s.id}
          emptyMessage="Aucune structure trouvée"
          emptyIcon={Building2}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier la structure' : 'Nouvelle structure'}
        description="Renseignez les informations de la structure"
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary" disabled={saving}>
              Annuler
            </button>
            <button onClick={handleSubmit} className="btn-primary" disabled={saving}>
              {saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer la structure'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nom de la structure" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Ministère des Finances"
              className="input-field"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Type de structure" required>
              <Select
                value={form.type}
                onChange={(v) => setForm({ ...form, type: v as StructureType })}
                options={TYPE_OPTIONS}
              />
            </FormField>
            <FormField label="Statut" required>
              <Select
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v as StructureStatus })}
                options={[
                  { value: 'active', label: 'Actif' },
                  { value: 'inactive', label: 'Inactif' },
                ]}
              />
            </FormField>
          </div>

          <FormField label="Adresse">
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Ex: Avenue du Commerce 1"
              className="input-field"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Province">
              <Select
                value={form.province}
                onChange={(v) => setForm({ ...form, province: v })}
                options={PROVINCES.map((p) => ({ value: p, label: p }))}
                placeholder="Sélectionner..."
              />
            </FormField>
            <FormField label="Ville">
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Ex: Kinshasa"
                className="input-field"
              />
            </FormField>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer la structure"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.name}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        danger
      />
    </div>
  );
}
