import { useEffect, useState, useMemo } from 'react';
import {
  Contact,
  Plus,
  Pencil,
  Trash2,
  Phone,
  Building2,
} from 'lucide-react';
import { useRole } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import { EmptyState } from '../components/ui/EmptyState';
import {
  fetchPointFocaux,
  createPointFocal,
  updatePointFocal,
  deletePointFocal,
  logActivity,
} from '../lib/api';
import { hasPermission } from '../lib/permissions';
import type { PointFocal } from '../types';

interface PointFocauxPageProps {
  searchQuery: string;
}

export function PointFocauxPage({ searchQuery }: PointFocauxPageProps) {
  const role = useRole();
  const { toast } = useToast();

  const [points, setPoints] = useState<PointFocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PointFocal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PointFocal | null>(null);
  const [saving, setSaving] = useState(false);

  const canCreate = hasPermission(role, 'pointfocaux.create');
  const canEdit = hasPermission(role, 'pointfocaux.edit');
  const canDelete = hasPermission(role, 'pointfocaux.delete');

  const [form, setForm] = useState({
    numero: '',
    structure: '',
    nom_point_focal: '',
    contact: '',
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchPointFocaux();
      setPoints(data);
    } catch (err) {
      console.error(err);
      toast('Erreur lors du chargement des points focaux', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return points.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        !q ||
        p.structure.toLowerCase().includes(q) ||
        p.nom_point_focal.toLowerCase().includes(q) ||
        (p.contact ?? '').toLowerCase().includes(q)
      );
    });
  }, [points, searchQuery]);

  function openCreate() {
    setEditing(null);
    const nextNumero = points.length > 0 ? Math.max(...points.map((p) => p.numero)) + 1 : 1;
    setForm({
      numero: String(nextNumero),
      structure: '',
      nom_point_focal: '',
      contact: '',
    });
    setModalOpen(true);
  }

  function openEdit(p: PointFocal) {
    setEditing(p);
    setForm({
      numero: String(p.numero),
      structure: p.structure,
      nom_point_focal: p.nom_point_focal,
      contact: p.contact ?? '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.structure.trim()) {
      toast('Le nom de la structure est obligatoire', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        numero: parseInt(form.numero, 10) || 0,
        structure: form.structure.trim(),
        nom_point_focal: form.nom_point_focal.trim() || '—',
        contact: form.contact.trim() || null,
      };
      if (editing) {
        await updatePointFocal(editing.id, payload);
        await logActivity('UPDATE_POINT_FOCAL', 'point_focal', { id: editing.id, structure: form.structure });
        toast('Point focal mis à jour avec succès', 'success');
      } else {
        const created = await createPointFocal(payload);
        await logActivity('CREATE_POINT_FOCAL', 'point_focal', { id: created.id, structure: form.structure });
        toast('Point focal ajouté avec succès', 'success');
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
      await deletePointFocal(deleteTarget.id);
      await logActivity('DELETE_POINT_FOCAL', 'point_focal', { id: deleteTarget.id });
      toast('Point focal supprimé', 'success');
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.error(err);
      toast('Erreur lors de la suppression', 'error');
    }
  }

  const columns: Column<PointFocal>[] = [
    {
      key: 'numero',
      header: 'N°',
      className: 'w-16',
      render: (p) => (
        <span className="font-mono text-sm font-bold text-primary-900">{p.numero}</span>
      ),
    },
    {
      key: 'structure',
      header: 'Structure',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-900 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4.5 h-4.5" />
          </div>
          <p className="font-medium text-neutral-900 truncate">{p.structure}</p>
        </div>
      ),
    },
    {
      key: 'nom_point_focal',
      header: 'Nom du Point Focal',
      render: (p) => (
        <span className="text-neutral-700 font-medium">{p.nom_point_focal}</span>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (p) =>
        p.contact ? (
          <div className="flex items-center gap-1.5 text-neutral-600">
            <Phone className="w-3.5 h-3.5 text-neutral-400" />
            <span className="font-mono text-sm">{p.contact}</span>
          </div>
        ) : (
          <span className="text-neutral-400">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEdit(p);
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
                setDeleteTarget(p);
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
        title="Points Focaux"
        description="Gestion des points focaux des structures"
        icon={<Contact className="w-5 h-5" />}
        actions={
          canCreate && (
            <button onClick={openCreate} className="btn-primary">
              <Plus className="w-4 h-4" />
              Nouveau point focal
            </button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="ml-auto text-sm text-neutral-500">
          {filtered.length} point{filtered.length > 1 ? 's' : ''} focal{filtered.length > 1 ? 'aux' : ''}
        </div>
      </div>

      {filtered.length === 0 && !loading ? (
        <div className="card">
          <EmptyState
            icon={Contact}
            title={searchQuery ? 'Aucun point focal trouvé' : 'Aucun point focal enregistré'}
            description={
              searchQuery
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Commencez par ajouter votre premier point focal.'
            }
            action={
              canCreate && !searchQuery ? (
                <button onClick={openCreate} className="btn-primary">
                  <Plus className="w-4 h-4" />
                  Ajouter un point focal
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
          rowKey={(p) => p.id}
          emptyMessage="Aucun point focal trouvé"
          emptyIcon={Contact}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier le point focal' : 'Nouveau point focal'}
        description="Renseignez les informations du point focal"
        size="md"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary" disabled={saving}>
              Annuler
            </button>
            <button onClick={handleSubmit} className="btn-primary" disabled={saving}>
              {saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="N°" required>
              <input
                type="number"
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
                placeholder="1"
                min="0"
                className="input-field"
                required
              />
            </FormField>
            <FormField label="Contact (téléphone)">
              <input
                type="tel"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="Ex: 0898915502"
                className="input-field"
              />
            </FormField>
          </div>

          <FormField label="Structure" required>
            <input
              type="text"
              value={form.structure}
              onChange={(e) => setForm({ ...form, structure: e.target.value })}
              placeholder="Ex: Cabinet MINCOMEXT"
              className="input-field"
              required
            />
          </FormField>

          <FormField label="Nom du point focal">
            <input
              type="text"
              value={form.nom_point_focal}
              onChange={(e) => setForm({ ...form, nom_point_focal: e.target.value })}
              placeholder="Ex: Maman BIBI"
              className="input-field"
            />
          </FormField>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le point focal"
        message={`Êtes-vous sûr de vouloir supprimer le point focal de "${deleteTarget?.structure}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        danger
      />
    </div>
  );
}
