import { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  UserX,
  Clock,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { useAuth, useRole } from '../context/AuthContext';
import { StatCard } from '../components/ui/StatCard';
import { BarChart, DonutChart, LineChart } from '../components/ui/Charts';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { fetchDashboardStats, fetchActivityLogs, logActivity } from '../lib/api';
import type { DashboardStats, ActivityLog } from '../types';
import {
  formatCurrency,
  MANDATAIRE_STATUT_LABELS,
  COTISATION_TYPE_LABELS,
  timeAgo,
} from '../lib/format';
import { isAdmin, ROLE_SHORT } from '../lib/permissions';

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

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { profile } = useAuth();
  const role = useRole();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, l] = await Promise.all([fetchDashboardStats(), fetchActivityLogs()]);
        setStats(s);
        setLogs(l.slice(0, 6));
        await logActivity('VIEW_DASHBOARD', 'dashboard');
      } catch (err) {
        console.error('Erreur dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const admin = isAdmin(role);
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  })();

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${profile?.full_name?.split(' ')[0] ?? ''}`}
        description={
          admin
            ? 'Vue d\'ensemble nationale du système de gestion des mandataires'
            : `Vue d'ensemble de ${ROLE_SHORT[role ?? 'focal']}`
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
              label="Total Structures"
              value={stats.totalStructures}
              icon={Building2}
              accent="primary"
              subtitle={admin ? 'Toutes les structures' : 'Votre structure'}
            />
            <StatCard
              label="Total Mandataires"
              value={stats.totalMandataires}
              icon={Users}
              accent="success"
              subtitle={`${stats.mandatairesActifs} actifs`}
            />
            <StatCard
              label="Total Cotisations"
              value={formatCurrency(stats.totalCotisations)}
              icon={DollarSign}
              accent="accent"
              subtitle="Cette année"
            />
            <StatCard
              label="Taux de Cotisation"
              value={`${stats.tauxCotisation}%`}
              icon={TrendingUp}
              accent={stats.tauxCotisation >= 75 ? 'success' : 'warning'}
              subtitle={`${stats.retardataires} retardataires`}
            />
          </div>

          {stats.retardataires > 0 && (
            <div className="card p-4 mb-6 border-l-4 border-l-warning-400 bg-warning-50/50">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-warning-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-warning-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-warning-800">Alerte retardataires</p>
                  <p className="text-sm text-warning-700 mt-0.5">
                    {stats.retardataires} mandataire(s) n'ont pas payé leur cotisation ce mois-ci.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('cotisations')}
                  className="btn-secondary text-sm py-2"
                >
                  Voir détails
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="card p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">Évolution des cotisations</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Année {new Date().getFullYear()}</p>
                </div>
                <Badge variant="success" dot>
                  Temps réel
                </Badge>
              </div>
              <LineChart
                data={stats.cotisationsParMois.map((m) => ({ label: m.mois, value: m.montant }))}
                formatValue={(v) => formatCurrency(v)}
                height={240}
              />
            </div>

            <div className="card p-6">
              <h3 className="text-base font-semibold text-neutral-900 mb-6">Statut des mandataires</h3>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
                size={160}
              />
            </div>

            <div className="card p-6 lg:col-span-2">
              <h3 className="text-base font-semibold text-neutral-900 mb-6">Mandataires par province</h3>
              <BarChart
                data={stats.mandatairesParProvince.map((p) => ({ label: p.province, value: p.count }))}
                color="#0A8FEF"
                height={240}
              />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-neutral-400" />
                <h3 className="text-base font-semibold text-neutral-900">Activités récentes</h3>
              </div>
              <button
                onClick={() => onNavigate('activity')}
                className="text-sm text-primary-900 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                Voir tout
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1">
              {logs.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-8">Aucune activité récente</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">
                        {formatAction(log.action)}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {log.user?.full_name ?? 'Système'} • {timeAgo(log.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-sm text-neutral-500">Impossible de charger les données du tableau de bord.</p>
        </div>
      )}
    </div>
  );
}

function getActionIcon(action: string) {
  const map: Record<string, typeof UserCheck> = {
    LOGIN: UserCheck,
    LOGOUT: UserX,
    CREATE_STRUCTURE: Building2,
    CREATE_MANDATAIRE: Users,
    CREATE_COTISATION: DollarSign,
    VIEW_DASHBOARD: Activity,
    UPDATE_MANDATAIRE: Clock,
  };
  const Icon = map[action] ?? Activity;
  return <Icon className="w-4 h-4 text-neutral-500" />;
}

function formatAction(action: string): string {
  const labels: Record<string, string> = {
    LOGIN: 'Connexion au système',
    LOGOUT: 'Déconnexion',
    CREATE_STRUCTURE: 'Création d\'une structure',
    CREATE_MANDATAIRE: 'Ajout d\'un mandataire',
    CREATE_COTISATION: 'Enregistrement d\'une cotisation',
    VIEW_DASHBOARD: 'Consultation du tableau de bord',
    UPDATE_MANDATAIRE: 'Mise à jour d\'un mandataire',
  };
  return labels[action] ?? action;
}
