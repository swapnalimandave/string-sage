import { useEffect, useState } from 'react';
import { AppShell } from '@/components/fti/AppShell';
import { BrutalCard } from '@/components/fti/BrutalCard';
import { ScribbleUnderline, StarDoodle } from '@/components/fti/Doodle';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

type Row = { name: string; points: number; badges: string[] };

const Leaderboard = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [me, setMe] = useState<{ points: number; badges: string[] } | null>(null);

  useEffect(() => {
    supabase.rpc('get_leaderboard').then(({ data }) => setRows((data as Row[]) ?? []));
    if (user) supabase.from('user_points').select('points,badges').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setMe(data as never));
  }, [user?.id]);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold inline-block relative">
          Leaderboard
          <ScribbleUnderline className="absolute -bottom-3 left-0 right-0 h-3 text-orange" />
        </h1>
        <p className="font-hand text-2xl text-muted-foreground mt-2">top financial brains this season.</p>
      </div>

      {me && (
        <BrutalCard color="ink" className="mb-6">
          <div className="flex justify-between items-center">
            <div><p className="font-hand text-xl text-cream/70">your score</p><p className="font-display font-bold text-3xl text-lime">{me.points} pts</p></div>
            <div className="flex gap-2 flex-wrap">{(me.badges ?? []).map((b,i) => <span key={i} className="sticker bg-lime text-ink">{b}</span>)}</div>
          </div>
        </BrutalCard>
      )}

      {podium.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6 items-end">
          {[1,0,2].map(idx => podium[idx] && (
            <BrutalCard key={idx} color={idx===0?'lime':idx===1?'purple':'orange'} tilt={idx===0?0:idx===1?-2:2} className={`text-center ${idx===0?'pb-8':''} relative`}>
              {idx===0 && <StarDoodle className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 text-orange animate-wobble" />}
              <div className="font-display font-bold text-3xl">#{idx+1}</div>
              <div className="font-bold truncate">{podium[idx].name}</div>
              <div className="font-display text-2xl">{podium[idx].points}pts</div>
            </BrutalCard>
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <BrutalCard color="cream">
          <ul className="divide-y-2 divide-foreground">
            {rest.map((r, i) => (
              <li key={i} className="flex justify-between py-2.5 px-1">
                <span className="font-bold">#{i+4}. {r.name}</span>
                <span className="font-display font-bold">{r.points} pts</span>
              </li>
            ))}
          </ul>
        </BrutalCard>
      )}

      {rows.length === 0 && <p className="font-hand text-2xl text-center mt-10">Be the first to score! Run a simulation or take a quiz.</p>}
    </AppShell>
  );
};

export default Leaderboard;
