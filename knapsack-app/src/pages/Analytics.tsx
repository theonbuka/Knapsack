import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, AlertCircle, BarChart2 } from 'lucide-react';
import { convertFromTRY, normalizeCurrencySymbol } from '../utils/currency';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } },
};

function Analytics({ transactions = [], isDark, color, prefs, liveRates, cats = [] }) {
  const cur = normalizeCurrencySymbol(prefs?.currency);
  const txt = isDark ? 'text-white' : 'text-slate-900';
  const sub = isDark ? 'text-white/60' : 'text-slate-600';
  const cardBg = isDark ? 'bg-white/[0.035] border-white/[0.08]' : 'bg-white border-slate-200 shadow-lg shadow-slate-200/50';

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = transactions.filter(t => {
      const d = new Date(t.created);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonthIdx = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const lastMonth = transactions.filter(t => {
      const d = new Date(t.created);
      return d.getMonth() === lastMonthIdx && d.getFullYear() === lastMonthYear;
    });

    const totalIncome = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const totalExpense = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const lastExpense = lastMonth.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const changePct = lastExpense > 0 ? ((totalExpense - lastExpense) / lastExpense) * 100 : 0;
    const savings = totalIncome - totalExpense;
    const savingsPct = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    const byCategory = cats.map(cat => {
      const catTxs = thisMonth.filter(t => t.categoryId === cat.id && t.type === 'expense');
      const spent = catTxs.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
      return { ...cat, spent, count: catTxs.length, pct: totalExpense > 0 ? (spent / totalExpense) * 100 : 0 };
    }).filter(c => c.spent > 0).sort((a, b) => b.spent - a.spent);

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayStr = d.toLocaleDateString('tr-TR', { weekday: 'short' });
      const amount = transactions
        .filter(t => t.type === 'expense' && new Date(t.created).toDateString() === d.toDateString())
        .reduce((s, t) => s + parseFloat(t.amount || 0), 0);
      return { day: dayStr, amount, date: d };
    });
    const maxDay = Math.max(...last7.map(d => d.amount), 1);

    const expRingPct = totalIncome > 0 ? Math.min((totalExpense / totalIncome) * 100, 100) : 0;

    return { totalIncome, totalExpense, changePct, byCategory, last7, maxDay, savings, savingsPct, expRingPct };
  }, [transactions, cats]);

  const kpis = [
    { label: 'Bu Ay Gider', value: stats.totalExpense, cls: 'text-rose-500', fmt: v => `${cur}${convertFromTRY(v, cur, liveRates).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, icon: <TrendingDown size={14} className="text-rose-500" /> },
    { label: 'Bu Ay Gelir', value: stats.totalIncome, cls: 'text-emerald-500', fmt: v => `${cur}${convertFromTRY(v, cur, liveRates).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, icon: <TrendingUp size={14} className="text-emerald-500" /> },
    { label: 'Birikim', value: stats.savings, cls: stats.savings >= 0 ? 'text-emerald-500' : 'text-rose-500', fmt: v => `${v >= 0 ? '+' : ''}${cur}${convertFromTRY(Math.abs(v), cur, liveRates).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, icon: null },
    { label: 'Geçen Aya Göre', value: stats.changePct, cls: stats.changePct > 0 ? 'text-rose-500' : 'text-emerald-500', fmt: v => `${v > 0 ? '+' : ''}%${Math.abs(v).toFixed(1)}`, icon: null },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-[calc(env(safe-area-inset-bottom)+11rem)]"
    >
      <header className="mb-10">
        <p className={`text-[10px] font-semibold uppercase tracking-[0.45em] mb-2 text-indigo-500/60`}>Knapsack</p>
        <h1 className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${txt}`}>Analiz</h1>
        <p className={`text-[10px] font-semibold uppercase tracking-widest mt-1 ${sub}`}>Harcama Analizi</p>
      </header>

      {/* KPI GRID */}
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
      >
        {kpis.map(({ label, value, cls, fmt, icon }) => (
          <motion.div key={label} variants={stagger.item} className={`p-5 sm:p-6 rounded-[2rem] border ${cardBg}`}>
            <div className="flex items-center gap-1.5 mb-2">
              {icon}
              <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${sub}`}>{label}</p>
            </div>
            <p className={`font-num text-xl sm:text-2xl font-extrabold ${cls}`}>{fmt(value)}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* INCOME vs EXPENSE RING */}
      {stats.totalIncome > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-6 sm:p-8 rounded-[2.5rem] border mb-6 ${cardBg}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-emerald-500" />
              <span className={`text-sm font-black ${txt}`}>Birikim Oranı</span>
            </div>
            <span className={`text-sm font-black ${stats.savingsPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              %{Math.max(0, stats.savingsPct).toFixed(1)}
            </span>
          </div>
          <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(stats.savingsPct, 100))}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              className="h-full rounded-full bg-emerald-500"
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className={`text-[10px] ${sub}`}>Gider: {cur}{convertFromTRY(stats.totalExpense, cur, liveRates).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
            <span className={`text-[10px] ${sub}`}>Gelir: {cur}{convertFromTRY(stats.totalIncome, cur, liveRates).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
          </div>
        </motion.div>
      )}

      {/* 7-DAY BAR CHART */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className={`p-6 sm:p-8 rounded-[2.5rem] border mb-6 ${cardBg}`}
      >
        <div className="flex items-center gap-2.5 mb-8">
          <div className={`p-2 rounded-xl ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-50'}`}>
            <BarChart2 size={15} className="text-indigo-500" />
          </div>
          <h2 className={`text-base font-black ${txt}`}>Son 7 Gün Gider</h2>
        </div>
        <div className="flex items-end gap-2 sm:gap-3 h-36">
          {stats.last7.map(({ day, amount }) => {
            const pct = (amount / stats.maxDay) * 100;
            const isToday = amount > 0 && stats.last7.at(-1).day === day;
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <p className={`text-[8px] sm:text-[9px] font-black ${sub} h-4 flex items-end`}>
                  {amount > 0 ? `${(amount / 1000).toFixed(1)}k` : ''}
                </p>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${Math.max(pct, amount > 0 ? 4 : 2)}%`, opacity: 1 }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 + stats.last7.findIndex(d => d.day === day) * 0.06 }}
                  className={`w-full rounded-xl ${isToday ? color.bg : isDark ? 'bg-indigo-500/30' : 'bg-indigo-200'}`}
                  style={{ minHeight: amount > 0 ? '8px' : '3px' }}
                />
                <span className={`text-[8px] sm:text-[10px] font-black uppercase ${sub}`}>{day}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* CATEGORY BREAKDOWN */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`p-6 sm:p-8 rounded-[2.5rem] border ${cardBg}`}
      >
        <div className="flex items-center gap-2.5 mb-7">
          <h2 className={`text-base font-black ${txt}`}>Kategoriye Göre</h2>
          <span className={`text-[10px] font-black ${sub}`}>Bu ay</span>
        </div>
        {stats.byCategory.length === 0 ? (
          <p className={`text-sm py-8 text-center ${sub}`}>Bu ay henüz gider kaydedilmedi.</p>
        ) : (
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >
            {stats.byCategory.map(cat => {
              const limit = cat.limit || 0;
              const overLimit = limit > 0 && cat.spent > limit;
              return (
                <motion.div key={cat.id} variants={stagger.item}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        {cat.emoji || '📌'}
                      </div>
                      <span className={`text-sm font-black ${txt}`}>{cat.name}</span>
                      {overLimit && <AlertCircle size={12} className="text-rose-500 animate-pulse" />}
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-black ${txt}`}>{cur}{convertFromTRY(cat.spent, cur, liveRates).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                      {limit > 0 && <span className={`text-[10px] ml-1 ${sub}`}>/ {cur}{convertFromTRY(limit, cur, liveRates).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>}
                    </div>
                  </div>
                  {limit > 0 && (
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((cat.spent / limit) * 100, 100)}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: overLimit ? '#f43f5e' : cat.color }}
                      />
                    </div>
                  )}
                  <div className="flex justify-between mt-1">
                    <p className={`text-[9px] ${sub}`}>%{cat.pct.toFixed(1)} toplam</p>
                    {overLimit && <p className="text-[9px] font-black text-rose-500">Limit Aşıldı</p>}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default Analytics;
