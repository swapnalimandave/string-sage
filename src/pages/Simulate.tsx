import { useMemo, useState, useEffect } from 'react';
import { AppShell } from '@/components/fti/AppShell';
import { BrutalCard } from '@/components/fti/BrutalCard';
import { BrutalButton } from '@/components/fti/BrutalButton';
import { ScribbleUnderline } from '@/components/fti/Doodle';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { calcEMI, calcHealthScore, formatINR, healthLabel } from '@/lib/finance';
import { motion, AnimatePresence } from 'framer-motion';
import { NumberTicker } from '@/components/fti/NumberTicker';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type ScenarioType = 'rent_change' | 'salary_change' | 'new_loan' | 'sip_increase' | 'emergency' | 'overspend';

const SCENARIOS: { id: ScenarioType; name: string; emoji: string; color: 'lime'|'purple'|'orange'|'cream'; defaults: Record<string, number> }[] = [
  { id: 'rent_change', name: 'Rent Change', emoji: '🏠', color: 'lime', defaults: { delta: 3000 } },
  { id: 'salary_change', name: 'Salary Change', emoji: '💸', color: 'purple', defaults: { delta: 5000 } },
  { id: 'new_loan', name: 'New Loan', emoji: '🏦', color: 'orange', defaults: { principal: 200000, rate: 12, months: 36 } },
  { id: 'sip_increase', name: 'SIP Increase', emoji: '📈', color: 'lime', defaults: { delta: 2000 } },
  { id: 'emergency', name: 'Emergency Expense', emoji: '🚨', color: 'orange', defaults: { amount: 25000 } },
  { id: 'overspend', name: 'Overspending', emoji: '🛍️', color: 'purple', defaults: { extra: 4000 } },
];

