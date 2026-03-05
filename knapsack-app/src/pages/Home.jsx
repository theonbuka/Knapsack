import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

function Home({ transactions, wallets, isDark, prefs, color, liveRates }) {
  const metrics = useMemo(() => {
    let total = 0;
    wallets?.forEach(w => {
      const val = parseFloat(w.balance || 0);
      if (w.iconType === 'USD') total += val * (liveRates?.USD || 33);
      else if (w.iconType === 'GOLD') total += val * (liveRates?.GOLD || 3150);
      else total += val;
    });
    return total;
  }, [wallets, liveRates]);

  const txt = isDark ? 'text-white' : 'text-slate-900';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-6 pt-24">
      <header className="mb-20">
        <div className="flex items-center gap-3 mb-4">
          <Activity size={18} className="text-indigo-500 animate-pulse"/>
          <span className={`text-[12px] font-black uppercase tracking-[0.5em] opacity-40 italic ${txt}`}>System Active</span>
        </div>
        <h1 className={`text-8xl md:text-[10rem] font-black tracking-tighter leading-none ${txt}`}>Knapsack.</h1>
      </header>

      <div className={`p-16 rounded-[4rem] border ${isDark ? 'bg-indigo-600/5 border-white/10' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <p className="text-sm font-black uppercase tracking-[0.4em] mb-6 text-indigo-500">Net Birikim</p>
        <h2 className={`text-7xl md:text-9xl font-black tracking-tighter ${txt}`}>
          {prefs?.currency || '₺'}{metrics.toLocaleString('tr-TR')}
        </h2>
      </div>
    </motion.div>
  );
}

export default Home;