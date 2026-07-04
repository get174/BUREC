import {
  Award,
  Phone,
  Mail,
  Building2,
  Calendar,
  Shield,
  Fingerprint,
  MapPin,
  Globe,
} from 'lucide-react';
import type { CarteType, Mandataire } from '../../types';
import { CARTE_TYPE_LABELS, formatDate, getInitials } from '../../lib/format';

interface MemberCardProps {
  mandataire: Mandataire;
  structureName?: string;
  side?: 'recto' | 'verso';
  printable?: boolean;
}

const CARTE_STYLES: Record<
  CarteType,
  {
    label: string;
    gradient: string;
    border: string;
    accent: string;
    textPrimary: string;
    textSecondary: string;
    chipBg: string;
    chipText: string;
    iconBg: string;
    iconText: string;
    glow: string;
    pattern: string;
    versoGradient: string;
    versoAccent: string;
    versoTextPrimary: string;
    versoTextSecondary: string;
  }
> = {
  premium: {
    label: 'PREMIUM',
    gradient: 'bg-gradient-to-br from-neutral-900 via-primary-950 to-neutral-900',
    border: 'border border-primary-500/40',
    accent: 'text-accent-400',
    textPrimary: 'text-white',
    textSecondary: 'text-primary-200',
    chipBg: 'bg-accent-400/15 border border-accent-400/40',
    chipText: 'text-accent-300',
    iconBg: 'bg-gradient-to-br from-accent-300 to-accent-500',
    iconText: 'text-neutral-900',
    glow: 'shadow-[0_20px_50px_-12px_rgba(245,208,0,0.35)]',
    pattern: 'from-accent-400/10 to-transparent',
    versoGradient: 'bg-gradient-to-br from-neutral-900 via-primary-950 to-neutral-900',
    versoAccent: 'text-accent-400',
    versoTextPrimary: 'text-white',
    versoTextSecondary: 'text-primary-200',
  },
  gold: {
    label: 'GOLD',
    gradient: 'bg-gradient-to-br from-accent-500 via-accent-600 to-accent-800',
    border: 'border border-accent-300/50',
    accent: 'text-accent-100',
    textPrimary: 'text-neutral-900',
    textSecondary: 'text-neutral-800',
    chipBg: 'bg-neutral-900/10 border border-neutral-900/20',
    chipText: 'text-neutral-900',
    iconBg: 'bg-gradient-to-br from-neutral-900 to-neutral-800',
    iconText: 'text-accent-400',
    glow: 'shadow-[0_20px_50px_-12px_rgba(245,208,0,0.45)]',
    pattern: 'from-white/20 to-transparent',
    versoGradient: 'bg-gradient-to-br from-accent-600 via-accent-700 to-accent-900',
    versoAccent: 'text-accent-100',
    versoTextPrimary: 'text-neutral-900',
    versoTextSecondary: 'text-neutral-800',
  },
  sylver: {
    label: 'SYLVER',
    gradient: 'bg-gradient-to-br from-neutral-200 via-neutral-300 to-neutral-400',
    border: 'border border-neutral-400/60',
    accent: 'text-neutral-700',
    textPrimary: 'text-neutral-900',
    textSecondary: 'text-neutral-700',
    chipBg: 'bg-neutral-800/10 border border-neutral-800/20',
    chipText: 'text-neutral-800',
    iconBg: 'bg-gradient-to-br from-neutral-700 to-neutral-800',
    iconText: 'text-neutral-100',
    glow: 'shadow-[0_20px_50px_-12px_rgba(148,163,184,0.45)]',
    pattern: 'from-white/30 to-transparent',
    versoGradient: 'bg-gradient-to-br from-neutral-300 via-neutral-400 to-neutral-500',
    versoAccent: 'text-neutral-700',
    versoTextPrimary: 'text-neutral-900',
    versoTextSecondary: 'text-neutral-700',
  },
};

