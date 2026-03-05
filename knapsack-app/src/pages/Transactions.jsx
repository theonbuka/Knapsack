import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react';

function Transactions({ transactions, isDark, color }) {
  const txt = isDark ? 'text-white' : 'text-slate-900';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-6 pt-24 pb-40">
      <header className="flex justify-between items-end mb-16">
        <div>
          <h1 className={`text-7xl font-black tracking-tighter mb-4 ${txt}`}>History.</h1>
          <p className={`text-sm opacity-50 font-medium tracking-widest uppercase ${txt}`}>İşlem Kayıtları</p>
        </div>
        <button className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <Filter size={20}/>
        </button>
      </header>

      <div className="space-y-4">
        {transactions?.length === 0 ? (
          <div className={`p-20 text-center rounded-[3rem] border border-dashed ${isDark ? 'border-white/10 opacity-30' : 'border-slate-200 opacity-50'}`}>
            <p className={`font-bold uppercase tracking-widest text-xs ${txt}`}>Henüz bir işlem bulunmuyor</p>
          </div>
        ) : (
          transactions.map((t, idx) => (
            <div key={idx} className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all hover:scale-[1.01] ${isDark ? 'bg-white/5 border-white/5 hover:border-white/20' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {t.type === 'income' ? <ArrowUpRight size={24}/> : <ArrowDownLeft size={24}/>}
                </div>
                <div>
                  <h4 className={`font-bold text-lg ${txt}`}>{t.note || t.category}</h4>
                  <p className={`text-xs opacity-40 uppercase tracking-tighter ${txt}`}>{t.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xl font-black ${t.type === 'income' ? 'text-emerald-500' : txt}`}>
                  {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString('tr-TR')} ₺
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

export default Transactions;