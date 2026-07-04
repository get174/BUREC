import { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  DollarSign,
  UserCog,
  BarChart3,
  History,
  Settings,
  LogOut,
  ChevronLeft,
  X,
  Contact,
} from 'lucide-react';
import { useAuth, useRole } from '../../context/AuthContext';
import { hasPermission, ROLE_SHORT, type Permission } from '../../lib/permissions';
import { getInitials } from '../../lib/format';

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  page: string;
  permission: Permission;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord',    icon: LayoutDashboard, page: 'dashboard',  permission: 'dashboard.view'  },
  { label: 'Structures',         icon: Building2,       page: 'structures', permission: 'structures.view' },
  { label: 'Mandataires',        icon: Users,           page: 'mandataires',permission: 'mandataires.view'},
  { label: 'Points Focaux',      icon: Contact,         page: 'pointfocaux',permission: 'pointfocaux.view'},
  { label: 'Cotisations',        icon: DollarSign,      page: 'cotisations',permission: 'cotisations.view'},
  { label: 'Utilisateurs',       icon: UserCog,         page: 'users',      permission: 'users.view'      },
  { label: 'Rapports',           icon: BarChart3,       page: 'reports',    permission: 'reports.view'    },
  { label: 'Journal d\'activités',icon: History,        page: 'activity',   permission: 'activity.view'   },
  { label: 'Paramètres',         icon: Settings,        page: 'settings',   permission: 'settings.manage' },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  currentPage,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { profile, signOut } = useAuth();
  const role = useRole();
  const [showSignOut, setShowSignOut] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(role, item.permission));

  const handleNavigate = (page: string) => {
    onNavigate(page);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen flex flex-col z-40
          transition-all duration-300 shadow-sidebar
          bg-[#005FB8]
          ${collapsed ? 'w-[72px]' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* ── Logo / brand ── */}
        <div className={`flex items-center h-16 border-b border-white/10 flex-shrink-0 ${collapsed ? 'justify-center px-0' : 'px-4 gap-3'}`}>
          {/* Party emblem */}
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
            {/* Remplacer le SVG par le logo fourni (placer le fichier dans /assets/burec-logo.png) */}
            <img src="/assets/burec-logo.svg" alt="BUREC" className="w-10 h-10 object-cover" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white font-bold text-sm font-display leading-tight tracking-wide">SGMEP</p>
              <p className="text-white/60 text-[10px] leading-tight truncate">BUREC • Gestion Mandataires</p>
            </div>
          )}
          {mobileOpen && (
            <button onClick={onCloseMobile} className="lg:hidden ml-auto text-white/60 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => handleNavigate(item.page)}
                title={collapsed ? item.label : undefined}
                className={`sidebar-link w-full ${active ? 'sidebar-link-active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* ── User profile ── */}
        <div className="p-3 border-t border-white/10 flex-shrink-0 space-y-1">
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {getInitials(profile?.full_name ?? 'U')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{profile?.full_name}</p>
                <p className="text-[11px] text-white/50 truncate">{role ? ROLE_SHORT[role] : ''}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setShowSignOut(true)}
            className={`sidebar-link w-full text-white/70 hover:bg-error-600/80 hover:text-white ${collapsed ? 'justify-center px-0' : ''}`}
            title={collapsed ? 'Déconnexion' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>

        {/* ── Collapse toggle (desktop) ── */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-neutral-200 items-center justify-center text-primary-900 hover:text-success-600 hover:border-success-400 shadow-sm transition-colors"
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* ── Sign-out confirmation ── */}
      {showSignOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm" onClick={() => setShowSignOut(false)} />
          <div className="relative bg-white rounded-2xl shadow-elevated p-6 max-w-sm w-full animate-scale-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-error-50 flex items-center justify-center mb-4">
                <LogOut className="w-7 h-7 text-error-600" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">Déconnexion</h3>
              <p className="text-sm text-neutral-500 mt-1">Voulez-vous vraiment vous déconnecter ?</p>
              <div className="flex gap-3 w-full mt-6">
                <button onClick={() => setShowSignOut(false)} className="btn-secondary flex-1 justify-center">Annuler</button>
                <button onClick={signOut} className="btn-danger flex-1 justify-center">Déconnecter</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
