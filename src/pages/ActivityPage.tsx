import { useEffect, useState, useMemo } from 'react';
import {
  History,
  Filter,
  LogIn,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Eye,
  DollarSign,
  Upload,
  Activity as ActivityIcon,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Select } from '../components/ui/FormField';
import { EmptyState } from '../components/ui/EmptyState';
import { fetchActivityLogs } from '../lib/api';
import { formatDateTime, timeAgo } from '../lib/format';
import { ROLE_SHORT } from '../lib/permissions';
import type { ActivityLog } from '../types';

interface ActivityPageProps {
  searchQuery: string;
}

const ACTION_ICONS: Record<string, typeof LogIn> = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  CREATE_STRUCTURE: Plus,
  UPDATE_STRUCTURE: Pencil,
  DELETE_STRUCTURE: Trash2,
  CREATE_MANDATAIRE: Plus,
  UPDATE_MANDATAIRE: Pencil,
  DELETE_MANDATAIRE: Trash2,
  CREATE_COTISATION: DollarSign,
  UPDATE_COTISATION: DollarSign,
  DELETE_COTISATION: DollarSign,
  VIEW_DASHBOARD: Eye,
  UPLOAD_DOCUMENT: Upload,
  UPDATE_USER: Pencil,
};

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Connexion',
  LOGOUT: 'Déconnexion',
  CREATE_STRUCTURE: 'Création structure',
  UPDATE_STRUCTURE: 'Modification structure',
  DELETE_STRUCTURE: 'Suppression structure',
  CREATE_MANDATAIRE: 'Ajout mandataire',
  UPDATE_MANDATAIRE: 'Modification mandataire',
  DELETE_MANDATAIRE: 'Suppression mandataire',
  CREATE_COTISATION: 'Enregistrement cotisation',
  UPDATE_COTISATION: 'Modification cotisation',
  DELETE_COTISATION: 'Suppression cotisation',
  VIEW_DASHBOARD: 'Consultation tableau de bord',
  UPLOAD_DOCUMENT: 'Téléversement document',
  UPDATE_USER: 'Modification utilisateur',
};

const ACTION_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'primary' | 'neutral'> = {
  LOGIN: 'success',
  LOGOUT: 'neutral',
  CREATE_STRUCTURE: 'success',
  UPDATE_STRUCTURE: 'primary',
  DELETE_STRUCTURE: 'error',
  CREATE_MANDATAIRE: 'success',
  UPDATE_MANDATAIRE: 'primary',
  DELETE_MANDATAIRE: 'error',
  CREATE_COTISATION: 'success',
  UPDATE_COTISATION: 'primary',
  DELETE_COTISATION: 'error',
  VIEW_DASHBOARD: 'neutral',
  UPLOAD_DOCUMENT: 'success',
  UPDATE_USER: 'primary',
};

export function ActivityPage({ searchQuery }: ActivityPageProps) {
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchActivityLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
      toast('Erreur lors du chargement du journal', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        l.action.toLowerCase().includes(q) ||
        l.user?.full_name.toLowerCase().includes(q) ||
        (ACTION_LABELS[l.action] ?? '').toLowerCase().includes(q);
      const matchAction = !filterAction || l.action === filterAction;
      return matchSearch && matchAction;
    });
  }, [logs, searchQuery, filterAction]);

  const actionOptions = Array.from(new Set(logs.map((l) => l.action)))
    .map((a) => ({ value: a, label: ACTION_LABELS[a] ?? a }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const columns: Column<ActivityLog>[] = [
    {
      key: 'action',
      header: 'Action',
      render: (l) => {
        const Icon = ACTION_ICONS[l.action] ?? ActivityIcon;
        const variant = ACTION_VARIANT[l.action] ?? 'neutral';
        const variantColors = {
          success: 'bg-success-50 text-success-600',
          warning: 'bg-warning-50 text-warning-700',
          error: 'bg-error-50 text-error-600',
          primary: 'bg-primary-50 text-primary-900',
          neutral: 'bg-neutral-100 text-neutral-500',
        };
        return (
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${variantColors[variant]}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-800">{ACTION_LABELS[l.action] ?? l.action}</p>
              {l.entity_type && (
                <p className="text-xs text-neutral-400">{l.entity_type}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'user',
      header: 'Utilisateur',
      render: (l) => l.user ? (
        <div>
          <p className="text-sm font-medium text-neutral-800">{l.user.full_name}</p>
          <p className="text-xs text-neutral-400">{l.user.role ? ROLE_SHORT[l.user.role] : ''}</p>
        </div>
      ) : <span className="text-neutral-400">Système</span>,
    },
    {
      key: 'details',
      header: 'Détails',
      render: (l) => {
        if (!l.details) return <span className="text-neutral-400">—</span>;
        const entries = Object.entries(l.details).slice(0, 2);
        return (
          <div className="text-xs text-neutral-500">
            {entries.map(([k, v]) => (
              <p key={k} className="truncate">
                <span className="text-neutral-400">{k}:</span> {String(v)}
              </p>
            ))}
          </div>
        );
      },
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (l) => (
        <div>
          <p className="text-sm text-neutral-700">{formatDateTime(l.created_at)}</p>
          <p className="text-xs text-neutral-400">{timeAgo(l.created_at)}</p>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Journal d'activités"
        description="Historique complet des actions effectuées dans le système"
        icon={<History className="w-5 h-5" />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-sm text-neutral-500">Total activités</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1 font-display">{logs.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-neutral-500">Aujourd'hui</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1 font-display">
            {logs.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-neutral-500">Utilisateurs actifs</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1 font-display">
            {new Set(logs.map((l) => l.user_id).filter(Boolean)).size}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`btn-secondary text-sm ${showFilters ? 'border-primary-300 text-primary-700' : ''}`}
        >
          <Filter className="w-4 h-4" />
          Filtres
        </button>
        {showFilters && (
          <div className="w-56">
            <Select
              value={filterAction}
              onChange={setFilterAction}
              options={actionOptions}
              placeholder="Toutes les actions"
            />
          </div>
        )}
        <div className="ml-auto text-sm text-neutral-500">
          {filtered.length} activité{filtered.length > 1 ? 's' : ''}
        </div>
      </div>

      {filtered.length === 0 && !loading ? (
        <div className="card">
          <EmptyState
            icon={History}
            title={searchQuery || filterAction ? 'Aucune activité trouvée' : 'Aucune activité enregistrée'}
            description="Les actions des utilisateurs apparaîtront ici"
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          rowKey={(l) => l.id}
          emptyMessage="Aucune activité trouvée"
          emptyIcon={History}
        />
      )}
    </div>
  );
}