const Simulate = () => {
  const { user } = useAuth();
  const fd = useFinanceData();
  const [active, setActive] = useState<ScenarioType>('rent_change');
  const [params, setParams] = useState<Record<string, number>>(SCENARIOS[0].defaults);
  const [savedSims, setSavedSims] = useState<{ id: string; name: string; scenario_type: string; inputs: Record<string, number> }[]>([]);

  useEffect(() => {
    setParams(SCENARIOS.find(s => s.id === active)!.defaults);
  }, [active]);

  useEffect(() => {
    if (!user) return;
    supabase.from('simulations').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setSavedSims((data as never) ?? []));
  }, [user?.id]);

  // Base state
  const base = useMemo(() => {
    const inHand = fd.inHand;
    const totalEMI = fd.totalEMI;
    const expenses = fd.totalExpenses;
    const sip = fd.monthlyInvestment;
    const cibil = fd.income?.cibil_score ?? 700;
    const score = calcHealthScore({ inHand, totalEMI, totalExpenses: expenses, monthlyInvestment: sip, cibil });
    return { inHand, totalEMI, expenses, sip, savings: inHand - totalEMI - expenses - sip, score };
  }, [fd]);

  // Apply scenario
  const after = useMemo(() => {
    let inHand = base.inHand;
    let totalEMI = base.totalEMI;
    let expenses = base.expenses;
    let sip = base.sip;
    const cibil = fd.income?.cibil_score ?? 700;
    switch (active) {
      case 'rent_change': expenses += params.delta || 0; break;
      case 'salary_change': inHand += params.delta || 0; break;
      case 'new_loan': totalEMI += calcEMI(params.principal || 0, params.rate || 0, params.months || 1); break;
      case 'sip_increase': sip += params.delta || 0; break;
      case 'emergency': expenses += (params.amount || 0); break; // single-month hit
      case 'overspend': expenses += params.extra || 0; break;
    }
    const score = calcHealthScore({ inHand, totalEMI, totalExpenses: expenses, monthlyInvestment: sip, cibil });
    return { inHand, totalEMI, expenses, sip, savings: inHand - totalEMI - expenses - sip, score };
  }, [active, params, base, fd.income?.cibil_score]);

  const feedback = useMemo(() => {
    const msgs: { tone: 'good'|'warn'|'bad'; text: string }[] = [];
    if (after.inHand > 0) {
      const rentPct = after.expenses / after.inHand;
      if (rentPct > 0.3) msgs.push({ tone: 'warn', text: `Expenses are ${Math.round(rentPct*100)}% of income — recommended < 30%.` });
      const emiPct = after.totalEMI / after.inHand;
      if (emiPct > 0.5) msgs.push({ tone: 'bad', text: `EMI burden is ${Math.round(emiPct*100)}% — danger zone! Keep below 40%.` });
      else if (emiPct > 0.4) msgs.push({ tone: 'warn', text: `EMI burden is ${Math.round(emiPct*100)}% — getting heavy.` });
      const savingsRate = after.savings / after.inHand;
      if (savingsRate < 0) msgs.push({ tone: 'bad', text: 'You\'re in the red! Spending more than you earn.' });
      else if (savingsRate < 0.2) msgs.push({ tone: 'warn', text: `Savings rate ${Math.round(savingsRate*100)}% — aim for 20%+.` });
      else msgs.push({ tone: 'good', text: `Savings rate ${Math.round(savingsRate*100)}% — solid!` });
    }
    if (active === 'sip_increase' && params.delta > 0) msgs.push({ tone: 'good', text: 'Increasing SIP compounds wealth massively over time.' });
    if (after.score > base.score + 5) msgs.push({ tone: 'good', text: `Health score up by ${after.score - base.score} points!` });
    if (after.score < base.score - 5) msgs.push({ tone: 'bad', text: `Health score down by ${base.score - after.score} points.` });
    return msgs;
  }, [active, params, after, base]);

  const saveScenario = async () => {
    if (!user) return;
    const sc = SCENARIOS.find(s => s.id === active)!;
    const { error } = await supabase.from('simulations').insert({
      user_id: user.id, name: sc.name, scenario_type: active, inputs: params,
    });
    if (error) return toast.error(error.message);
    toast.success('Scenario saved · +10 points');
    await supabase.rpc('get_leaderboard'); // noop
    // bump points
    const { data: pts } = await supabase.from('user_points').select('points').eq('user_id', user.id).maybeSingle();
    await supabase.from('user_points').update({ points: (pts?.points ?? 0) + 10 }).eq('user_id', user.id);
    const { data } = await supabase.from('simulations').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setSavedSims((data as never) ?? []);
  };

  const removeSim = async (id: string) => {
    await supabase.from('simulations').delete().eq('id', id);
    setSavedSims(p => p.filter(s => s.id !== id));
  };

  const loadSim = (s: { scenario_type: string; inputs: Record<string, number> }) => {
    setActive(s.scenario_type as ScenarioType);
    setParams(s.inputs);
  };

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold inline-block relative">
          Simulator
          <ScribbleUnderline className="absolute -bottom-3 left-0 right-0 h-3 text-purple" />
        </h1>
        <p className="font-hand text-2xl text-muted-foreground mt-2">play with your future. it's free.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-5">
        {/* Phone simulator */}
        <div className="lg:col-span-5">
          <div className="mx-auto max-w-sm bg-ink p-3 brutal-border rounded-[2.5rem] brutal-shadow-lg" style={{ transform: 'rotate(-2deg)' }}>
            <div className="bg-cream rounded-[2rem] p-4 min-h-[560px] relative overflow-hidden">
              <div className="flex justify-between text-xs font-bold mb-3"><span>9:41</span><span>FTI · sim</span></div>

              <div className="brutal-border bg-ink text-cream rounded-2xl p-3 mb-3">
                <div className="text-[10px] uppercase font-bold opacity-70">Health Score</div>
                <div className="flex items-end gap-2">
                  <div className="font-display font-bold text-4xl"><NumberTicker value={after.score} /></div>
                  <div className={`text-sm ${healthLabel(after.score).color === 'text-success' ? 'text-lime' : healthLabel(after.score).color === 'text-danger' ? 'text-orange' : 'text-warning'}`}>{healthLabel(after.score).label}</div>
                </div>
                <div className="h-2 bg-cream/20 rounded-full overflow-hidden mt-2"><motion.div animate={{ width: `${after.score}%` }} className="h-full bg-lime" /></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <PhoneStat label="Disposable" v={after.inHand - after.totalEMI - after.expenses} bg="bg-lime" />
                <PhoneStat label="Savings" v={after.savings} bg={after.savings < 0 ? 'bg-orange text-white' : 'bg-purple'} />
                <PhoneStat label="EMI burden" v={after.totalEMI} bg="bg-cream" pct={after.inHand ? after.totalEMI/after.inHand*100 : 0} />
                <PhoneStat label="Investing" v={after.sip} bg="bg-cream" />
              </div>

              <div className="mt-3 space-y-2 max-h-32 overflow-auto">
                <AnimatePresence>
                  {feedback.map((f, i) => (
                    <motion.div key={`${f.text}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      className={`brutal-border rounded-xl p-2 text-xs font-medium ${f.tone === 'good' ? 'bg-lime' : f.tone === 'warn' ? 'bg-warning' : 'bg-orange text-white'}`}>
                      {f.text}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Controls + diff */}
        <div className="lg:col-span-7 space-y-5">
          <BrutalCard tilt={1}>
            <h3 className="font-display font-bold text-xl mb-3">Pick a scenario</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {SCENARIOS.map(s => (
                <button key={s.id} onClick={() => setActive(s.id)} className={`brutal-border rounded-xl p-2.5 text-left text-sm font-bold ${active===s.id?`bg-${s.color} ${s.color==='orange'?'text-white':''} brutal-shadow-sm`:'bg-card'}`}>
                  <div className="text-2xl">{s.emoji}</div>{s.name}
                </button>
              ))}
            </div>

            <ScenarioInputs id={active} params={params} setParams={setParams} />

            <div className="flex flex-wrap gap-2 mt-4">
              <BrutalButton color="lime" onClick={saveScenario}>Save scenario · +10pts</BrutalButton>
              <BrutalButton color="cream" onClick={() => setParams(SCENARIOS.find(s => s.id === active)!.defaults)}>Reset</BrutalButton>
            </div>
          </BrutalCard>

          {/* Before vs After */}
          <div className="grid grid-cols-2 gap-3">
            <BrutalCard color="cream" tilt={-1}>
              <p className="font-hand text-xl">before</p>
              <DiffRow label="Disposable" v={base.inHand - base.totalEMI - base.expenses} />
              <DiffRow label="Savings" v={base.savings} />
              <DiffRow label="EMI" v={base.totalEMI} />
              <DiffRow label="Score" v={base.score} suffix="/100" />
            </BrutalCard>
            <BrutalCard color="lime" tilt={1.5}>
              <p className="font-hand text-xl">after</p>
              <DiffRow label="Disposable" v={after.inHand - after.totalEMI - after.expenses} delta={(after.inHand-after.totalEMI-after.expenses)-(base.inHand-base.totalEMI-base.expenses)} />
              <DiffRow label="Savings" v={after.savings} delta={after.savings-base.savings} />
              <DiffRow label="EMI" v={after.totalEMI} delta={after.totalEMI-base.totalEMI} negativeIsGood />
              <DiffRow label="Score" v={after.score} suffix="/100" delta={after.score-base.score} />
            </BrutalCard>
          </div>

          {savedSims.length > 0 && (
            <BrutalCard color="cream">
              <h3 className="font-display font-bold text-xl mb-2">Saved scenarios</h3>
              <ul className="space-y-2">
                {savedSims.map(s => (
                  <li key={s.id} className="brutal-border bg-card rounded-xl p-2 flex justify-between items-center">
                    <button onClick={() => loadSim(s)} className="text-left flex-1 font-bold">{s.name}</button>
                    <button onClick={() => removeSim(s.id)} className="text-orange"><Trash2 className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            </BrutalCard>
          )}
        </div>
      </div>
    </AppShell>
  );
};

const PhoneStat = ({ label, v, bg, pct }: { label: string; v: number; bg: string; pct?: number }) => (
  <div className={`${bg} brutal-border rounded-xl p-2`}>
    <div className="text-[10px] uppercase font-bold opacity-70">{label}</div>
    <div className="font-display font-bold text-base"><NumberTicker value={v} prefix="₹" /></div>
    {pct !== undefined && <div className="text-[10px]">{Math.round(pct)}% of income</div>}
  </div>
);

const DiffRow = ({ label, v, suffix, delta, negativeIsGood }: { label: string; v: number; suffix?: string; delta?: number; negativeIsGood?: boolean }) => {
  const good = delta === undefined ? null : (negativeIsGood ? delta < 0 : delta > 0);
  return (
    <div className="flex justify-between items-baseline mt-1.5">
      <span className="text-sm font-medium">{label}</span>
      <span className="font-display font-bold flex items-baseline gap-1">
        {suffix ? <NumberTicker value={v} /> : <NumberTicker value={v} prefix="₹" />}{suffix}
        {delta !== undefined && delta !== 0 && (
          <span className={`text-xs ${good ? 'text-success' : 'text-danger'}`}>{delta>0?'↑':'↓'}{Math.abs(Math.round(delta))}</span>
        )}
      </span>
    </div>
  );
};

const ScenarioInputs = ({ id, params, setParams }: { id: ScenarioType; params: Record<string, number>; setParams: (p: Record<string, number>) => void }) => {
  const set = (k: string, v: number) => setParams({ ...params, [k]: v });
  switch (id) {
    case 'rent_change': return <Slider label="Rent change ₹" v={params.delta||0} onChange={v => set('delta', v)} min={-10000} max={20000} step={500} />;
    case 'salary_change': return <Slider label="Salary change ₹" v={params.delta||0} onChange={v => set('delta', v)} min={-20000} max={50000} step={1000} />;
    case 'new_loan': return <>
      <Slider label="Principal" v={params.principal||0} onChange={v => set('principal', v)} min={10000} max={2000000} step={10000} />
      <Slider label="Rate %" v={params.rate||0} onChange={v => set('rate', v)} min={5} max={24} step={0.5} />
      <Slider label="Tenure (months)" v={params.months||0} onChange={v => set('months', v)} min={6} max={120} step={6} />
    </>;
    case 'sip_increase': return <Slider label="Add to SIP ₹" v={params.delta||0} onChange={v => set('delta', v)} min={0} max={20000} step={500} />;
    case 'emergency': return <Slider label="One-time hit ₹" v={params.amount||0} onChange={v => set('amount', v)} min={0} max={200000} step={1000} />;
    case 'overspend': return <Slider label="Extra spend ₹" v={params.extra||0} onChange={v => set('extra', v)} min={0} max={20000} step={500} />;
  }
};

const Slider = ({ label, v, onChange, min, max, step }: { label: string; v: number; onChange: (v: number) => void; min: number; max: number; step: number }) => (
  <div className="mb-3">
    <div className="flex justify-between"><label className="text-xs font-bold uppercase">{label}</label><span className="font-display font-bold">{formatINR(v)}</span></div>
    <input type="range" min={min} max={max} step={step} value={v} onChange={e => onChange(Number(e.target.value))} className="w-full accent-foreground" />
  </div>
);

export default Simulate;
