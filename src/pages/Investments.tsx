import { useEffect, useState } from 'react';
import { AppShell } from '@/components/fti/AppShell';
import { BrutalCard } from '@/components/fti/BrutalCard';
import { BrutalButton } from '@/components/fti/BrutalButton';
import { ScribbleUnderline } from '@/components/fti/Doodle';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { calcSIP, formatINR } from '@/lib/finance';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { NumberTicker } from '@/components/fti/NumberTicker';

const Investments = () => {
  const { user } = useAuth();
  const fd = useFinanceData();
  const [monthly, setMonthly] = useState(5000);
  const [years, setYears] = useState(15);
  const [ret, setRet] = useState(12);
  const [extra, setExtra] = useState(0);

  useEffect(() => {
    if (fd.invest) {
      setMonthly(Number(fd.invest.monthly_amount) || 5000);
      setYears(fd.invest.tenure_years || 15);
      setRet(Number(fd.invest.expected_return) || 12);
    }
  }, [fd.invest?.user_id]);

  const save = async () => {
    if (!user) return;
    await supabase.from('investments_config').upsert({
      user_id: user.id, monthly_amount: monthly, tenure_years: years, expected_return: ret,
    });
    toast.success('Investment plan saved');
    fd.refresh();
  };

  // Smart allocation
  const age = 30;
  const equity = Math.max(20, 100 - age);
  const allocation = [
    { name: 'Mutual Funds', pct: Math.round(equity * 0.6), color: 'bg-lime', amount: 0 },
    { name: 'Stocks', pct: Math.round(equity * 0.4), color: 'bg-purple', amount: 0 },
    { name: 'FD', pct: Math.round((100 - equity) * 0.6), color: 'bg-orange text-white', amount: 0 },
    { name: 'Emergency Fund', pct: 100 - Math.round(equity * 0.6) - Math.round(equity * 0.4) - Math.round((100 - equity) * 0.6), color: 'bg-cream', amount: 0 },
  ].map(a => ({ ...a, amount: Math.round(monthly * a.pct / 100) }));

  // Growth chart
  const chart = Array.from({ length: years + 1 }, (_, y) => ({
    year: y,
    base: Math.round(calcSIP(monthly, y, ret)),
    boosted: Math.round(calcSIP(monthly + extra, y, ret)),
  }));

  const finalBase = chart[chart.length - 1].base;
  const finalBoosted = chart[chart.length - 1].boosted;

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold inline-block relative">
          Invest Mode
          <ScribbleUnderline className="absolute -bottom-3 left-0 right-0 h-3 text-orange" />
        </h1>
        <p className="font-hand text-2xl text-muted-foreground mt-2">small money, big future.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <BrutalCard tilt={-1} className="lg:col-span-2">
          <h3 className="font-display font-bold text-2xl mb-3">Set your SIP</h3>
          <Slider label="Monthly investment" value={monthly} onChange={setMonthly} min={500} max={100000} step={500} fmt={formatINR} />
          <Slider label="Tenure (years)" value={years} onChange={setYears} min={1} max={40} step={1} fmt={v => `${v} yr`} />
          <Slider label="Expected return %" value={ret} onChange={setRet} min={4} max={20} step={0.5} fmt={v => `${v}%`} />
          <Slider label="What if you add ₹?" value={extra} onChange={setExtra} min={0} max={20000} step={500} fmt={formatINR} />
          <BrutalButton color="lime" onClick={save} className="mt-3">Save plan</BrutalButton>
        </BrutalCard>

        <BrutalCard color="cream" className="lg:col-span-3" tilt={1}>
          <h3 className="font-display font-bold text-2xl mb-3">Future value</h3>
          <div className="flex flex-wrap gap-3 mb-3">
            <div className="brutal-border bg-lime rounded-xl px-3 py-2"><div className="text-xs font-bold uppercase">In {years}y</div><div className="font-display font-bold text-2xl"><NumberTicker value={finalBase} prefix="₹" /></div></div>
            {extra > 0 && <div className="brutal-border bg-purple rounded-xl px-3 py-2"><div className="text-xs font-bold uppercase">With +{formatINR(extra)}</div><div className="font-display font-bold text-2xl"><NumberTicker value={finalBoosted} prefix="₹" /></div></div>}
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--lime))" stopOpacity={0.9} /><stop offset="100%" stopColor="hsl(var(--lime))" stopOpacity={0.2} /></linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--purple))" stopOpacity={0.9} /><stop offset="100%" stopColor="hsl(var(--purple))" stopOpacity={0.2} /></linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="hsl(var(--ink))" />
                <YAxis stroke="hsl(var(--ink))" tickFormatter={(v) => `${(v/100000).toFixed(0)}L`} />
                <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ background: 'hsl(var(--cream))', border: '3px solid hsl(var(--ink))', borderRadius: 12 }} />
                <Area type="monotone" dataKey="base" stroke="hsl(var(--ink))" strokeWidth={2.5} fill="url(#g1)" />
                {extra > 0 && <Area type="monotone" dataKey="boosted" stroke="hsl(var(--purple))" strokeWidth={2.5} fill="url(#g2)" />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </BrutalCard>
      </div>

      <div className="mt-6">
        <h3 className="font-display font-bold text-2xl mb-3">Smart allocation of {formatINR(monthly)}</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {allocation.map((a, i) => (
            <div key={i} className={`brutal-border ${a.color} rounded-xl p-4 brutal-shadow-sm`} style={{ transform: `rotate(${i%2?1.5:-1.5}deg)` }}>
              <div className="font-display font-bold text-lg">{a.name}</div>
              <div className="text-xs font-bold opacity-70">{a.pct}%</div>
              <div className="font-display font-bold text-2xl mt-1">{formatINR(a.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
};

const Slider = ({ label, value, onChange, min, max, step, fmt }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; fmt: (v: number) => string }) => (
  <div className="mb-4">
    <div className="flex justify-between mb-1"><label className="text-xs font-bold uppercase">{label}</label><span className="font-display font-bold">{fmt(value)}</span></div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full accent-foreground" />
  </div>
);

export default Investments;
