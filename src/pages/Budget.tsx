import { useEffect, useState } from 'react';
import { AppShell } from '@/components/fti/AppShell';
import { BrutalCard } from '@/components/fti/BrutalCard';
import { BrutalButton } from '@/components/fti/BrutalButton';
import { ScribbleUnderline } from '@/components/fti/Doodle';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { calcEMI, formatINR, getCibilTier } from '@/lib/finance';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Info, Plus, Trash2, History } from 'lucide-react';
import { toast } from 'sonner';
import { NumberTicker } from '@/components/fti/NumberTicker';

type Snapshot = { id: string; job_type: string; ctc: number; in_hand: number; note: string | null; saved_at: string };

const Budget = () => {
  const { user } = useAuth();
  const fd = useFinanceData();
  const [tab, setTab] = useState<'income' | 'cibil' | 'planner'>('income');

  if (fd.loading) return <AppShell><div className="font-marker text-3xl">Loading your money…</div></AppShell>;

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold inline-block relative">
          Budget Lab
          <ScribbleUnderline className="absolute -bottom-3 left-0 right-0 h-3 text-lime" />
        </h1>
        <p className="font-hand text-2xl text-muted-foreground mt-2">income · loans · spending — all in one place</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {([['income','Income'],['cibil','Loans & CIBIL'],['planner','Planner']] as const).map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={`brutal-btn ${tab===k?'bg-lime':'bg-card'} text-sm`}>{l}</button>
        ))}
      </div>

      {tab === 'income' && <IncomePanel fd={fd} userId={user!.id} />}
      {tab === 'cibil' && <CibilLoansPanel fd={fd} userId={user!.id} />}
      {tab === 'planner' && <PlannerPanel fd={fd} userId={user!.id} />}
    </AppShell>
  );
};

