import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, CreditCard, Wallet, Landmark, TrendingUp, Trash2 } from 'lucide-react';

function Assets({ wallets, isDark, color, liveRates }) {
  const [showAdd, setShowAdd] = useState(false);

  const totalBalance = useMemo(() => {
    return wallets?.reduce((acc, w) => {
      const val = parseFloat(w.balance || 0);
      if (w.iconType === 'USD') return acc + (val * (liveRates?.USD || 33));
      if (w.iconType === 'GOLD') return acc + (val * (liveRates?.GOLD || 3150));
      return acc + val;
    }, 0);
  }, [wallets, liveRates]);

  const txt = isDark ? 'text-white' : 'text-slate-900';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-6 pt-24 pb-40">
      <header className="mb-16">
        <h1 className={`text-7xl font-black tracking-tighter mb-4 ${txt}`}>Assets.</h1>
        <p className={`text-sm opacity-50 font-medium tracking-widest uppercase ${txt}`}>Cüzdanlar ve Birikim</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {wallets?.map((wallet, idx) => (
          <div key={idx} className={`p-10 rounded-[3rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className="flex justify-between items-start mb-10">
              <div className={`p-4 rounded-2xl ${color.bg} text-white`}>
                {wallet.type === 'Banka' ? <Landmark size={24}/> : <Wallet size={24}/>}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${txt}`}>{wallet.type}</span>
            </div>
            <h3 className={`text-2xl font-bold mb-1 ${txt}`}>{wallet.name}</h3>
            <p className={`text-4xl font-black tracking-tight ${txt}`}>
              {wallet.balance.toLocaleString('tr-TR')} <span className="text-xl opacity-30 font-medium">{wallet.iconType || '₺'}</span>
            </p>
          </div>
        ))}

        <button 
          onClick={() => setShowAdd(true)}
          className={`p-10 rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all ${isDark ? 'border-white/10 hover:border-white/30 text-white/30 hover:text-white' : 'border-slate-200 hover:border-indigo-500 text-slate-300 hover:text-indigo-500'}`}
        >
          <Plus size={40} strokeWidth={3}/>
          <span className="text-xs font-black uppercase tracking-widest">Yeni Cüzdan Ekle</span>
        </button>
      </div>
    </motion.div>
  );
}

export default Assets;