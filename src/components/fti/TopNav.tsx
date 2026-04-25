import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { t } from '@/context/i18n';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const links = [
  { to: '/budget', label: 'Budget', color: 'bg-lime' },
  { to: '/tax', label: 'Tax', color: 'bg-purple' },
  { to: '/investments', label: 'Invest', color: 'bg-orange' },
  { to: '/learn', label: 'Learn', color: 'bg-lime' },
  { to: '/simulate', label: 'Simulate', color: 'bg-purple' },
  { to: '/leaderboard', label: 'Leaders', color: 'bg-orange' },
  { to: '/profile', label: 'Profile', color: 'bg-cream' },
];

type Notif = { id: string; title: string; body: string | null; read: boolean; created_at: string; kind: string };

export const TopNav = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setNotifs((data as Notif[]) ?? []));
  }, [user?.id]);

  const unread = notifs.filter(n => !n.read).length;

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifs(p => p.map(n => ({ ...n, read: true })));
  };

  const { language, setLanguage } = useLanguage();

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-foreground bg-cream">
      <div className="container flex items-center justify-between gap-3 py-3">
        <NavLink to="/budget" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-ink text-lime brutal-border rounded-xl flex items-center justify-center font-marker text-lg">F</div>
          <div className="font-display font-bold text-xl tracking-tight hidden sm:block">FTI<span className="text-orange">.</span></div>
        </NavLink>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => cn(
              'px-3 py-2 font-display font-bold text-sm uppercase brutal-border rounded-xl transition-all',
              isActive ? `${l.color} text-ink brutal-shadow-sm` : 'bg-cream hover:-translate-y-0.5 hover:brutal-shadow-sm border-transparent hover:border-foreground',
            )}>{t(language, l.label.toLowerCase() as any)}</NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Language Dropdown */}
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="brutal-border rounded-xl px-3 py-2 bg-card font-medium focus:outline-none focus:ring-2 focus:ring-lime/40"
            aria-label={t(language, 'select_language')}
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="mr">मराठी</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>
          {/* Profile Avatar */}
          <NavLink to="/profile" className="ml-2" aria-label="Profile">
            <Avatar>
              {/* If you have user?.avatar_url or similar, use it below */}
              <AvatarImage src={user?.avatar_url || undefined} alt="Profile" />
              <AvatarFallback>{user?.email ? user.email[0].toUpperCase() : 'P'}</AvatarFallback>
            </Avatar>
          </NavLink>
          <div className="relative">
            <button onClick={() => setBell(b => !b)} className="brutal-btn bg-card !p-2.5" aria-label="notifications">
              <Bell className="w-4 h-4" />
              {unread > 0 && <span className="absolute -top-1 -right-1 bg-orange text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center brutal-border">{unread}</span>}
            </button>
            <AnimatePresence>
              {bell && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-80 brutal-card p-3 z-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-display font-bold">Alerts</span>
                    {unread > 0 && <button onClick={markAllRead} className="text-xs underline">Mark all read</button>}
                  </div>
                  {notifs.length === 0 && <p className="text-sm text-muted-foreground py-3">No notifications yet.</p>}
                  <ul className="space-y-2 max-h-80 overflow-auto">
                    {notifs.map(n => (
                      <li key={n.id} className={cn('p-2 brutal-border rounded-lg text-sm', n.read ? 'bg-muted' : 'bg-lime')}>
                        <div className="font-bold">{n.title}</div>
                        {n.body && <div className="text-xs">{n.body}</div>}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={async () => { await signOut(); navigate('/'); }} className="brutal-btn bg-card !p-2.5 hidden sm:flex" aria-label="logout"><LogOut className="w-4 h-4" /></button>
          <button onClick={() => setOpen(o => !o)} className="lg:hidden brutal-btn bg-card !p-2.5" aria-label="menu">
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="lg:hidden overflow-hidden border-t-[3px] border-foreground bg-cream">
            <div className="container py-3 grid grid-cols-2 gap-2">
              {links.map(l => (
                <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
                  className={({ isActive }) => cn('p-3 font-display font-bold uppercase text-sm brutal-border rounded-xl', isActive ? `${l.color} brutal-shadow-sm` : 'bg-card')}>
                  {l.label}
                </NavLink>
              ))}
              <button onClick={async () => { await signOut(); navigate('/'); }} className="p-3 font-display font-bold uppercase text-sm brutal-border rounded-xl bg-orange text-white col-span-2">Log out</button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};
