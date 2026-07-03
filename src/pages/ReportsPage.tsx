import { useEffect, useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  Users,
  Building2,
  DollarSign,
} from 'lucide-react';
import { useRole } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { BarChart, DonutChart, LineChart } from '../components/ui/Charts';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/FormField';
import { hasPermission } from '../lib/permissions';
import { fetchDashboardStats, fetchMandataires, fetchCotisations, fetchStructures } from '../lib/api';
import { exportToCSV } from '../lib/pdf';
import {
  formatCurrency,
  formatDate,
  MANDATAIRE_STATUT_LABELS,
  COTISATION_TYPE_LABELS,
  STRUCTURE_TYPE_LABELS,
} from '../lib/format';
import type { DashboardStats, Mandataire, Cotisation, Structure } from '../types';

const STATUT_COLORS: Record<string, string> = {
  actif: '#2DBE39',
  inactif: '#94a3b8',
  suspendu: '#F5D000',
  retraite: '#005FB8',
};

const TYPE_COLORS: Record<string, string> = {
  mensuelle: '#0A8FEF',
  don: '#F5D000',
  exceptionnelle: '#2DBE39',
};

export function ReportsPage() {
  const role = useRole();
  const { toast } = useToast();
  const canExport = hasPermission(role, 'reports.export');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [mandataires, setMandataires] = useState<Mandataire[]>([]);
  const [cotisations, setCotisations] = useState<Cotisation[]>([]);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('year');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [s, m, c, st] = await Promise.all([
        fetchDashboardStats(),
        fetchMandataires(),
        fetchCotisations(),
        fetchStructures(),
      ]);
      setStats(s);
      setMandataires(m);
      setCotisations(c);
      setStructures(st);
    } catch (err) {
      console.error(err);
      toast('Erreur lors du chargement des rapports', 'error');
    } finally {
      setLoading(false);
    }
  }

  const filteredCotisations = useMemo(() => {
    const now = new Date();
    return cotisations.filter((c) => {
      const d = new Date(c.date_paiement);
      if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (period === 'quarter') {
        const q = Math.floor(now.getMonth() / 3);
        const cq = Math.floor(d.getMonth() / 3);
        return q === cq && d.getFullYear() === now.getFullYear();
      }
      return d.getFullYear() === now.getFullYear();
    });
  }, [cotisations, period]);

  const totalAmount = filteredCotisations.reduce((sum, c) => sum + Number(c.montant), 0);

  const structureStats = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();
    structures.forEach((s) => {
      const count = mandataires.filter((m) => m.structure_id === s.id).length;
      const amount = filteredCotisations
        .filter((c) => mandataires.find((m) => m.id === c.mandataire_id)?.structure_id === s.id)
        .reduce((sum, c) => sum + Number(c.montant), 0);
      map.set(s.name, { count, amount });
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [structures, mandataires, filteredCotisations]);

  function handleExportMandataires() {
    exportToCSV(
      mandataires,
      [
        { key: 'matricule', label: 'Matricule' },
        { key: 'nom', label: 'Nom', format: (m) => `${m.prenom} ${m.nom} ${m.postnom}` },
        { key: 'sexe', label: 'Sexe' },
        { key: 'telephone', label: 'Téléphone', format: (m) => m.telephone ?? '' },
        { key: 'email', label: 'Email', format: (m) => m.email ?? '' },
        { key: 'poste', label: 'Poste', format: (m) => m.poste_actuel ?? '' },
        { key: 'statut', label: 'Statut' },
        { key: 'province', label: 'Province', format: (m) => m.province_origine ?? '' },
      ],
      `mandataires_${new Date().toISOString().slice(0, 10)}`
    );
    toast('Export mandataires téléchargé', 'success');
  }

  function handleExportCotisations() {
    exportToCSV(
      filteredCotisations,
      [
        { key: 'date', label: 'Date', format: (c) => formatDate(c.date_paiement) },
        { key: 'type', label: 'Type', format: (c) => COTISATION_TYPE_LABELS[c.type] },
        { key: 'montant', label: 'Montant', format: (c) => String(c.montant) },
        { key: 'mode', label: 'Mode', format: (c) => c.mode_paiement },
        { key: 'reference', label: 'Référence', format: (c) => c.reference ?? '' },
      ],
      `cotisations_${period}_${new Date().toISOString().slice(0, 10)}`
    );
    toast('Export cotisations téléchargé', 'success');
  }

  function handleExportStructures() {
    exportToCSV(
      structures,
      [
        { key: 'name', label: 'Nom' },
        { key: 'type', label: 'Type', format: (s) => STRUCTURE_TYPE_LABELS[s.type] },
        { key: 'province', label: 'Province', format: (s) => s.province ?? '' },
        { key: 'city', label: 'Ville', format: (s) => s.city ?? '' },
        { key: 'status', label: 'Statut' },
        { key: 'mandataires', label: 'Mandataires', format: (s) => String(mandataires.filter((m) => m.structure_id === s.id).length) },
      ],
      `structures_${new Date().toISOString().slice(0, 10)}`
    );
    toast('Export structures téléchargé', 'success');
  }

  return (
    <div>
      <PageHeader
        title="Rapports et statistiques"
        description="Analyse nationale des mandataires et cotisations"
        icon={<BarChart3 className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-2">
            <div className="w-44">
              <Select
                value={period}
                onChange={setPeriod}
                options={[
                  { value: 'month', label: 'Ce mois' },
                  { value: 'quarter', label: 'Ce trimestre' },
                  { value: 'year', label: 'Cette année' },
                ]}
              />
            </div>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 h-32">
              <div className="h-4 bg-neutral-100 rounded animate-pulse w-1/2 mb-3" />
              <div className="h-8 bg-neutral-100 rounded animate-pulse w-3/4" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Structures actives"
              value={structures.filter((s) => s.status === 'active').length}
              icon={Building2}
              accent="primary"
              subtitle={`sur ${structures.length} total`}
            />
            <StatCard
              label="Mandataires actifs"
              value={stats.mandatairesActifs}
              icon={Users}
              accent="success"
              subtitle={`sur ${stats.totalMandataires} total`}
            />
            <StatCard
              label="Cotisations période"
              value={formatCurrency(totalAmount)}
              icon={DollarSign}
              accent="accent"
              subtitle={`${filteredCotisations.length} paiements`}
            />
            <StatCard
              label="Taux de cotisation"
              value={`${stats.tauxCotisation}%`}
              icon={TrendingUp}
              accent={stats.tauxCotisation >= 75 ? 'success' : 'warning'}
              subtitle={`${stats.retardataires} retardataires`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="card p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">Évolution mensuelle des cotisations</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Année {new Date().getFullYear()}</p>
                </div>
                <Badge variant="primary" dot>Annuel</Badge>
              </div>
              <LineChart
                data={stats.cotisationsParMois.map((m) => ({ label: m.mois, value: m.montant }))}
                formatValue={(v) => formatCurrency(v)}
                height={260}
              />
            </div>

            <div className="card p-6">
              <h3 className="text-base font-semibold text-neutral-900 mb-6">Répartition par statut</h3>
              <DonutChart
                data={stats.mandatairesParStatut.map((s) => ({
                  label: MANDATAIRE_STATUT_LABELS[s.statut as keyof typeof MANDATAIRE_STATUT_LABELS] ?? s.statut,
                  value: s.count,
                  color: STATUT_COLORS[s.statut] ?? '#94a3b8',
                }))}
                centerValue={`${stats.totalMandataires}`}
                centerLabel="Total"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="card p-6">
              <h3 className="text-base font-semibold text-neutral-900 mb-6">Cotisations par type</h3>
              <DonutChart
                data={stats.cotisationsParType.map((c) => ({
                  label: COTISATION_TYPE_LABELS[c.type as keyof typeof COTISATION_TYPE_LABELS] ?? c.type,
                  value: c.montant,
                  color: TYPE_COLORS[c.type] ?? '#94a3b8',
                }))}
                centerValue={formatCurrency(stats.totalCotisations)}
                centerLabel="Total"
              />
            </div>

            <div className="card p-6">
              <h3 className="text-base font-semibold text-neutral-900 mb-6">Top structures par cotisations</h3>
              <BarChart
                data={structureStats.map((s) => ({ label: s.name, value: s.amount }))}
                color="#0A8FEF"
                height={240}
                formatValue={(v) => formatCurrency(v)}
              />
            </div>
          </div>

          <div className="card p-6 mb-6">
            <h3 className="text-base font-semibold text-neutral-900 mb-4">Détail par structure</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider py-3 px-4">Structure</th>
                    <th className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider py-3 px-4">Type</th>
                    <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider py-3 px-4">Mandataires</th>
                    <th className="text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider py-3 px-4">Cotisations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {structureStats.map((s) => {
                    const structure = structures.find((st) => st.name === s.name);
                    return (
                      <tr key={s.name} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-neutral-800">{s.name}</td>
                        <td className="py-3 px-4 text-sm text-neutral-600">
                          {structure ? STRUCTURE_TYPE_LABELS[structure.type] : '—'}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-neutral-700">{s.count}</td>
                        <td className="py-3 px-4 text-sm text-right font-semibold text-neutral-900">
                          {formatCurrency(s.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {canExport && (
            <div className="card p-6">
              <h3 className="text-base font-semibold text-neutral-900 mb-1">Exports disponibles</h3>
              <p className="text-sm text-neutral-500 mb-4">Téléchargez les données au format CSV (compatible Excel)</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={handleExportMandataires} className="card p-4 text-left hover:shadow-soft transition-shadow group">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-900 flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-800">Mandataires</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{mandataires.length} enregistrements</p>
                  <div className="flex items-center gap-1 mt-3 text-primary-900 text-xs font-medium">
                    <Download className="w-3.5 h-3.5" />
                    Télécharger CSV
                  </div>
                </button>

                <button onClick={handleExportCotisations} className="card p-4 text-left hover:shadow-soft transition-shadow group">
                  <div className="w-10 h-10 rounded-lg bg-accent-50 text-accent-700 flex items-center justify-center mb-3 group-hover:bg-accent-100 transition-colors">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-800">Cotisations</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{filteredCotisations.length} enregistrements</p>
                  <div className="flex items-center gap-1 mt-3 text-primary-900 text-xs font-medium">
                    <Download className="w-3.5 h-3.5" />
                    Télécharger CSV
                  </div>
                </button>

                <button onClick={handleExportStructures} className="card p-4 text-left hover:shadow-soft transition-shadow group">
                  <div className="w-10 h-10 rounded-lg bg-success-50 text-success-600 flex items-center justify-center mb-3 group-hover:bg-success-100 transition-colors">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-800">Structures</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{structures.length} enregistrements</p>
                  <div className="flex items-center gap-1 mt-3 text-primary-900 text-xs font-medium">
                    <Download className="w-3.5 h-3.5" />
                    Télécharger CSV
                  </div>
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card p-12 text-center">
          <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">Impossible de charger les rapports.</p>
        </div>
      )}
    </div>
  );
}
