import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(
        error === 'Invalid login credentials'
          ? 'Email ou mot de passe incorrect'
          : error
      );
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#005FB8] via-[#0A8FEF] to-[#005FB8] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)',
          backgroundSize: '60px 60px, 40px 40px',
        }} />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-success-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-warning-400/10 blur-3xl" />

        <div className="relative flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
              <svg viewBox="0 0 40 40" className="w-12 h-12">
                <circle cx="20" cy="20" r="20" fill="#2DBE39"/>
                <path d="M4 28 Q20 10 36 28" stroke="#F5D000" strokeWidth="3" fill="none"/>
                <ellipse cx="20" cy="24" rx="7" ry="6" fill="white"/>
                <ellipse cx="20" cy="16" rx="4" ry="4" fill="white"/>
                <polygon points="18,13 20,10 22,13" fill="white"/>
                <path d="M18 13 Q19 11 20 12 Q20 10 21 11 Q21 9 22 11 Q23 12 22 13" fill="#DC2626"/>
                <polygon points="23,16 26,17 23,18" fill="#F5D000"/>
                <path d="M13 20 Q8 16 10 12 Q12 18 13 22" fill="white"/>
                <path d="M12 22 Q6 20 8 15 Q11 21 12 24" fill="#e0e0e0"/>
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold font-display">SGMEP</p>
              <p className="text-xs text-white/70">BUREC • Gestion des Mandataires</p>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-3xl font-bold font-display leading-tight">
              Centralisez la gestion des mandataires et élus du parti
            </h1>
            <p className="text-white/80 mt-4 leading-relaxed">
              Une plateforme sécurisée pour gérer les structures, mandataires, cotisations financières et générer des rapports nationaux en temps réel.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              {[
                { label: 'Structures', value: '8+' },
                { label: 'Mandataires', value: '10+' },
                { label: 'Cotisations', value: '100%' },
                { label: 'Sécurité', value: 'RBAC' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <p className="text-2xl font-bold font-display">{stat.value}</p>
                  <p className="text-xs text-white/70 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/60">
            © 2026 SGMEP. Tous droits réservés. Préparation intégration BUREC Pilote.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-neutral-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-md overflow-hidden">
              <svg viewBox="0 0 40 40" className="w-11 h-11">
                <circle cx="20" cy="20" r="20" fill="#2DBE39"/>
                <path d="M4 28 Q20 10 36 28" stroke="#F5D000" strokeWidth="3" fill="none"/>
                <ellipse cx="20" cy="24" rx="7" ry="6" fill="white"/>
                <ellipse cx="20" cy="16" rx="4" ry="4" fill="white"/>
                <polygon points="18,13 20,10 22,13" fill="white"/>
                <path d="M18 13 Q19 11 20 12 Q20 10 21 11 Q21 9 22 11 Q23 12 22 13" fill="#DC2626"/>
                <polygon points="23,16 26,17 23,18" fill="#F5D000"/>
                <path d="M13 20 Q8 16 10 12 Q12 18 13 22" fill="white"/>
                <path d="M12 22 Q6 20 8 15 Q11 21 12 24" fill="#e0e0e0"/>
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-neutral-900 font-display">SGMEP</p>
              <p className="text-xs text-neutral-500">BUREC • Gestion des Mandataires</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-neutral-900 font-display">Connexion</h2>
          <p className="text-sm text-neutral-500 mt-1.5">Accédez à votre espace de gestion</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-error-50 border border-error-200 rounded-lg animate-fade-in">
                <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error-700">{error}</p>
              </div>
            )}

            <div>
              <label className="input-label">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@sgmep.cd"
                  className="input-field pl-10"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-neutral-300 text-success-500 focus:ring-success-500/20" />
                <span className="text-sm text-neutral-600">Se souvenir de moi</span>
              </label>
              <button type="button" className="text-sm text-primary-900 hover:text-primary-700 font-medium">
                Mot de passe oublié ?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-primary-50/50 border border-primary-100 rounded-lg">
            <p className="text-xs font-medium text-primary-900 mb-1">Compte de démonstration</p>
            <p className="text-xs text-primary-700">Email: admin@sgmep.cd</p>
            <p className="text-xs text-primary-700">Mot de passe: AdminSGMEP2026!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
