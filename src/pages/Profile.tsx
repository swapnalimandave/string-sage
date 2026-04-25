import { useEffect, useState } from 'react';
import { AppShell } from '@/components/fti/AppShell';
import { BrutalCard } from '@/components/fti/BrutalCard';
import { BrutalButton } from '@/components/fti/BrutalButton';
import { ScribbleUnderline } from '@/components/fti/Doodle';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Loader2, Pencil, Save, Trophy, BookOpen, Zap, Target } from 'lucide-react';

type Profile = {
  name: string;
  age: string;
  phone: string;
  location: string;
  language: string;
};

type ScoreSummary = {
  points: number;
  badges: string[];
  quizzesTaken: number;
  quizCorrect: number;
  lessonsRead: number;
  simulations: number;
};

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>({ name: '', age: '', phone: '', location: '', language: 'en' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<ScoreSummary | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoading(true);
      // Fetch profile
      const { data: p } = await supabase
        .from('profiles')
        .select('name, age, phone, location, language')
        .eq('id', user.id)
        .maybeSingle();

      if (p) {
        setProfile({
          name: p.name ?? '',
          age: p.age?.toString() ?? '',
          phone: p.phone ?? '',
          location: p.location ?? '',
          language: p.language ?? 'en',
        });
      }

      // Fetch points & badges
      const { data: pts } = await supabase
        .from('user_points')
        .select('points, badges')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch learning progress
      const { data: progress } = await supabase
        .from('learning_progress')
        .select('kind, score, completed')
        .eq('user_id', user.id);

      const quizRows = (progress ?? []).filter((r: any) => r.kind === 'quiz');
      const lessonRows = (progress ?? []).filter((r: any) => r.kind === 'lesson');
      const simRows = (progress ?? []).filter((r: any) => r.kind === 'simulation');

      setScore({
        points: pts?.points ?? 0,
        badges: pts?.badges ?? [],
        quizzesTaken: quizRows.length,
        quizCorrect: quizRows.reduce((s: number, r: any) => s + (r.score ?? 0), 0),
        lessonsRead: lessonRows.length,
        simulations: simRows.length,
      });

      setLoading(false);
    };
    fetchAll();
  }, [user?.id]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      name: profile.name,
      age: Number(profile.age) || null,
      phone: profile.phone,
      location: profile.location,
      language: profile.language,
    }).eq('id', user.id);

    if (error) toast.error('Failed to save: ' + error.message);
    else { toast.success('Profile updated! 🎉'); setEditing(false); }
    setSaving(false);
  };

  const initials = profile.name
    ? profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  const LANG_LABELS: Record<string, string> = { en: 'English', hi: 'हिन्दी', mr: 'मराठी' };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center gap-3 mt-20 justify-center">
          <Loader2 className="animate-spin w-8 h-8" />
          <span className="font-hand text-2xl">Loading your profile…</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold inline-block relative">
          My Profile
          <ScribbleUnderline className="absolute -bottom-3 left-0 right-0 h-3 text-purple" />
        </h1>
        <p className="font-hand text-2xl text-muted-foreground mt-2">your story, your numbers.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── LEFT: Avatar + Info ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Avatar + name banner */}
          <BrutalCard tilt={-1} className="flex items-center gap-5">
            <Avatar className="w-20 h-20 brutal-border text-3xl">
              <AvatarFallback className="bg-lime text-ink font-display font-bold text-3xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-display font-bold text-2xl">{profile.name || 'Unnamed Hero'}</p>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <p className="font-hand text-lg mt-1 text-purple">{profile.location || 'Location not set'}</p>
            </div>
            <div className="ml-auto">
              {!editing ? (
                <BrutalButton size="sm" color="lime" onClick={() => setEditing(true)}>
                  <Pencil className="w-4 h-4 mr-1" /> Edit
                </BrutalButton>
              ) : (
                <BrutalButton size="sm" color="orange" onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  Save
                </BrutalButton>
              )}
            </div>
          </BrutalCard>

          {/* Profile Fields */}
          <BrutalCard color="cream" tilt={1}>
            <h2 className="font-display font-bold text-xl mb-4">📋 Personal Info</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="Full Name"
                value={profile.name}
                editing={editing}
                onChange={v => setProfile(p => ({ ...p, name: v }))}
              />
              <Field
                label="Age"
                value={profile.age}
                editing={editing}
                type="number"
                onChange={v => setProfile(p => ({ ...p, age: v }))}
              />
              <Field
                label="Phone"
                value={profile.phone}
                editing={editing}
                type="tel"
                onChange={v => setProfile(p => ({ ...p, phone: v }))}
              />
              <Field
                label="Location"
                value={profile.location}
                editing={editing}
                onChange={v => setProfile(p => ({ ...p, location: v }))}
              />
              <div>
                <label className="text-xs font-bold uppercase block mb-1">Language</label>
                {editing ? (
                  <select
                    value={profile.language}
                    onChange={e => setProfile(p => ({ ...p, language: e.target.value }))}
                    className="w-full brutal-border rounded-xl bg-card px-3 py-2.5 font-medium focus:outline-none focus:ring-4 focus:ring-lime/40"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी</option>
                    <option value="mr">मराठी</option>
                  </select>
                ) : (
                  <p className="brutal-border rounded-xl bg-card px-3 py-2.5 font-medium">
                    {LANG_LABELS[profile.language] ?? profile.language}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold uppercase block mb-1">Email</label>
                <p className="brutal-border rounded-xl bg-muted px-3 py-2.5 font-medium text-muted-foreground text-sm">
                  {user?.email}
                </p>
              </div>
            </div>
            {editing && (
              <div className="mt-4 flex gap-3">
                <BrutalButton color="lime" onClick={save} disabled={saving} className="flex-1">
                  {saving ? 'Saving…' : '💾 Save Changes'}
                </BrutalButton>
                <BrutalButton color="cream" onClick={() => setEditing(false)} className="flex-1">
                  Cancel
                </BrutalButton>
              </div>
            )}
          </BrutalCard>
        </div>

        {/* ── RIGHT: Quick Stats ── */}
        <div className="space-y-4">
          <BrutalCard color="ink" tilt={-1}>
            <div className="text-center">
              <Trophy className="w-10 h-10 text-lime mx-auto mb-2" />
              <p className="font-hand text-xl text-cream/70">Total Points</p>
              <p className="font-display font-bold text-5xl text-lime">{score?.points ?? 0}</p>
            </div>
          </BrutalCard>

          {score && score.badges.length > 0 && (
            <BrutalCard color="purple" tilt={1}>
              <p className="font-display font-bold mb-2">🏅 Badges</p>
              <div className="flex flex-wrap gap-2">
                {score.badges.map((b, i) => (
                  <span key={i} className="sticker bg-lime text-ink text-xs">{b}</span>
                ))}
              </div>
            </BrutalCard>
          )}
        </div>
      </div>

      {/* ── BOTTOM: Score Dashboard ── */}
      <div className="mt-10">
        <h2 className="font-display font-bold text-3xl mb-5 relative inline-block">
          📊 Score Dashboard
          <ScribbleUnderline className="absolute -bottom-2 left-0 right-0 h-2.5 text-orange" />
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Zap className="w-7 h-7 text-lime" />}
            label="Total Points"
            value={`${score?.points ?? 0} pts`}
            color="bg-ink text-cream"
          />
          <StatCard
            icon={<Target className="w-7 h-7 text-orange" />}
            label="Quiz Score"
            value={`${score?.quizCorrect ?? 0} correct`}
            sub={`from ${score?.quizzesTaken ?? 0} quizzes`}
            color="bg-orange text-white"
          />
          <StatCard
            icon={<BookOpen className="w-7 h-7 text-purple" />}
            label="Lessons Read"
            value={`${score?.lessonsRead ?? 0}`}
            sub="topics explored"
            color="bg-purple text-cream"
          />
          <StatCard
            icon={<Trophy className="w-7 h-7 text-lime" />}
            label="Simulations"
            value={`${score?.simulations ?? 0}`}
            sub="life scenarios run"
            color="bg-lime text-ink"
          />
        </div>

        {/* Progress bar for quiz accuracy */}
        {score && score.quizzesTaken > 0 && (
          <BrutalCard color="cream" className="mt-6">
            <p className="font-display font-bold mb-3">🎯 Quiz Accuracy</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 brutal-border rounded-full bg-muted h-5 overflow-hidden">
                <div
                  className="h-full bg-lime transition-all duration-700 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((score.quizCorrect / (score.quizzesTaken * 3)) * 100))}%`,
                  }}
                />
              </div>
              <span className="font-display font-bold text-xl">
                {Math.min(100, Math.round((score.quizCorrect / (score.quizzesTaken * 3)) * 100))}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {score.quizCorrect} correct answers out of {score.quizzesTaken * 3} total questions
            </p>
          </BrutalCard>
        )}

        {score && score.badges.length > 0 && (
          <BrutalCard color="lime" className="mt-4">
            <p className="font-display font-bold mb-3">🏅 All Badges Earned</p>
            <div className="flex flex-wrap gap-3">
              {score.badges.map((b, i) => (
                <span key={i} className="sticker bg-ink text-lime text-sm px-3 py-1.5">{b}</span>
              ))}
            </div>
          </BrutalCard>
        )}

        {(!score || (score.points === 0 && score.quizzesTaken === 0)) && (
          <BrutalCard color="cream" className="mt-4 text-center py-8">
            <p className="font-hand text-2xl">No activity yet!</p>
            <p className="text-muted-foreground mt-2">Take a quiz or read a lesson to start earning points. 🚀</p>
          </BrutalCard>
        )}
      </div>
    </AppShell>
  );
};

// ── Helpers ──

const Field = ({
  label, value, editing, onChange, type = 'text',
}: {
  label: string; value: string; editing: boolean; onChange: (v: string) => void; type?: string;
}) => (
  <div>
    <label className="text-xs font-bold uppercase block mb-1">{label}</label>
    {editing ? (
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full brutal-border rounded-xl bg-card px-3 py-2.5 font-medium focus:outline-none focus:ring-4 focus:ring-lime/40"
      />
    ) : (
      <p className="brutal-border rounded-xl bg-card px-3 py-2.5 font-medium">
        {value || <span className="text-muted-foreground italic">Not set</span>}
      </p>
    )}
  </div>
);

const StatCard = ({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string;
}) => (
  <div className={`${color} brutal-border brutal-shadow rounded-2xl p-5`}>
    {icon}
    <p className="font-display font-bold text-2xl mt-3">{value}</p>
    <p className="font-bold text-sm mt-1 opacity-80">{label}</p>
    {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
  </div>
);

export default Profile;
