import { useState } from 'react';
import { AppShell } from '@/components/fti/AppShell';
import { BrutalCard } from '@/components/fti/BrutalCard';
import { ScribbleUnderline, StarDoodle } from '@/components/fti/Doodle';
import { calcOldRegimeTax, calcNewRegimeTax, formatINR } from '@/lib/finance';
import { motion } from 'framer-motion';

const Tax = () => {
  const [gross, setGross] = useState(1200000);
  const [deductions, setDeductions] = useState(150000);
  const [age, setAge] = useState(30);

  const oldTax = calcOldRegimeTax(gross, deductions, age);
  const newTax = calcNewRegimeTax(gross);
  const winner = oldTax < newTax ? 'old' : 'new';
  const diff = Math.abs(oldTax - newTax);
  
  const chosenRegimeTax = winner === 'old' ? oldTax : newTax;
  const effectiveRate = gross > 0 ? ((chosenRegimeTax / gross) * 100).toFixed(2) : '0.00';
  const taxableOld = Math.max(0, gross - deductions);
  const taxableNew = Math.max(0, gross);

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold inline-block relative">
          Groww Tax Calculator
          <ScribbleUnderline className="absolute -bottom-3 left-0 right-0 h-3 text-purple" />
        </h1>
        <p className="font-hand text-2xl text-muted-foreground mt-2">FY 2025–26: Old vs New Regime</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <BrutalCard tilt={-1}>
          <h3 className="font-display font-bold text-2xl mb-3">Your Details</h3>
          <div className="space-y-4">
            <Slider label="Annual gross" value={gross} onChange={setGross} min={300000} max={5000000} step={50000} />
            <Slider label="Total Deductions (old)" value={deductions} onChange={setDeductions} min={0} max={1500000} step={5000} />
            <Slider label="Age" value={age} onChange={setAge} min={18} max={100} step={1} />
          </div>
        </BrutalCard>

        <RegimeCard title="Old Regime" tax={oldTax} take={gross - oldTax} taxable={taxableOld} winner={winner === 'old'} color="lime"
          notes={['Tax slabs change with age (60/80)', 'Relies heavily on deductions', 'Slabs: 5%, 20%, 30%']}/>
        <RegimeCard title="New Regime" tax={newTax} take={gross - newTax} taxable={taxableNew} winner={winner === 'new'} color="purple"
          notes={['No age-based slabs', 'Rebate up to ₹7L (Tax = 0)', 'Slabs: 5%, 10%, 15%, 20%, 30%']}/>
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-6">
        <BrutalCard color="ink" className="relative overflow-hidden">
          <StarDoodle className="absolute top-3 right-3 w-10 h-10 text-lime animate-wobble" />
          <p className="font-hand text-xl text-cream/80">Simulator Output:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 mb-4 text-cream">
            <div>
              <p className="text-xs uppercase opacity-70">Taxable Income</p>
              <p className="font-bold text-xl">{winner === 'old' ? formatINR(taxableOld) : formatINR(taxableNew)}</p>
            </div>
            <div>
              <p className="text-xs uppercase opacity-70">Chosen Regime Tax</p>
              <p className="font-bold text-xl">{formatINR(chosenRegimeTax)}</p>
            </div>
            <div>
              <p className="text-xs uppercase opacity-70">Effective Rate</p>
              <p className="font-bold text-xl text-lime">{effectiveRate}%</p>
            </div>
            <div>
              <p className="text-xs uppercase opacity-70">Better Option</p>
              <p className="font-bold text-xl text-purple">{winner === 'old' ? 'Old Regime' : 'New Regime'}</p>
            </div>
          </div>
          <h2 className="font-display font-bold text-3xl text-cream border-t border-cream/20 pt-4 mt-2">
            Save {formatINR(diff)}/year with the <span className={winner === 'old' ? 'text-lime' : 'text-purple'}>{winner === 'old' ? 'Old' : 'New'} Regime</span>
          </h2>
        </BrutalCard>
      </motion.div>
    </AppShell>
  );
};

const Slider = ({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number }) => (
  <div>
    <div className="flex justify-between mb-1"><label className="text-xs font-bold uppercase">{label}</label><span className="font-display font-bold">{label === 'Age' ? value : formatINR(value)}</span></div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full accent-foreground" />
  </div>
);

const RegimeCard = ({ title, tax, take, taxable, winner, color, notes }: { title: string; tax: number; take: number; taxable: number; winner: boolean; color: 'lime'|'purple'; notes: string[] }) => (
  <BrutalCard color={winner ? color : 'cream'} tilt={winner ? 0 : 1.5}>
    <div className="flex justify-between items-start">
      <h3 className="font-display font-bold text-2xl">{title}</h3>
      {winner && <span className="sticker bg-ink text-lime">WINNER</span>}
    </div>
    <div className="my-4">
      <p className="text-xs uppercase font-bold opacity-70">Taxable Income</p>
      <p className="font-display font-bold text-xl">{formatINR(taxable)}</p>
      
      <p className="text-xs uppercase font-bold opacity-70 mt-2">Final Tax</p>
      <p className="font-display font-bold text-3xl">{formatINR(tax)}</p>
      
      <p className="text-xs uppercase font-bold opacity-70 mt-2">Take-home</p>
      <p className="font-display font-bold text-2xl">{formatINR(take)}</p>
    </div>
    <ul className="text-sm space-y-1 opacity-80">
      {notes.map((n,i) => <li key={i}>• {n}</li>)}
    </ul>
  </BrutalCard>
);

export default Tax;