function CardRecto({ mandataire, structureName, s, carteType }: {
  mandataire: Mandataire;
  structureName?: string;
  s: typeof CARTE_STYLES[CarteType];
  carteType: CarteType;
}) {
  const fullName = `${mandataire.prenom} ${mandataire.nom} ${mandataire.postnom}`;
  const initials = getInitials(`${mandataire.prenom} ${mandataire.nom}`);

  return (
    <div className={`relative w-full h-full rounded-2xl overflow-hidden ${s.gradient} ${s.border} ${s.glow} transition-transform duration-300 hover:scale-[1.02]`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${s.pattern} pointer-events-none`} />
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />

      <div className="relative px-5 pt-5 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${s.iconBg} flex items-center justify-center`}>
            <Award className={`w-4.5 h-4.5 ${s.iconText}`} />
          </div>
          <div>
            <p className={`text-[10px] font-bold tracking-[0.2em] ${s.accent}`}>{s.label}</p>
            <p className={`text-[9px] tracking-wider ${s.textSecondary} opacity-80`}>CARTE DE MEMBRE</p>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded-md ${s.chipBg}`}>
          <span className={`text-[9px] font-bold tracking-wider ${s.chipText}`}>MUHASA</span>
        </div>
      </div>

      <div className="relative px-5 pb-5 flex items-center gap-4">
        <div className="flex-shrink-0">
          {mandataire.photo_url ? (
            <img
              src={mandataire.photo_url}
              alt={fullName}
              className={`w-20 h-20 rounded-xl object-cover border-2 ${carteType === 'premium' ? 'border-accent-400/60' : carteType === 'gold' ? 'border-accent-200' : 'border-white/60'} shadow-lg`}
            />
          ) : (
            <div className={`w-20 h-20 rounded-xl ${s.iconBg} flex items-center justify-center text-xl font-bold ${s.iconText} shadow-lg`}>
              {initials}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-base font-bold leading-tight ${s.textPrimary} truncate`}>{fullName}</p>
          <p className={`text-xs ${s.textSecondary} mt-0.5 truncate`}>{mandataire.poste_actuel ?? 'Mandataire'}</p>
          <p className={`text-[10px] font-mono ${s.textSecondary} opacity-70 mt-1`}>{mandataire.matricule}</p>
        </div>
      </div>

      <div className="relative px-5 pb-5 pt-3 border-t border-white/10 space-y-1.5">
        {structureName && (
          <div className="flex items-center gap-2">
            <Building2 className={`w-3 h-3 ${s.textSecondary} opacity-70 flex-shrink-0`} />
            <p className={`text-[11px] ${s.textSecondary} truncate`}>{structureName}</p>
          </div>
        )}
        {mandataire.telephone && (
          <div className="flex items-center gap-2">
            <Phone className={`w-3 h-3 ${s.textSecondary} opacity-70 flex-shrink-0`} />
            <p className={`text-[11px] ${s.textSecondary} truncate`}>{mandataire.telephone}</p>
          </div>
        )}
        {mandataire.email && (
          <div className="flex items-center gap-2">
            <Mail className={`w-3 h-3 ${s.textSecondary} opacity-70 flex-shrink-0`} />
            <p className={`text-[11px] ${s.textSecondary} truncate`}>{mandataire.email}</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Calendar className={`w-3 h-3 ${s.textSecondary} opacity-70 flex-shrink-0`} />
          <p className={`text-[11px] ${s.textSecondary}`}>Membre depuis {formatDate(mandataire.date_nomination ?? mandataire.created_at)}</p>
        </div>
      </div>

      <div className={`relative px-5 py-2 ${carteType === 'premium' ? 'bg-accent-400/10' : carteType === 'gold' ? 'bg-neutral-900/10' : 'bg-neutral-700/10'}`}>
        <div className="flex items-center justify-between">
          <span className={`text-[9px] tracking-wider ${s.textSecondary} opacity-70`}>SGMEP • MUHASA</span>
          <span className={`text-[9px] font-bold tracking-wider ${s.accent}`}>{CARTE_TYPE_LABELS[carteType]}</span>
        </div>
      </div>
    </div>
  );
}

function CardVerso({ mandataire, s, carteType }: {
  mandataire: Mandataire;
  s: typeof CARTE_STYLES[CarteType];
  carteType: CarteType;
}) {
  return (
    <div className={`relative w-full h-full rounded-2xl overflow-hidden ${s.versoGradient} ${s.border} ${s.glow}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />

      {/* Magnetic strip */}
      <div className="relative mt-5 mx-5 h-10 rounded-md bg-neutral-900/80 shadow-inner" />

      <div className="relative px-5 pt-5 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${s.iconBg} flex items-center justify-center`}>
            <Shield className={`w-4.5 h-4.5 ${s.iconText}`} />
          </div>
          <div>
            <p className={`text-[10px] font-bold tracking-[0.2em] ${s.versoAccent}`}>MUHASA</p>
            <p className={`text-[9px] tracking-wider ${s.versoTextSecondary} opacity-80`}>SYNDICAT GÉNÉRAL</p>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded-md ${s.chipBg}`}>
          <span className={`text-[9px] font-bold tracking-wider ${s.chipText}`}>VERSO</span>
        </div>
      </div>

      <div className="relative px-5 pb-5 space-y-3">
        <div className={`p-3 rounded-lg ${carteType === 'premium' ? 'bg-white/5' : 'bg-black/5'} border border-white/10`}>
          <p className={`text-[9px] font-bold tracking-wider ${s.versoAccent} mb-1.5`}>ENGAGEMENT</p>
          <p className={`text-[10px] leading-relaxed ${s.versoTextSecondary}`}>
            Le porteur de la présente carte est membre en règle du Syndicat Général des Mandataires et Élus du Parti (MUHASA) et s'engage à respecter les statuts et le règlement intérieur.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className={`text-[8px] font-bold tracking-wider ${s.versoAccent} opacity-70`}>PROVINCE</p>
            <p className={`text-[10px] ${s.versoTextSecondary} truncate`}>{mandataire.province_origine ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <p className={`text-[8px] font-bold tracking-wider ${s.versoAccent} opacity-70`}>STATUT</p>
            <p className={`text-[10px] ${s.versoTextSecondary} capitalize`}>{mandataire.statut}</p>
          </div>
          <div className="space-y-1">
            <p className={`text-[8px] font-bold tracking-wider ${s.versoAccent} opacity-70`}>ANCIENNETÉ</p>
            <p className={`text-[10px] ${s.versoTextSecondary} truncate`}>{mandataire.anciennete ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <p className={`text-[8px] font-bold tracking-wider ${s.versoAccent} opacity-70`}>ÉMIS LE</p>
            <p className={`text-[10px] ${s.versoTextSecondary}`}>{formatDate(mandataire.created_at)}</p>
          </div>
        </div>

        {mandataire.adresse && (
          <div className="flex items-center gap-2">
            <MapPin className={`w-3 h-3 ${s.versoTextSecondary} opacity-70 flex-shrink-0`} />
            <p className={`text-[10px] ${s.versoTextSecondary} truncate`}>{mandataire.adresse}</p>
          </div>
        )}
      </div>

      <div className={`relative px-5 py-2 ${carteType === 'premium' ? 'bg-accent-400/10' : carteType === 'gold' ? 'bg-neutral-900/10' : 'bg-neutral-700/10'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Fingerprint className={`w-3 h-3 ${s.versoTextSecondary} opacity-70`} />
            <span className={`text-[9px] tracking-wider ${s.versoTextSecondary} opacity-70`}>ID: {mandataire.matricule}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className={`w-3 h-3 ${s.versoTextSecondary} opacity-70`} />
            <span className={`text-[9px] tracking-wider ${s.versoTextSecondary} opacity-70`}>www.muhasa.cd</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MemberCard({ mandataire, structureName, side = 'recto', printable = false }: MemberCardProps) {
  const carteType = mandataire.carte_type;
  if (!carteType) return null;

  const s = CARTE_STYLES[carteType];
  const wrapperClass = printable
    ? 'relative w-[340px] h-[540px] print-card'
    : 'relative w-full max-w-sm mx-auto aspect-[1.586] min-h-[200px]';

  return (
    <div className={wrapperClass}>
      {side === 'recto' ? (
        <CardRecto mandataire={mandataire} structureName={structureName} s={s} carteType={carteType} />
      ) : (
        <CardVerso mandataire={mandataire} s={s} carteType={carteType} />
      )}
    </div>
  );
}

export function MemberCardSheet({ mandataire, structureName }: { mandataire: Mandataire; structureName?: string }) {
  const carteType = mandataire.carte_type;
  if (!carteType) return null;

  return (
    <div className="print-sheet">
      <div className="print-card-page">
        <div className="print-card-wrapper">
          <MemberCard mandataire={mandataire} structureName={structureName} side="recto" printable />
        </div>
      </div>
      <div className="print-card-page">
        <div className="print-card-wrapper">
          <MemberCard mandataire={mandataire} structureName={structureName} side="verso" printable />
        </div>
      </div>
    </div>
  );
}

export function CarteTypeSelector({
  value,
  onChange,
}: {
  value: CarteType | null;
  onChange: (v: CarteType | null) => void;
}) {
  const options: { type: CarteType; label: string; description: string; preview: string }[] = [
    {
      type: 'premium',
      label: 'Premium',
      description: 'Apport exceptionnel',
      preview: 'bg-gradient-to-br from-neutral-900 via-primary-950 to-neutral-900',
    },
    {
      type: 'gold',
      label: 'Gold',
      description: 'Apport important',
      preview: 'bg-gradient-to-br from-accent-500 via-accent-600 to-accent-800',
    },
    {
      type: 'sylver',
      label: 'Sylver',
      description: 'Apport régulier',
      preview: 'bg-gradient-to-br from-neutral-200 via-neutral-300 to-neutral-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {options.map((opt) => {
        const selected = value === opt.type;
        return (
          <button
            key={opt.type}
            type="button"
            onClick={() => onChange(selected ? null : opt.type)}
            className={`relative rounded-xl border-2 p-3 text-left transition-all ${
              selected
                ? 'border-primary-500 ring-2 ring-primary-200'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <div className={`h-16 rounded-lg ${opt.preview} mb-2.5 flex items-center justify-center`}>
              <span className={`text-xs font-bold tracking-wider ${opt.type === 'premium' ? 'text-accent-400' : opt.type === 'gold' ? 'text-neutral-900' : 'text-neutral-800'}`}>
                {opt.label.toUpperCase()}
              </span>
            </div>
            <p className="text-sm font-semibold text-neutral-900">{opt.label}</p>
            <p className="text-xs text-neutral-500">{opt.description}</p>
            {selected && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
