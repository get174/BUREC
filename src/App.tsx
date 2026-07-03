import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LoginPage } from './pages/LoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { StructuresPage } from './pages/StructuresPage';
import { MandatairesPage } from './pages/MandatairesPage';
import { CotisationsPage } from './pages/CotisationsPage';
import { UsersPage } from './pages/UsersPage';
import { ReportsPage } from './pages/ReportsPage';
import { ActivityPage } from './pages/ActivityPage';
import { SettingsPage } from './pages/SettingsPage';
import { hasPermission } from './lib/permissions';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { session, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageParams, setPageParams] = useState<Record<string, string>>({});

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-900 animate-spin" />
          <p className="text-sm text-neutral-500">Chargement du système...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
        <div className="card p-8 max-w-md text-center">
          <div className="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-6 h-6 text-warning-700 animate-spin" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900">Profil en cours de chargement</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Votre profil utilisateur est en cours d'initialisation. Si ce message persiste, contactez l'administrateur.
          </p>
        </div>
      </div>
    );
  }

  function navigate(page: string, params: Record<string, string> = {}) {
    if (!hasPermission(profile?.role, `${page}.view` as never) && page !== 'settings') {
      const permMap: Record<string, string> = {
        dashboard: 'dashboard.view',
        structures: 'structures.view',
        mandataires: 'mandataires.view',
        cotisations: 'cotisations.view',
        users: 'users.view',
        reports: 'reports.view',
        activity: 'activity.view',
        settings: 'settings.manage',
      };
      const perm = permMap[page];
      if (perm && !hasPermission(profile?.role, perm as never)) {
        return;
      }
    }
    setCurrentPage(page);
    setPageParams(params);
    setSearchQuery('');
  }

  const searchPlaceholders: Record<string, string> = {
    dashboard: 'Rechercher...',
    structures: 'Rechercher une structure...',
    mandataires: 'Rechercher un mandataire...',
    cotisations: 'Rechercher une cotisation...',
    users: 'Rechercher un utilisateur...',
    activity: 'Rechercher une activité...',
    reports: 'Rechercher...',
    settings: 'Rechercher...',
  };

  function renderPage() {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={navigate} />;
      case 'structures':
        return <StructuresPage searchQuery={searchQuery} onNavigate={navigate} />;
      case 'mandataires':
        return <MandatairesPage searchQuery={searchQuery} filterStructureId={pageParams.structureId} />;
      case 'cotisations':
        return <CotisationsPage searchQuery={searchQuery} />;
      case 'users':
        return <UsersPage searchQuery={searchQuery} />;
      case 'reports':
        return <ReportsPage />;
      case 'activity':
        return <ActivityPage searchQuery={searchQuery} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={navigate} />;
    }
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onToggleMobile={() => setMobileSidebarOpen(true)}
          onNavigate={navigate}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={searchPlaceholders[currentPage]}
        />
        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
