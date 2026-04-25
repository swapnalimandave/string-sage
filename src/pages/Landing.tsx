import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp, Wallet, Zap } from 'lucide-react';
import { BrutalButton } from '@/components/fti/BrutalButton';
import { BrutalCard } from '@/components/fti/BrutalCard';
import { ScribbleUnderline, ArrowDoodle, StarDoodle, CircleDoodle } from '@/components/fti/Doodle';
import { useState } from 'react';

const features = [
  { icon: Wallet, title: 'Budget like a boss', body: 'Income, EMIs, expenses — all in one wobbly dashboard.', color: 'lime' as const, tilt: -2 },
  { icon: TrendingUp, title: 'Invest with vibes', body: 'SIPs, smart allocation, growth simulator that actually moves.', color: 'purple' as const, tilt: 1.5 },
  { icon: Zap, title: 'Simulate decisions', body: 'New loan? Rent hike? See the future before living it.', color: 'orange' as const, tilt: -1 },
  { icon: Sparkles, title: 'Learn by doing', body: 'AI-generated stories, quizzes, and games.', color: 'cream' as const, tilt: 2 },
];

const Landing = () => {
  const [lang, setLang] = useState('en');
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* nav */}
      <header className="container flex items-center justify-between py-5">
        <div className="flex items-center gap-2">
          <div className="w-11 h-11 bg-ink text-lime brutal-border rounded-xl flex items-center justify-center font-marker text-xl">F</div>
          <div className="font-display font-bold text-2xl">FTI<span className="text-orange">.</span></div>
        </div>
        <div className="flex items-center gap-2">
          <select value={lang} onChange={e => setLang(e.target.value)} className="brutal-btn bg-card !py-2 !px-3 text-xs cursor-pointer">
            <option value="en">🇬🇧 English</option>
            <option value="hi" disabled>🇮🇳 हिंदी (soon)</option>
            <option value="ta" disabled>🇮🇳 தமிழ் (soon)</option>
          </select>
          <Link to="/auth"><BrutalButton color="ink" size="sm">Login</BrutalButton></Link>
        </div>
      </header>

      {/* hero */}
      <section className="container relative pt-12 pb-24">
        {/* floating shapes */}
        <div className="absolute top-10 right-4 w-20 h-20 bg-orange brutal-border rounded-2xl animate-float-slow hidden md:block" />
        <div className="absolute top-40 left-2 w-14 h-14 bg-purple brutal-border rounded-full animate-float-slow hidden md:block" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-10 right-20 w-16 h-16 bg-lime brutal-border animate-wobble hidden md:block" />

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 sticker bg-lime mb-6">
              <Sparkles className="w-4 h-4" /> FINANCIAL TRANSFORMATION INTERFACE
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-[0.95] mb-6">
              Money,
              <span className="relative inline-block mx-2">
                <span className="relative z-10">unboring.</span>
                <span className="absolute inset-x-0 bottom-1 h-4 bg-lime -z-0 -rotate-1" />
              </span>
              <br />
              <span className="font-marker text-orange text-4xl md:text-6xl">your way.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mb-8">
              Track budgets, master tax, simulate big decisions, and learn — all in one bold, playful interface that actually feels alive.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/auth">
                <BrutalButton color="lime" size="lg">
                  Start Your Journey <ArrowRight className="w-5 h-5" />
                </BrutalButton>
              </Link>
              <Link to="/auth?mode=login">
                <BrutalButton color="cream" size="lg">I have an account</BrutalButton>
              </Link>
            </div>
            <div className="flex items-center gap-4 mt-8">
              <div className="flex -space-x-2">
                {['lime','purple','orange'].map(c => (
                  <div key={c} className={`w-9 h-9 rounded-full brutal-border bg-${c}`} />
                ))}
              </div>
              <p className="font-hand text-xl">join 10k+ smart spenders</p>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.9, rotate: -3 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.6 }} className="relative">
            {/* mock dashboard card */}
            <div className="brutal-card p-6 bg-cream">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-hand text-lg text-muted-foreground">this month</p>
                  <p className="font-display font-bold text-3xl">₹ 47,200</p>
                  <p className="text-sm">disposable income ↑</p>
                </div>
                <div className="sticker bg-lime">+12%</div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { l: 'Save', v: '₹14k', c: 'bg-lime' },
                  { l: 'Invest', v: '₹10k', c: 'bg-purple' },
                  { l: 'EMI', v: '₹8k', c: 'bg-orange text-white' },
                ].map((s,i) => (
                  <div key={i} className={`${s.c} brutal-border rounded-xl p-3 text-center`} style={{ transform: `rotate(${i===1?-1.5:i===0?1:-0.5}deg)` }}>
                    <p className="text-xs font-bold uppercase">{s.l}</p>
                    <p className="font-display font-bold text-lg">{s.v}</p>
                  </div>
                ))}
              </div>
              <div className="brutal-border rounded-xl p-3 bg-card">
                <div className="flex justify-between text-xs font-bold mb-1"><span>Health Score</span><span>78/100</span></div>
                <div className="h-3 bg-cream brutal-border rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '78%' }} transition={{ duration: 1.2, delay: 0.4 }} className="h-full bg-lime" />
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-purple brutal-border rounded-full flex items-center justify-center font-marker text-2xl animate-wobble">FTI</div>
            <ArrowDoodle className="absolute -bottom-12 -left-8 w-24 h-16 text-orange hidden md:block" />
          </motion.div>
        </div>
      </section>

      {/* features */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-display font-bold inline-block relative">
            What's inside
            <ScribbleUnderline className="absolute -bottom-3 left-0 right-0 h-3 text-orange" />
          </h2>
          <p className="font-hand text-2xl mt-4 text-muted-foreground">six tools, zero boring</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <BrutalCard key={i} color={f.color} tilt={f.tilt} className="space-y-3">
              <f.icon className="w-8 h-8" />
              <h3 className="font-display font-bold text-xl">{f.title}</h3>
              <p className="text-sm">{f.body}</p>
            </BrutalCard>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16">
        <div className="brutal-card bg-ink text-cream p-10 md:p-16 relative overflow-hidden">
          <StarDoodle className="absolute top-6 right-6 w-12 h-12 text-lime animate-wobble" />
          <CircleDoodle className="absolute -bottom-6 -left-6 w-40 h-24 text-purple opacity-60" />
          <h2 className="text-4xl md:text-6xl font-display font-bold max-w-2xl">Ready to transform your <span className="text-lime">finances?</span></h2>
          <p className="mt-4 font-hand text-2xl text-cream/80">it takes 60 seconds.</p>
          <Link to="/auth"><BrutalButton color="lime" size="lg" className="mt-6">Start Free <ArrowRight className="w-5 h-5" /></BrutalButton></Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