/* ───── Income ───── */
const IncomePanel = ({ fd, userId }: { fd: ReturnType<typeof useFinanceData>; userId: string }) => {
  const [job, setJob] = useState(fd.income?.job_type ?? 'private');
  const [ctc, setCtc] = useState(fd.income?.ctc ?? 0);
  const [inHand, setInHand] = useState(fd.income?.in_hand ?? 0);
  const [note, setNote] = useState('');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loadingSnaps, setLoadingSnaps] = useState(true);

  useEffect(() => {
    setJob(fd.income?.job_type ?? 'private');
    setCtc(fd.income?.ctc ?? 0);
    setInHand(fd.income?.in_hand ?? 0);
  }, [fd.income?.user_id]);

  const fetchSnapshots = async () => {
    setLoadingSnaps(true);
    const { data, error } = await supabase
      .from('income_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })
      .limit(50);
    if (!error) setSnapshots((data as Snapshot[]) ?? []);
    setLoadingSnaps(false);
  };

  useEffect(() => { fetchSnapshots(); }, [userId]);

  const save = async () => {
    const ctcNum = Number(ctc) || 0;
    const inHandNum = Number(inHand) || 0;

    // 1. Upsert current income profile
    const { error } = await supabase.from('income_profiles').upsert({
      user_id: userId, job_type: job, ctc: ctcNum, in_hand: inHandNum,
      cibil_score: fd.income?.cibil_score ?? 700,
    });
    if (error) return toast.error(error.message);

    // 2. Optimistic update — add to dashboard IMMEDIATELY
    const optimisticEntry: Snapshot = {
      id: `temp-${Date.now()}`,
      job_type: job,
      ctc: ctcNum,
      in_hand: inHandNum,
      note: note.trim() || null,
      saved_at: new Date().toISOString(),
    };
    setSnapshots(prev => [optimisticEntry, ...prev]);

    // 3. Persist snapshot to Supabase in background, then sync real ID
    supabase.from('income_snapshots').insert({
      user_id: userId,
      job_type: job,
      ctc: ctcNum,
      in_hand: inHandNum,
      note: note.trim() || null,
    }).then(({ data }) => {
      if (data) {
        // Replace optimistic entry with real one from DB
        fetchSnapshots();
      }
    });

    toast.success('Income saved & logged! 📊');
    setNote('');
    fd.refresh();
  };

  const deleteSnapshot = async (id: string) => {
    // Optimistic remove — disappears instantly
    setSnapshots(prev => prev.filter(s => s.id !== id));
    // Only call DB delete if it's a real (non-optimistic) ID
    if (!id.startsWith('temp-')) {
      await supabase.from('income_snapshots').delete().eq('id', id);
    }
  };

  const JOB_EMOJI: Record<string, string> = { gov: '🏛️', private: '🏢', freelancer: '💻' };

  return (
    <div className="space-y-6">
      {/* ── Top: Form + Quick Stats ── */}
      <div className="grid lg:grid-cols-2 gap-5">
        <BrutalCard tilt={-1}>
          <h3 className="font-display font-bold text-2xl mb-4">Tell us about your income</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase">Job type</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {['gov','private','freelancer'].map(j => (
                  <button key={j} type="button" onClick={() => setJob(j)}
                    className={`brutal-border rounded-xl py-2.5 font-bold capitalize ${job===j?'bg-lime':'bg-card'}`}>
                    {JOB_EMOJI[j]} {j}
                  </button>
                ))}
              </div>
            </div>
            <FieldNum label="CTC (annual)" value={ctc} onChange={setCtc} tip="Cost-to-Company: total package incl. employer contributions" />
            <FieldNum label="In-hand (monthly)" value={inHand} onChange={setInHand} tip="Take-home after PF, tax & deductions" />
            <div>
              <label className="text-xs font-bold uppercase">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder='e.g. "After appraisal" or "Test scenario"'
                className="w-full brutal-border rounded-xl bg-card px-3 py-2.5 mt-1 font-medium focus:outline-none focus:ring-4 focus:ring-lime/40"
              />
            </div>
            <BrutalButton color="lime" onClick={save}>💾 Save &amp; Log Income</BrutalButton>
          </div>
        </BrutalCard>

        <BrutalCard color="cream" tilt={1}>
          <h3 className="font-display font-bold text-2xl mb-3">Quick stats</h3>
          <div className="space-y-3">
            <Stat label="In-hand / month" value={formatINR(Number(inHand))} />
            <Stat label="In-hand / year" value={formatINR(Number(inHand) * 12)} />
            <Stat label="Implied tax + deductions" value={formatINR(Math.max(0, Number(ctc) - Number(inHand) * 12))} />
            <div className="brutal-border rounded-xl bg-card p-3 text-sm">
              <strong className="font-display">CTC vs In-hand:</strong> CTC includes employer PF, gratuity, and bonuses you don't see monthly.
            </div>
          </div>
          {/* Mini summary of last save */}
          {snapshots.length > 0 && (
            <div className="mt-4 brutal-border bg-lime rounded-xl p-3">
              <p className="text-xs font-bold uppercase mb-1">Last saved</p>
              <p className="font-display font-bold text-lg">{formatINR(snapshots[0].in_hand)}<span className="text-sm font-normal">/mo</span></p>
              <p className="text-xs text-ink/70">{new Date(snapshots[0].saved_at).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}</p>
            </div>
          )}
        </BrutalCard>
      </div>

      {/* ── Bottom: Income History Dashboard ── */}
      <BrutalCard color="cream">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple" />
            <h3 className="font-display font-bold text-2xl">Income History</h3>
          </div>
          <span className="sticker bg-ink text-lime text-sm">{snapshots.length} entries</span>
        </div>

        {loadingSnaps && (
          <p className="font-hand text-xl text-muted-foreground">Loading history…</p>
        )}

        {!loadingSnaps && snapshots.length === 0 && (
          <div className="text-center py-8">
            <p className="font-hand text-2xl text-muted-foreground">No entries yet!</p>
            <p className="text-sm text-muted-foreground mt-1">Fill in your income above and hit Save to log your first entry.</p>
          </div>
        )}

        {!loadingSnaps && snapshots.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-foreground">
                  <th className="text-left py-2 px-3 font-display font-bold uppercase text-xs">#</th>
                  <th className="text-left py-2 px-3 font-display font-bold uppercase text-xs">Date & Time</th>
                  <th className="text-left py-2 px-3 font-display font-bold uppercase text-xs">Job Type</th>
                  <th className="text-right py-2 px-3 font-display font-bold uppercase text-xs">CTC (Annual)</th>
                  <th className="text-right py-2 px-3 font-display font-bold uppercase text-xs">In-hand / mo</th>
                  <th className="text-right py-2 px-3 font-display font-bold uppercase text-xs">Deductions / yr</th>
                  <th className="text-left py-2 px-3 font-display font-bold uppercase text-xs">Note</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s, i) => {
                  const deductions = Math.max(0, s.ctc - s.in_hand * 12);
                  const isLatest = i === 0;
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-foreground/20 hover:bg-lime/20 transition-colors ${
                        isLatest ? 'bg-lime/30 font-bold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-muted-foreground font-mono text-xs">{snapshots.length - i}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div>{new Date(s.saved_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</div>
                        <div className="text-xs text-muted-foreground">{new Date(s.saved_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`sticker text-xs ${
                          s.job_type === 'gov' ? 'bg-purple text-cream' :
                          s.job_type === 'private' ? 'bg-orange text-white' : 'bg-lime text-ink'
                        }`}>
                          {JOB_EMOJI[s.job_type] ?? ''} {s.job_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-display font-bold">{formatINR(s.ctc)}</td>
                      <td className="py-2.5 px-3 text-right font-display font-bold text-lime-700">{formatINR(s.in_hand)}</td>
                      <td className="py-2.5 px-3 text-right text-orange font-bold">{formatINR(deductions)}</td>
                      <td className="py-2.5 px-3 text-muted-foreground italic text-xs max-w-[140px] truncate">{s.note ?? '—'}</td>
                      <td className="py-2.5 px-3">
                        <button onClick={() => deleteSnapshot(s.id)} className="text-orange hover:scale-110 transition-transform" title="Delete entry">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Summary footer */}
              <tfoot>
                <tr className="border-t-2 border-foreground bg-ink text-cream">
                  <td colSpan={3} className="py-2.5 px-3 font-display font-bold text-xs uppercase">Average ({snapshots.length} entries)</td>
                  <td className="py-2.5 px-3 text-right font-display font-bold text-lime">
                    {formatINR(Math.round(snapshots.reduce((s, r) => s + r.ctc, 0) / snapshots.length))}
                  </td>
                  <td className="py-2.5 px-3 text-right font-display font-bold text-lime">
                    {formatINR(Math.round(snapshots.reduce((s, r) => s + r.in_hand, 0) / snapshots.length))}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </BrutalCard>
    </div>
  );
};

/* ───── CIBIL + Loans ───── */
const CibilLoansPanel = ({ fd, userId }: { fd: ReturnType<typeof useFinanceData>; userId: string }) => {
  const [score, setScore] = useState(fd.income?.cibil_score ?? 700);
  useEffect(() => setScore(fd.income?.cibil_score ?? 700), [fd.income?.user_id]);
  const tier = getCibilTier(score);

  const saveScore = async (v: number) => {
    setScore(v);
    await supabase.from('income_profiles').upsert({
      user_id: userId, cibil_score: v,
      job_type: fd.income?.job_type ?? 'private',
      ctc: fd.income?.ctc ?? 0, in_hand: fd.income?.in_hand ?? 0,
    });
  };

  const addLoan = async () => {
    const { error } = await supabase.from('loans').insert({ user_id: userId, name: 'New loan', principal: 100000, rate: 10, tenure_months: 24 });
    if (error) return toast.error(error.message);
    fd.refresh();
  };
  const updateLoan = async (id: string, patch: Partial<{ name: string; principal: number; rate: number; tenure_months: number }>) => {
    await supabase.from('loans').update(patch).eq('id', id);
    fd.refresh();
  };
  const removeLoan = async (id: string) => { await supabase.from('loans').delete().eq('id', id); fd.refresh(); };

  // Gauge
  const pct = ((score - 300) / 600) * 100;

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      <BrutalCard tilt={-1} className="lg:col-span-3">
        <h3 className="font-display font-bold text-2xl mb-3">CIBIL Score</h3>
        <div className="flex items-end gap-4 mb-4">
          <div className="font-display font-bold text-7xl"><NumberTicker value={score} /></div>
          <div className={`sticker ${tier.color}`}>{tier.emoji} {tier.label}</div>
        </div>
        <p className="font-medium mb-3">{tier.message}</p>
        <input type="range" min={300} max={900} value={score} onChange={e => saveScore(Number(e.target.value))} className="w-full accent-foreground h-2" />
        <div className="relative h-5 brutal-border rounded-full mt-3 overflow-hidden bg-card">
          <div className="absolute inset-y-0 left-0 flex w-full">
            <div className="flex-[300] bg-danger" />
            <div className="flex-[50] bg-orange" />
            <div className="flex-[50] bg-warning" />
            <div className="flex-[50] bg-success-soft" />
            <div className="flex-[150] bg-success" />
          </div>
          <motion.div className="absolute top-[-6px] w-2 h-7 bg-ink" animate={{ left: `${pct}%` }} transition={{ type: 'spring', stiffness: 200 }} />
        </div>
        <div className="flex justify-between text-[10px] mt-1 font-bold"><span>300</span><span>600</span><span>650</span><span>700</span><span>750</span><span>900</span></div>

        <div className="mt-5">
          <p className="font-display font-bold mb-2">Tips to improve:</p>
          <ul className="space-y-2">
            {tier.tips.map((t,i) => (
              <li key={i} className="brutal-border bg-cream rounded-xl p-2.5 text-sm flex gap-2"><span className="font-marker text-lg">{i+1}.</span> {t}</li>
            ))}
          </ul>
        </div>
      </BrutalCard>

      <BrutalCard color="cream" tilt={1} className="lg:col-span-2">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-display font-bold text-2xl">Your loans</h3>
          <BrutalButton color="lime" size="sm" onClick={addLoan}><Plus className="w-4 h-4" /> Add</BrutalButton>
        </div>
        {fd.loans.length === 0 && <p className="font-hand text-xl text-muted-foreground">No loans yet — lucky you!</p>}
        <div className="space-y-3">
          {fd.loans.map(l => {
            const emi = calcEMI(l.principal, l.rate, l.tenure_months);
            return (
              <div key={l.id} className="brutal-border rounded-xl bg-card p-3 space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <input value={l.name} onChange={e => updateLoan(l.id, { name: e.target.value })} className="font-bold bg-transparent outline-none border-b-2 border-dashed border-foreground/30 flex-1" />
                  <button onClick={() => removeLoan(l.id)} className="text-orange"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <LoanField label="₹" value={l.principal} onChange={v => updateLoan(l.id, { principal: v })} />
                  <LoanField label="%" value={l.rate} onChange={v => updateLoan(l.id, { rate: v })} step={0.1} />
                  <LoanField label="mo" value={l.tenure_months} onChange={v => updateLoan(l.id, { tenure_months: v })} />
                </div>
                <div className="text-sm bg-lime brutal-border rounded-lg px-2 py-1 font-bold inline-block">EMI: {formatINR(emi)}/mo</div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 brutal-border bg-ink text-cream rounded-xl p-3">
          <div className="text-xs uppercase font-bold opacity-70">Total EMI</div>
          <div className="font-display text-2xl font-bold">{formatINR(fd.totalEMI)}/mo</div>
        </div>
      </BrutalCard>
    </div>
  );
};

const LoanField = ({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) => (
  <label className="brutal-border rounded-lg p-1.5 flex items-center gap-1 bg-cream">
    <span className="font-bold">{label}</span>
    <input type="number" step={step} value={value} onChange={e => onChange(Number(e.target.value)||0)} className="w-full bg-transparent outline-none" />
  </label>
);

/* ───── Planner ───── */
const COLORS = ['hsl(var(--lime))','hsl(var(--purple))','hsl(var(--orange))','hsl(var(--success))','hsl(var(--warning))','hsl(var(--ink))'];

const PlannerPanel = ({ fd, userId }: { fd: ReturnType<typeof useFinanceData>; userId: string }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [newAmt, setNewAmt] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [expenseColors, setExpenseColors] = useState<Record<string, string>>(() => JSON.parse(localStorage.getItem('expenseColors') || '{}'));
  const [history, setHistory] = useState<{date: string, categories: string, total: number}[]>(() => JSON.parse(localStorage.getItem('expenseHistory') || '[]'));

  const confirmAddExpense = async () => {
    if (!newCat.trim()) {
      toast.error('Category name is required');
      return;
    }
    const { data, error } = await supabase.from('expenses').insert({ user_id: userId, category: newCat, amount: Number(newAmt) || 0 }).select();
    if (!error && data) {
      const updatedColors = { ...expenseColors, [data[0].id]: newColor };
      setExpenseColors(updatedColors);
      localStorage.setItem('expenseColors', JSON.stringify(updatedColors));
      setShowAddModal(false);
      setNewCat('');
      setNewAmt('');
      fd.refresh();
      toast.success('Category added');
    } else {
      toast.error('Failed to add category');
    }
  };

  const saveSnapshot = () => {
    const total = fd.expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const cats = fd.expenses.map(e => e.category).join(', ');
    const newEntry = { date: new Date().toISOString(), categories: cats, total };
    const updated = [newEntry, ...history];
    setHistory(updated);
    localStorage.setItem('expenseHistory', JSON.stringify(updated));
    toast.success('History snapshot saved!');
  };
  const updateExpense = async (id: string, patch: Partial<{ category: string; amount: number }>) => {
    await supabase.from('expenses').update(patch).eq('id', id); fd.refresh();
  };
  const removeExpense = async (id: string) => { await supabase.from('expenses').delete().eq('id', id); fd.refresh(); };

  const seed = async () => {
    const cats = [['Rent', 12000],['Food',5000],['Transport',2000],['Utilities',1500],['Subscriptions',800]];
    for (const [c,a] of cats) await supabase.from('expenses').insert({ user_id: userId, category: c as string, amount: a as number });
    fd.refresh();
  };

  const data = fd.expenses.map((e, i) => ({ 
    name: e.category, 
    value: Number(e.amount),
    color: expenseColors[e.id] || COLORS[i % COLORS.length]
  }));
  const savingsLow = fd.savingsRate < 0.2;
  const chartData = [...history].reverse().map((h, i) => ({ name: `Snap ${i+1}`, total: h.total }));

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-5 gap-5">
        <BrutalCard tilt={-1} className="lg:col-span-3 relative">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-display font-bold text-2xl">Monthly expenses</h3>
            <div className="flex gap-2">
              {fd.expenses.length === 0 && <BrutalButton color="cream" size="sm" onClick={seed}>Quick start</BrutalButton>}
              <BrutalButton color="lime" size="sm" onClick={() => setShowAddModal(true)}><Plus className="w-4 h-4" /> Add</BrutalButton>
            </div>
          </div>
          {fd.expenses.length === 0 && <p className="font-hand text-xl text-muted-foreground">Add categories to see your breakdown.</p>}
          <div className="space-y-2">
            {fd.expenses.map((e, i) => (
              <div key={e.id} className="brutal-border rounded-xl bg-card p-2.5 flex gap-2 items-center">
                <span className="w-4 h-4 rounded-full brutal-border" style={{ background: expenseColors[e.id] || COLORS[i % COLORS.length] }} />
                <input value={e.category} onChange={ev => updateExpense(e.id, { category: ev.target.value })} className="flex-1 font-medium bg-transparent outline-none" />
                <input type="number" value={e.amount} onChange={ev => updateExpense(e.id, { amount: Number(ev.target.value)||0 })} className="w-28 brutal-border rounded-lg bg-cream px-2 py-1 text-right font-bold" />
                <button onClick={() => removeExpense(e.id)} className="text-orange"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          {showAddModal && (
            <div className="absolute inset-0 z-10 bg-cream/90 backdrop-blur-sm p-4 flex items-center justify-center rounded-xl brutal-border">
              <BrutalCard className="w-full max-w-sm bg-card brutal-shadow-sm p-5 border-2 shadow-lg">
                <h4 className="font-display font-bold text-xl mb-4">Add Category</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase">Name</label>
                    <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Groceries" className="w-full brutal-border rounded-xl bg-cream px-3 py-2 mt-1 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase">Amount (₹)</label>
                    <input type="number" value={newAmt} onChange={e => setNewAmt(e.target.value)} placeholder="5000" className="w-full brutal-border rounded-xl bg-cream px-3 py-2 mt-1 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase">Color</label>
                    <div className="flex gap-2 mt-2">
                      {COLORS.map(c => (
                        <button key={c} onClick={() => setNewColor(c)} className={`w-8 h-8 rounded-full brutal-border transition-transform ${newColor === c ? 'scale-125 border-[3px]' : ''}`} style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-2">
                    <BrutalButton color="lime" className="flex-1" onClick={confirmAddExpense}>Save</BrutalButton>
                    <BrutalButton color="cream" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</BrutalButton>
                  </div>
                </div>
              </BrutalCard>
            </div>
          )}
        </BrutalCard>

        <div className="lg:col-span-2 space-y-5">
          <BrutalCard color={savingsLow ? 'orange' : 'lime'} tilt={1}>
            <p className="text-xs font-bold uppercase">Disposable / month</p>
            <p className="font-display text-4xl font-bold"><NumberTicker value={fd.disposable} prefix="₹" /></p>
            <p className="text-sm mt-1">Savings rate: <strong>{Math.round(fd.savingsRate * 100)}%</strong></p>
            {savingsLow && <p className="font-marker text-lg mt-2">⚠ savings under 20% — trim something!</p>}
          </BrutalCard>
          <BrutalCard color="cream">
            <h4 className="font-display font-bold text-xl mb-2">Breakdown</h4>
            {data.length === 0 ? <p className="text-sm text-muted-foreground">Add expenses to see chart.</p> : (
              <div className="h-56">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" stroke="hsl(var(--ink))" strokeWidth={2}>
                      {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ background: 'hsl(var(--cream))', border: '3px solid hsl(var(--ink))', borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </BrutalCard>
        </div>
      </div>

      <BrutalCard color="cream">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple" />
            <h3 className="font-display font-bold text-2xl">Expense History Dashboard</h3>
          </div>
          <BrutalButton color="purple" size="sm" onClick={saveSnapshot}><Plus className="w-4 h-4" /> Save Snapshot</BrutalButton>
        </div>
        
        {history.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-5 mt-4">
            <div className="overflow-auto max-h-64 brutal-border rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-ink text-cream sticky top-0">
                  <tr>
                    <th className="p-2 font-display uppercase">Date & Time</th>
                    <th className="p-2 font-display uppercase">Categories</th>
                    <th className="p-2 font-display uppercase text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} className="border-b border-foreground/20 hover:bg-card">
                      <td className="p-2 whitespace-nowrap">
                        <div className="font-bold">{new Date(h.date).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">{new Date(h.date).toLocaleTimeString()}</div>
                      </td>
                      <td className="p-2 text-xs truncate max-w-[150px]">{h.categories}</td>
                      <td className="p-2 text-right font-display font-bold text-orange">{formatINR(h.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {chartData.length > 1 && (
              <div className="h-64 w-full bg-card brutal-border rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase mb-2">Trend over time</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--foreground)/0.2)" />
                    <XAxis dataKey="name" tick={{fontSize: 10}} />
                    <YAxis tickFormatter={(v) => `₹${v/1000}k`} tick={{fontSize: 10}} width={40} />
                    <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ background: 'hsl(var(--cream))', border: '2px solid hsl(var(--ink))', borderRadius: 8 }} />
                    <Line type="monotone" dataKey="total" stroke="hsl(var(--orange))" strokeWidth={3} dot={{ stroke: 'hsl(var(--ink))', strokeWidth: 2, r: 4, fill: 'hsl(var(--orange))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="font-hand text-xl">No snapshots yet.</p>
            <p className="text-sm">Click "Save Snapshot" to record your current expenses.</p>
          </div>
        )}
      </BrutalCard>
    </div>
  );
};

/* ───── helpers ───── */
const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center brutal-border rounded-xl bg-card p-3">
    <span className="text-sm font-medium">{label}</span>
    <span className="font-display font-bold text-lg">{value}</span>
  </div>
);

const FieldNum = ({ label, value, onChange, tip }: { label: string; value: number; onChange: (v: number) => void; tip?: string }) => (
  <div>
    <label className="text-xs font-bold uppercase flex items-center gap-1">{label}{tip && <span title={tip} className="text-muted-foreground"><Info className="w-3 h-3" /></span>}</label>
    <input type="number" value={value} onChange={e => onChange(Number(e.target.value)||0)} className="w-full brutal-border rounded-xl bg-card px-3 py-2.5 mt-1 font-bold focus:outline-none focus:ring-4 focus:ring-lime/40" />
  </div>
);

export default Budget;
