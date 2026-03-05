import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Activity, TrendingUp, PieChart, Zap, ChevronRight, AlertCircle, Target } from 'lucide-react';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.055 } } },
  item: {
    hidden: { opacity: 0, y: 14 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] } },
  },
};

export default function Home({ transactions = [], wallets = [], isDark, prefs, color, liveRates, cats = [] }) {
  const metrics = useMemo(() => {
    let totalAssets = 0, totalDebt = 0;
    const distribution = { Nakit: 0, Döviz: 0, Altın: 0 };
    const rates = liveRates || { GOLD: 3185, USD: 33.20, EUR: 35.90 };

    wallets.forEach(w => {
      const val = parseFloat(w.balance || 0);
      let tlVal = val;
      if (w.isDebt) {
        if (w.iconType === 'USD') tlVal = val * rates.USD;
        else if (w.iconType === 'EUR') tlVal = val * rates.EUR;
        else if (w.iconType === 'GOLD') tlVal = val * rates.GOLD;
        totalDebt += tlVal;
        return;
      }
      if (w.iconType === 'GOLD') { tlVal = val * rates.GOLD; distribution.Altın += tlVal; }
      else if (w.iconType === 'USD') { tlVal = val * rates.USD; distribution.Döviz += tlVal; }
      else if (w.iconType === 'EUR') { tlVal = val * rates.EUR; distribution.Döviz += tlVal; }
      else { distribution.Nakit += tlVal; }
      totalAssets += tlVal;
    });

    const now = new Date();
    const daysPassed = now.getDate() || 1;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthlyExpense = transactions
      .filter(t => t.type === 'expense' && new Date(t.created).getMonth() === now.getMonth())
      .reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const monthlyIncome = transactions
      .filter(t => t.type === 'income' && new Date(t.created).getMonth() === now.getMonth())
      .reduce((s, t) => s + parseFloat(t.amount || 0), 0);

    const predictedEnd = (monthlyExpense / daysPassed) * daysInMonth;
    const savings = monthlyIncome - monthlyExpense;
    const savingsGoal = prefs?.savingsGoal || 0;
    const savingsPct = savingsGoal > 0 ? Math.min((savings / savingsGoal) * 100, 100) : 0;

    let insight = 'Harcama disiplinin harika görünüyor.';
    if (monthlyExpense > 20000) insight = 'Bu ayki harcama ivmen yüksek. Dikkatli ol!';
    else if (monthlyExpense > 10000) insight = 'Orta düzey harcama. Kontrol altında.';
    else if (savings > 0) insight = `Bu ay ${savings.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺ tasarruf ettin!`;

    return { totalAssets, totalDebt, distribution, predictedEnd, monthlyExpense, savings, savingsPct, savingsGoal, insight };
  }, [wallets, liveRates, transactions, prefs]);

  const total = metrics.totalAssets || 1;
  const nakitPct = (metrics.distribution.Nakit / total) * 100;
  const altinPct = (metrics.distribution.Altın / total) * 100;
  const dovizPct = (metrics.distribution.Döviz / total) * 100;
  const catMap = useMemo(() => Object.fromEntries(cats.map(c => [c.id, c])), [cats]);

  const cur = prefs?.currency || '₺';
  const txt = isDark ? 'text-knapsack-dark-text' : 'text-knapsack-light-text';
  const txtSec = isDark ? 'text-knapsack-dark-text-secondary' : 'text-knapsack-light-text-secondary';
  const txtTer = isDark ? 'text-knapsack-dark-text-tertiary' : 'text-knapsack-light-text-tertiary';
  const cardBg = isDark
    ? 'bg-white/[0.04] border-white/[0.08] backdrop-blur-sm'
    : 'bg-white/95 border-slate-200/50 shadow-sm';
  const netWorth = metrics.totalAssets - metrics.totalDebt;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-44"
    >
      {/* ── LIVE TICKER ───────────────────────────────────────── */}
      <div className={`overflow-hidden py-2.5 -mx-4 sm:-mx-6 mb-12 border-b ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-200/60 bg-slate-50/30'}`}>
        <div className={`ticker-track flex gap-12 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.3em] ${isDark ? 'text-indigo-400/60' : 'text-indigo-600/50'}`}>
          {Array(6).fill([
            `USD  ${liveRates?.USD?.toFixed(2)} ₺`,
            `EUR  ${liveRates?.EUR?.toFixed(2)} ₺`,
            `XAU  ${liveRates?.GOLD?.toFixed(0)} ₺/gr`,
            'KNAPSACK  ACTIVE',
          ]).flat().map((item, i) => (
            <span key={i} className="flex items-center gap-12">
              {item}
              <span className="opacity-20">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── HERO HEADER ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mb-16"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${color.bg}`} />
          <span className={`text-xs font-bold uppercase tracking-wider opacity-60 ${txtTer}`}>
            Finance Hub
          </span>
        </div>
        <h1 className={`text-5xl sm:text-7xl font-extrabold tracking-tight leading-tight ${txt}`}>
          Knapsack
        </h1>
        <p className={`text-lg mt-3 ${txtSec}`}>Finansal durumunuzu kontrol edin, akıllı kararlar alın.</p>
      </motion.div>

      {/* ── NET WORTH + DISTRIBUTION ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6"
      >
        {/* Net Worth card */}
        <div className={`lg:col-span-2 p-7 sm:p-9 rounded-[2.5rem] border relative overflow-hidden ${
          isDark ? 'bg-indigo-500/[0.08] border-indigo-500/[0.16]' : 'bg-white border-black/[0.07] shadow-xl shadow-indigo-100/20'
        }`}>
          <div className="relative z-10">
            <p className={`text-[10px] font-semibold uppercase tracking-[0.45em] mb-5 ${isDark ? 'text-indigo-400/70' : 'text-indigo-600/70'}`}>
              Toplam Net Değer
            </p>
            <h2 className={`font-num text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-none mb-8 ${netWorth < 0 ? 'text-rose-500' : txt}`}>
              {cur}{Math.abs(netWorth).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </h2>
            <div className={`h-px mb-8 ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`} />
            <div className="flex gap-8 sm:gap-12">
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${txtSec}`}>Varlıklar</p>
                <p className="font-num text-xl sm:text-2xl font-bold text-emerald-500">
                  +{cur}{metrics.totalAssets.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </p>
              </div>
              {metrics.totalDebt > 0 && (
                <>
                  <div className={`w-px self-stretch ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`} />
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${txtSec}`}>Borçlar</p>
                    <p className="font-num text-xl sm:text-2xl font-bold text-rose-500">
                      -{cur}{metrics.totalDebt.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="absolute -right-16 -top-16 w-72 h-72 bg-indigo-500/[0.08] rounded-full blur-[90px] pointer-events-none" />
        </div>

        {/* Distribution ring */}
        <div className={`p-7 rounded-[2.5rem] border flex flex-col items-center justify-center ${cardBg}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.4em] mb-7 ${txtSec}`}>Dağılım</p>
          <div className="relative w-32 h-32 mb-7">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9155" fill="transparent"
                stroke={isDark ? '#1a1a24' : '#f1f0ea'} strokeWidth="2.5" />
              <motion.circle cx="18" cy="18" r="15.9155" fill="transparent"
                stroke="#6366f1" strokeWidth="4" strokeDasharray="100 100"
                initial={{ strokeDashoffset: 100 }}
                animate={{ strokeDashoffset: 100 - nakitPct }}
                transition={{ duration: 1.3, ease: 'easeOut', delay: 0.4 }}
                strokeLinecap="round"
              />
              <motion.circle cx="18" cy="18" r="15.9155" fill="transparent"
                stroke="#d4a853" strokeWidth="4"
                strokeDasharray={`${altinPct} 100`}
                initial={{ strokeDashoffset: 100 }}
                animate={{ strokeDashoffset: -(nakitPct) }}
                transition={{ duration: 1.3, ease: 'easeOut', delay: 0.55 }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <PieChart size={18} className={`${txtSec} opacity-30`} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full text-center">
            {[
              { c: '#6366f1', pct: nakitPct, label: 'Nakit' },
              { c: '#d4a853', pct: altinPct, label: 'Altın' },
              { c: '#34d399', pct: dovizPct, label: 'Döviz' },
            ].map(({ c, pct, label }) => (
              <div key={label}>
                <div className="w-2 h-2 rounded-full mx-auto mb-1.5" style={{ backgroundColor: c }} />
                <p className={`font-num text-sm font-bold ${txt}`}>%{(pct || 0).toFixed(0)}</p>
                <p className={`text-[10px] font-semibold uppercase tracking-widest mt-0.5 ${txtSec}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── INSIGHT + PREDICTED SPEND ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className={`p-5 sm:p-6 rounded-[2rem] border mb-6 flex items-center gap-4 ${
          isDark ? 'bg-indigo-500/[0.06] border-indigo-500/[0.12]' : 'bg-indigo-50/60 border-indigo-200/50'
        }`}
      >
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-100'}`}>
          <Zap size={16} className="text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] font-semibold uppercase tracking-widest mb-0.5 ${txtSec}`}>
            Aylık Tahmini Gider
          </p>
          <p className={`font-num text-lg font-bold ${txt}`}>
            {cur}{metrics.predictedEnd.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <p className={`text-xs font-medium max-w-[40%] text-right leading-snug ${txtSec} hidden sm:block`}>
          {metrics.insight}
        </p>
      </motion.div>

      {/* ── SAVINGS GOAL ─────────────────────────────────────── */}
      {metrics.savingsGoal > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className={`p-5 sm:p-6 rounded-[2rem] border mb-6 ${cardBg}`}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Target size={13} className="text-emerald-500 flex-shrink-0" />
              <span className={`text-sm font-semibold ${txt}`}>Tasarruf Hedefi</span>
            </div>
            <div className="text-right">
              <span className={`font-num text-sm font-bold ${metrics.savings >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {metrics.savings >= 0 ? '+' : ''}{cur}{metrics.savings.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </span>
              <span className={`text-xs ml-1 ${txtSec}`}>/ {cur}{metrics.savingsGoal.toLocaleString()}</span>
            </div>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.05]' : 'bg-black/[0.05]'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, metrics.savingsPct)}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.35 }}
              className={`h-full rounded-full ${metrics.savings >= metrics.savingsGoal ? 'bg-emerald-500' : 'bg-indigo-500'}`}
            />
          </div>
          <p className={`text-[9px] font-semibold mt-1.5 ${txtSec}`}>%{Math.max(0, metrics.savingsPct).toFixed(0)} tamamlandı</p>
        </motion.div>
      )}

      {/* ── ACTIVITY FEED ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.26 }}
        className="flex justify-between items-end mb-5 px-1"
      >
        <div>
          <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${txt}`}>
            Son Hareketler
          </h2>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.4em] mt-1 opacity-50 ${txtSec}`}>
            Activity Log
          </p>
        </div>
        <Link
          to="/transactions"
          className={`text-[10px] font-semibold uppercase tracking-[0.35em] flex items-center gap-1 transition-opacity opacity-25 hover:opacity-80 ${txt}`}
        >
          Tümü <ChevronRight size={11} />
        </Link>
      </motion.div>

      {transactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`p-14 text-center rounded-[2.5rem] border border-dashed ${
            isDark ? 'border-white/[0.07] opacity-40' : 'border-black/[0.07] opacity-50'
          }`}
        >
          <p className={`text-xs font-medium uppercase tracking-widest ${txt}`}>
            Henüz işlem yok — + butonuna dokun
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="space-y-2.5"
        >
          {transactions.slice(0, 6).map(t => {
            const cat = catMap[t.categoryId] || cats[0] || { name: 'Genel', emoji: '📌', color: '#6366f1' };
            const catSpend = transactions
              .filter(tx => tx.categoryId === t.categoryId && tx.type === 'expense')
              .reduce((s, tx) => s + parseFloat(tx.amount || 0), 0);
            const isOverLimit = cat.limit > 0 && catSpend > cat.limit;

            return (
              <motion.div
                key={t.id}
                variants={stagger.item}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className={`flex items-center justify-between p-4 sm:p-5 rounded-[1.8rem] border transition-shadow cursor-default group ${cardBg}`}
                style={{ willChange: 'transform' }}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: `${cat.color}1a` }}
                  >
                    {cat.emoji || '📌'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className={`font-semibold text-sm truncate ${txt}`}>{t.title || cat.name}</h4>
                      {isOverLimit && <AlertCircle size={11} className="text-rose-500 animate-pulse flex-shrink-0" />}
                    </div>
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] mt-0.5 ${txtSec}`}>
                      {cat.name}
                      <span className="mx-1.5 opacity-30">·</span>
                      {new Date(t.created).toLocaleDateString('tr-TR')}
                    </p>
                    {t.note && <p className={`text-xs italic mt-0.5 truncate ${txtSec}`}>{t.note}</p>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 pl-3">
                  <p className={`font-num text-base sm:text-lg font-extrabold ${t.type === 'expense' ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {t.type === 'expense' ? '−' : '+'}
                    {parseFloat(t.amount || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    <span className={`text-[10px] font-semibold ml-0.5 ${txtSec}`}>{cur}</span>
                  </p>
                  {isOverLimit && (
                    <span className="text-[10px] font-semibold text-rose-500 uppercase tracking-widest block mt-0.5">
                      Limit Aşıldı
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
