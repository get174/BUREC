import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

type AccentColor = 'blue' | 'green' | 'yellow' | 'dark' | 'success' | 'warning' | 'error' | 'primary' | 'accent';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; up: boolean };
  accent?: AccentColor;
  subtitle?: string;
}

const ACCENT: Record<AccentColor, { icon: string; border: string; badge: string }> = {
  blue:    { icon: 'bg-primary-500 text-white',   border: 'border-t-primary-500',  badge: 'bg-primary-50 text-primary-900'  },
  green:   { icon: 'bg-success-500 text-white',   border: 'border-t-success-500',  badge: 'bg-success-50 text-success-700'  },
  yellow:  { icon: 'bg-warning-400 text-neutral-900', border: 'border-t-warning-400', badge: 'bg-warning-50 text-warning-800' },
  dark:    { icon: 'bg-primary-900 text-white',   border: 'border-t-primary-900',  badge: 'bg-primary-50 text-primary-900'  },
  success: { icon: 'bg-success-500 text-white',   border: 'border-t-success-500',  badge: 'bg-success-50 text-success-700'  },
  warning: { icon: 'bg-warning-400 text-neutral-900', border: 'border-t-warning-400', badge: 'bg-warning-50 text-warning-800' },
  error:   { icon: 'bg-error-600 text-white',     border: 'border-t-error-500',    badge: 'bg-error-50 text-error-700'      },
  primary: { icon: 'bg-primary-500 text-white',   border: 'border-t-primary-500',  badge: 'bg-primary-50 text-primary-900'  },
  accent:  { icon: 'bg-warning-400 text-neutral-900', border: 'border-t-warning-400', badge: 'bg-warning-50 text-warning-800' },
};

export function StatCard({ label, value, icon: Icon, trend, accent = 'blue', subtitle }: StatCardProps) {
  const a = ACCENT[accent];
  return (
    <div className={`card border-t-4 ${a.border} p-5 hover:shadow-soft transition-shadow`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider truncate">{label}</p>
          <p className="text-2xl font-bold text-neutral-900 mt-2 font-display leading-tight">{value}</p>
          {subtitle && <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-3">
              {trend.up
                ? <TrendingUp  className="w-3.5 h-3.5 text-success-500" />
                : <TrendingDown className="w-3.5 h-3.5 text-error-500"  />}
              <span className={`text-xs font-semibold ${trend.up ? 'text-success-600' : 'text-error-600'}`}>
                {trend.value}
              </span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${a.icon}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
