import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { t } from '@/context/i18n';
import { BrutalButton } from '@/components/fti/BrutalButton';
import { BrutalCard } from '@/components/fti/BrutalCard';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name too short').max(60),
  age: z.coerce.number().int().min(13).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(20),
  location: z.string().trim().min(2).max(80),
  language: z.string().min(2),
  password: z.string().min(8, 'At least 8 characters').max(72),
});
const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const Auth = () => {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(params.get('mode') === 'login' ? 'login' : 'signup');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();

  useEffect(() => { if (user) navigate('/budget', { replace: true }); }, [user, navigate]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const parsed = signupSchema.safeParse(Object.fromEntries(fd));
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { name, age, email, phone, location, language, password } = parsed.data;
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + '/budget', data: { name } },
        });
        if (error) { toast.error(error.message); return; }
        // wait for session, then update profile
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u) {
          await supabase.from('profiles').update({ name, age, phone, location, language }).eq('id', u.id);
        }
        toast.success('Account created! Welcome aboard.');
        navigate('/budget');
      } else {
        const parsed = loginSchema.safeParse(Object.fromEntries(fd));
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { email, password } = parsed.data;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { toast.error(error.message); return; }
        toast.success('Welcome back!');
        navigate('/budget');
      }
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Link to="/" className="font-marker text-2xl mb-6 inline-block">← FTI</Link>
        <BrutalCard tilt={-1} className="p-8">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-display font-bold mb-1">
            {mode === 'signup' ? t(language, 'join') : t(language, 'welcome')}
          </motion.h1>
          <p className="font-hand text-xl text-muted-foreground mb-6">{mode === 'signup' ? t(language, 'one_minute') : t(language, 'pick_up')}</p>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'signup' && (
              <>
                <Field label={t(language, 'Name') || 'Name'} name="name" placeholder="Priya Sharma" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t(language, 'Age') || 'Age'} name="age" type="number" placeholder="24" />
                  <Field label={t(language, 'Phone') || 'Phone'} name="phone" type="tel" placeholder="98765 43210" />
                </div>
                <Field label={t(language, 'Location') || 'Location'} name="location" placeholder="Bangalore, IN" />
                <div>
                  <label className="text-xs font-bold uppercase">{t(language, 'select_language')}</label>
                  <select name="language" defaultValue={language} className="w-full brutal-border rounded-xl bg-card px-3 py-2.5 mt-1 font-medium">
                    <option value="en">English</option>
                    <option value="hi">हिन्दी</option>
                    <option value="mr">मराठी</option>
                    <option value="fr">Français</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
              </>
            )}
            <Field label={t(language, 'Email') || 'Email'} name="email" type="email" placeholder="you@email.com" />
            <Field label={t(language, 'Password') || 'Password'} name="password" type="password" placeholder="••••••••" />
            <BrutalButton color="lime" size="lg" className="w-full mt-3" disabled={busy}>
              {busy ? 'Working…' : (mode === 'signup' ? t(language, 'signup') : t(language, 'login'))}
            </BrutalButton>
          </form>

          <button onClick={() => setMode(m => m === 'signup' ? 'login' : 'signup')} className="mt-5 text-sm underline w-full text-center">
            {mode === 'signup' ? t(language, 'already_account') : t(language, 'new_here')}
          </button>
        </BrutalCard>
      </div>
    </div>
  );
};

const Field = ({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label className="text-xs font-bold uppercase">{label}</label>
    <input {...rest} required className="w-full brutal-border rounded-xl bg-card px-3 py-2.5 mt-1 font-medium focus:outline-none focus:ring-4 focus:ring-lime/40" />
  </div>
);

export default Auth;
