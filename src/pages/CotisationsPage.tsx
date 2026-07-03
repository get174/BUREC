import { useEffect, useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  Filter,
  Download,
  FileText,
  AlertTriangle,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { useAuth, useRole } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { FormField, Select, Textarea } from '../components/ui/FormField';
import { EmptyState } from '../components/ui/EmptyState';
import {
  fetchCotisations,
  fetchMandataires,
  createCotisation,
  updateCotisation,
  deleteCotisation,
  logActivity,
} from '../lib/api';
import { hasPermission } from '../lib/permissions';
import {
  formatCurrency,
  formatDate,
  COTISATION_TYPE_LABELS,
  MODE_PAIEMENT_LABELS,
  MANDATAIRE_STATUT_LABELS,
} from '../lib/format';
import { downloadReceipt, exportToCSV } from '../lib/pdf';
import type { Cotisation, Mandataire, CotisationType, ModePaiement } from '../types';

interface CotisationsPageProps {
  searchQuery: string;
}

const TYPE_VARIANT: Record<CotisationType, 'primary' | 'accent' | 'success'> = {
  mensuelle: 'primary',
  don: 'accent',
  exceptionnelle: 'success',
};

export function CotisationsPage({ searchQuery }: CotisationsPageProps) {
  const { profile } = useAuth();
  const role = useRole();
  const { toast } = useToast();

  const [cotisations, setCotisations] = useState<Cotisation[]>([]);
  const [mandataires, setMandataires] = useState<Mandataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cotisation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cotisation | null>(null);
  const [saving, setSaving] = useState(false);

  const [filterType, setFilterType] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showRetardataires, setShowRetardataires] = useState(false);

  const canCreate = hasPermission(role, 'cotisations.create');
  const canEdit = hasPermission(role, 'cotisations.edit');
  const canDelete = hasPermission(role, 'cotisations.delete');
  const canExport = hasPermission(role, 'reports.export');

  const [form, setForm] = useState({
    mandataire_id: '',
    type: 'mensuelle' as CotisationType,
    montant: '',
    date_paiement: new Date().toISOString().slice(0, 10),
    mode_paiement: 'especes' as ModePaiement,
    reference: '',
    commentaire: '',
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([fetchCotisations(), fetchMandataires()]);
      setCotisations(c);
      setMandataires(m);
    } catch (err) {
      console.error(err);
      toast('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  }

  const mandataireMap = useMemo(() => {
    const map = new Map<string, Mandataire>();
    mandataires.forEach((m) => map.set(m.id, m));
    return map;
  }, [mandataires]);

  const filtered = useMemo(() => {
    return cotisations.filter((c) => {
      const m = mandataireMap.get(c.mandataire_id);
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        m?.nom.toLowerCase().includes(q) ||
        m?.postnom.toLowerCase().includes(q) ||
        m?.prenom.toLowerCase().includes(q) ||
        m?.matricule.toLowerCase().includes(q) ||
        c.reference?.toLowerCase().includes(q);
      const matchType = !filterType || c.type === filterType;
      const matchMode = !filterMode || c.mode_paiement === filterMode;
      return matchSearch && matchType && matchMode;
    });
  }, [cotisations, mandataireMap, searchQuery, filterType, filterMode]);

  const totalAmount = filtered.reduce((sum, c) => sum + Number(c.montant), 0);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthAmount = cotisations
    .filter((c) => {
      const d = new Date(c.date_paiement);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, c) => sum + Number(c.montant), 0);

  const retardataires = useMemo(() => {
    return mandataires.filter((m) => {
      if (m.statut !== 'actif') return false;
      const hasThisMonth = cotisations.some((c) => {
        const d = new Date(c.date_paiement);
        return c.mandataire_id === m.id && c.type === 'mensuelle' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      return !hasThisMonth;
    });
  }, [mandataires, cotisations, currentMonth, currentYear]);

  function openCreate() {
    setEditing(null);
    setForm({
      mandataire_id: '',
      type: 'mensuelle',
      montant: '',
      date_paiement: new Date().toISOString().slice(0, 10),
      mode_paiement: 'especes',
      reference: '',
      commentaire: '',
    });
    setModalOpen(true);
  }

  function openEdit(c: Cotisation) {
    setEditing(c);
    setForm({
      mandataire_id: c.mandataire_id,
      type: c.type,
      montant: String(c.montant),
      date_paiement: c.date_paiement,
      mode_paiement: c.mode_paiement,
      reference: c.reference ?? '',
      commentaire: c.commentaire ?? '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.mandataire_id) {
      toast('Sélectionnez un mandataire', 'error');
      return;
    }
    if (!form.montant || Number(form.montant) <= 0) {
      toast('Le montant doit être supérieur à 0', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        mandataire_id: form.mandataire_id,
        type: form.type,
        montant: Number(form.montant),
        date_paiement: form.date_paiement,
        mode_paiement: form.mode_paiement,
        reference: form.reference || null,
        commentaire: form.commentaire || null,
        recorded_by: profile?.id ?? null,
      };
      if (editing) {
        await updateCotisation(editing.id, payload);
        await logActivity('UPDATE_COTISATION', 'cotisation', { id: editing.id });
        toast('Cotisation mise à jour', 'success');
      } else {
        const created = await createCotisation(payload);
        await logActivity('CREATE_COTISATION', 'cotisation', { id: created.id, montant: payload.montant });
        toast('Cotisation enregistrée avec succès', 'success');
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
      await deleteCotisation(deleteTarget.id);
      await logActivity('DELETE_COTISATION', 'cotisation', { id: deleteTarget.id });
      toast('Cotisation supprimée', 'success');
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.error(err);
      toast('Erreur lors de la suppression', 'error');
    }
  }

  function handleReceipt(c: Cotisation) {
    const m = mandataireMap.get(c.mandataire_id);
    downloadReceipt(c, m);
  }

  function handleExport() {
    exportToCSV(
      filtered,
      [
        { key: 'date', label: 'Date', format: (c) => formatDate(c.date_paiement) },
        { key: 'mandataire', label: 'Mandataire', format: (c) => {
          const m = mandataireMap.get(c.mandataire_id);
          return m ? `${m.prenom} ${m.nom} ${m.postnom} (${m.matricule})` : c.mandataire_id;
        }},
        { key: 'type', label: 'Type', format: (c) => COTISATION_TYPE_LABELS[c.type] },
        { key: 'montant', label: 'Montant', format: (c) => String(c.montant) },
        { key: 'mode_paiement', label: 'Mode', format: (c) => MODE_PAIEMENT_LABELS[c.mode_paiement] },
        { key: 'reference', label: 'Référence', format: (c) => c.reference ?? '' },
        { key: 'commentaire', label: 'Commentaire', format: (c) => c.commentaire ?? '' },
      ],
      `cotisations_${new Date().toISOString().slice(0, 10)}`
    );
    toast('Export CSV téléchargé', 'success');
  }

  const columns: Column<Cotisation>[] = [
    {
      key: 'date_paiement',
      header: 'Date',
      render: (c) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-neutral-600">{formatDate(c.date_paiement)}</span>
        </div>
      ),
    },
    {
      key: 'mandataire',
      header: 'Mandataire',
      render: (c) => {
        const m = mandataireMap.get(c.mandataire_id);
        return m ? (
          <div>
            <p className="font-medium text-neutral-900">{m.prenom} {m.nom}</p>
            <p className="text-xs text-neutral-400 font-mono">{m.matricule}</p>
          </div>
        ) : <span className="text-neutral-400">—</span>;
      },
    },
    {
      key: 'type',
      header: 'Type',
      render: (c) => <Badge variant={TYPE_VARIANT[c.type]}>{COTISATION_TYPE_LABELS[c.type]}</Badge>,
    },
    {
      key: 'montant',
      header: 'Montant',
      render: (c) => <span className="font-semibold text-neutral-900">{formatCurrency(Number(c.montant))}</span>,
    },
    {
      key: 'mode_paiement',
      header: 'Mode',
      render: (c) => <span className="text-neutral-600">{MODE_PAIEMENT_LABELS[c.mode_paiement]}</span>,
    },
    {
      key: 'reference',
      header: 'Référence',
      render: (c) => <span className="text-neutral-500 font-mono text-xs">{c.reference ?? '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleReceipt(c); }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-900 hover:bg-primary-50 transition-colors"
            title="Reçu PDF"
          >
            <FileText className="w-4 h-4" />
          </button>
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); openEdit(c); }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-900 hover:bg-primary-50 transition-colors"
              title="Modifier"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}
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
        title="Gestion des cotisations"
        description="Suivi financier des cotisations des mandataires"
        icon={<DollarSign className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-2">
            {canExport && (
              <button onClick={handleExport} className="btn-secondary">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
            {canCreate && (
              <button onClick={openCreate} className="btn-primary">
                <Plus className="w-4 h-4" />
                Enregistrer un paiement
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total filtré"
          value={formatCurrency(totalAmount)}
          icon={DollarSign}
          accent="primary"
          subtitle={`${filtered.length} paiement(s)`}
        />
        <StatCard
          label="Cotisations ce mois"
          value={formatCurrency(monthAmount)}
          icon={TrendingUp}
          accent="success"
          subtitle={new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        />
        <StatCard
          label="Retardataires"
          value={retardataires.length}
          icon={AlertTriangle}
          accent={retardataires.length > 0 ? 'warning' : 'success'}
          subtitle="Mandataires en retard"
        />
      </div>

      {retardataires.length > 0 && (
        <div className="card mb-6">
          <button
            onClick={() => setShowRetardataires((v) => !v)}
            className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-warning-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning-700" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-neutral-800">
                  {retardataires.length} mandataire(s) en retard de cotisation
                </p>
                <p className="text-xs text-neutral-500">Cliquez pour voir la liste détaillée</p>
              </div>
            </div>
            <Badge variant="warning" dot>Action requise</Badge>
          </button>
          {showRetardataires && (
            <div className="border-t border-neutral-100 p-4 space-y-2 animate-fade-in">
              {retardataires.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-warning-50/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-warning-100 text-warning-800 flex items-center justify-center text-xs font-semibold">
                      {m.prenom[0]}{m.nom[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-800">{m.prenom} {m.nom} {m.postnom}</p>
                      <p className="text-xs text-neutral-400">{m.matricule} • {m.poste_actuel ?? '—'}</p>
                    </div>
                  </div>
                  <Badge variant="warning">{MANDATAIRE_STATUT_LABELS[m.statut]}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                options={Object.entries(COTISATION_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                placeholder="Tous types"
              />
            </div>
            <div className="w-40">
              <Select
                value={filterMode}
                onChange={setFilterMode}
                options={Object.entries(MODE_PAIEMENT_LABELS).map(([value, label]) => ({ value, label }))}
                placeholder="Tous modes"
              />
            </div>
            {(filterType || filterMode) && (
              <button
                onClick={() => { setFilterType(''); setFilterMode(''); }}
                className="text-sm text-neutral-500 hover:text-neutral-700"
              >
                Réinitialiser
              </button>
            )}
          </>
        )}
        <div className="ml-auto text-sm text-neutral-500">
          {filtered.length} paiement{filtered.length > 1 ? 's' : ''}
        </div>
      </div>

      {filtered.length === 0 && !loading ? (
        <div className="card">
          <EmptyState
            icon={DollarSign}
            title={searchQuery || filterType || filterMode ? 'Aucune cotisation trouvée' : 'Aucune cotisation enregistrée'}
            description={
              searchQuery || filterType || filterMode
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Enregistrez votre premier paiement de cotisation.'
            }
            action={
              canCreate && !searchQuery && !filterType && !filterMode ? (
                <button onClick={openCreate} className="btn-primary">
                  <Plus className="w-4 h-4" />
                  Enregistrer un paiement
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
          rowKey={(c) => c.id}
          emptyMessage="Aucune cotisation trouvée"
          emptyIcon={DollarSign}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier la cotisation' : 'Enregistrer un paiement'}
        description="Renseignez les informations du paiement"
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary" disabled={saving}>
              Annuler
            </button>
            <button onClick={handleSubmit} className="btn-primary" disabled={saving}>
              {saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Mandataire" required>
            <Select
              value={form.mandataire_id}
              onChange={(v) => setForm({ ...form, mandataire_id: v })}
              options={mandataires.map((m) => ({
                value: m.id,
                label: `${m.prenom} ${m.nom} ${m.postnom} (${m.matricule})`,
              }))}
              placeholder="Sélectionner un mandataire..."
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Type de cotisation" required>
              <Select
                value={form.type}
                onChange={(v) => setForm({ ...form, type: v as CotisationType })}
                options={Object.entries(COTISATION_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </FormField>
            <FormField label="Montant (FC)" required>
              <input
                type="number"
                value={form.montant}
                onChange={(e) => setForm({ ...form, montant: e.target.value })}
                placeholder="0"
                min="0"
                step="any"
                className="input-field"
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Date de paiement" required>
              <input
                type="date"
                value={form.date_paiement}
                onChange={(e) => setForm({ ...form, date_paiement: e.target.value })}
                className="input-field"
                required
              />
            </FormField>
            <FormField label="Mode de paiement" required>
              <Select
                value={form.mode_paiement}
                onChange={(v) => setForm({ ...form, mode_paiement: v as ModePaiement })}
                options={Object.entries(MODE_PAIEMENT_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </FormField>
          </div>

          <FormField label="Référence" hint="Numéro de transaction, reçu bancaire, etc.">
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="Ex: VIR-2026-001"
              className="input-field"
            />
          </FormField>

          <FormField label="Commentaire">
            <Textarea
              value={form.commentaire}
              onChange={(v) => setForm({ ...form, commentaire: v })}
              placeholder="Notes supplémentaires..."
              rows={2}
            />
          </FormField>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer la cotisation"
        message="Êtes-vous sûr de vouloir supprimer cette cotisation ? Cette action est irréversible."
        confirmLabel="Supprimer"
        danger
      />
    </div>
  );
}
