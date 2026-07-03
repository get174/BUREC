import { useState, useEffect, useRef } from 'react';
import { Menu, Search, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_SHORT } from '../../lib/permissions';
import { getInitials, timeAgo } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import type { Notification } from '../../types';

interface NavbarProps {
  onToggleMobile: () => void;
  onNavigate: (page: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
}

export function Navbar({ onToggleMobile, onNavigate, searchQuery, onSearchChange, searchPlaceholder }: NavbarProps) {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadNotifications() {
      if (!profile) return;
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setNotifications((data as Notification[]) ?? []);
    }
    loadNotifications();
  }, [profile]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    if (!profile) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const NOTIF_TYPE_STYLES = {
    success: 'border-l-success-500',
    warning: 'border-l-warning-400',
    error:   'border-l-error-500',
    info:    'border-l-primary-500',
  } as const;

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-neutral-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 gap-4">

        {/* Left: hamburger + search */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onToggleMobile}
            className="lg:hidden p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder ?? 'Rechercher...'}
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm
                         text-neutral-700 placeholder:text-neutral-400
                         focus:outline-none focus:bg-white focus:border-success-500 focus:ring-2 focus:ring-success-500/20
                         transition-all"
            />
          </div>
        </div>

        {/* Right: notifications + profile */}
        <div className="flex items-center gap-1.5">

          {/* Notifications bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotif((v) => !v)}
              className="relative p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-warning-400 text-neutral-900 text-[10px] font-bold flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-elevated border border-neutral-200 overflow-hidden animate-scale-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-neutral-50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary-900" />
                    <h3 className="text-sm font-semibold text-neutral-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="badge bg-warning-400 text-neutral-900">{unreadCount}</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary-900 hover:text-primary-700 font-semibold">
                      Tout lire
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto divide-y divide-neutral-50">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-sm text-neutral-500">Aucune notification</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex gap-3 p-4 hover:bg-neutral-50 transition-colors border-l-4 ${NOTIF_TYPE_STYLES[n.type]} ${!n.is_read ? 'bg-primary-50/30' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${!n.is_read ? 'text-neutral-900' : 'text-neutral-700'}`}>{n.title}</p>
                          <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{n.message}</p>
                          <p className="text-[11px] text-neutral-400 mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                        {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile((v) => !v)}
              className="flex items-center gap-2.5 p-1 pl-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-900 text-white flex items-center justify-center text-xs font-bold">
                {getInitials(profile?.full_name ?? 'U')}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-neutral-800 leading-tight max-w-[120px] truncate">
                  {profile?.full_name}
                </p>
                <p className="text-[10px] text-neutral-500 leading-tight">
                  {profile?.role ? ROLE_SHORT[profile.role] : ''}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-neutral-400 hidden sm:block" />
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-elevated border border-neutral-200 overflow-hidden animate-scale-in">
                <div className="p-3 border-b border-neutral-100 bg-gradient-to-r from-primary-900 to-primary-500">
                  <p className="text-sm font-semibold text-white">{profile?.full_name}</p>
                  <p className="text-xs text-white/70 mt-0.5">{profile?.role ? ROLE_SHORT[profile.role] : ''}</p>
                </div>
                <button
                  onClick={() => { onNavigate('settings'); setShowProfile(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Paramètres du compte
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
