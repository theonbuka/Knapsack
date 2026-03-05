import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, TrendingDown, TrendingUp, Calendar as CalIcon } from 'lucide-react';

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function Calendar({ transactions = [], isDark, color, prefs, cats = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDayTxs, setSelectedDayTxs] = useState([]);

  const catMap = useMemo(() => Object.fromEntries(cats.map(c => [c.id, c])), [cats]);
  const cur = prefs?.currency || '₺';
  const txt = isDark ? 'text-white' : 'text-slate-900';
  const cardBg = isDark
    ? 'bg-white/[0.03] border-white/10 backdrop-blur-xl'
    : 'bg-white border-slate-200 shadow-sm';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Group transactions by date string "YYYY-MM-DD"
  const txByDay = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const d = new Date(t.created);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const key = d.getDate();
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [transactions, year, month]);

  // Month stats
  const monthStats = useMemo(() => {
    let income = 0, expense = 0;
    transactions.forEach(t => {
      const d = new Date(t.created);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const amt = parseFloat(t.amount || 0);
      if (t.type === 'income') income += amt;
      else expense += amt;
    });
    return { income, expense, net: income - expense };
  }, [transactions, year, month]);

  // Build calendar grid (Mon-start)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startDow = firstDay.getDay(); // 0=Sun
  startDow = startDow === 0 ? 6 : startDow - 1; // convert to Mon=0

  const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startDow + 1;
    return dayNum >= 1 && dayNum <= lastDay.getDate() ? dayNum : null;
  });

  const maxExpense = useMemo(() => {
    return Math.max(...Object.values(txByDay).map(txs =>
      txs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    ), 1);
  }, [txByDay]);

  const today = new Date();
  const isToday = (d) => d === today.getDate() && year === today.getFullYear() && month === today.getMonth();

  const handleDayClick = (d) => {
    if (!d || !txByDay[d]) return;
    setSelectedDay(d);
    setSelectedDayTxs(txByDay[d]);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-44">

      {/* HEADER */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-2 text-indigo-500 opacity-60">Knapsack</p>
          <h1 className={`text-5xl sm:text-6xl font-extrabold tracking-tight ${txt}`}>
            {MONTHS[month]} <span className="opacity-30">{year}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className={`p-3 rounded-2xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 shadow-sm'}`}>
            <ChevronLeft size={20}/>
          </button>
          <button onClick={() => setCurrentDate(new Date())} className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/60' : 'bg-white border border-slate-200 text-slate-400 shadow-sm'}`}>
            Bugün
          </button>
          <button onClick={nextMonth} className={`p-3 rounded-2xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 shadow-sm'}`}>
            <ChevronRight size={20}/>
          </button>
        </div>
      </div>

      {/* MONTH SUMMARY CARDS */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Gelir', val: monthStats.income, cls: 'text-emerald-500', prefix: '+' },
          { label: 'Gider', val: monthStats.expense, cls: 'text-rose-500', prefix: '-' },
          { label: 'Net', val: monthStats.net, cls: monthStats.net >= 0 ? 'text-emerald-500' : 'text-rose-500', prefix: monthStats.net >= 0 ? '+' : '' },
        ].map(({ label, val, cls, prefix }) => (
          <div key={label} className={`p-5 rounded-[2rem] border ${cardBg}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-widest opacity-30 mb-1.5 ${txt}`}>{label}</p>
            <p className={`font-num text-xl font-bold tracking-tight ${cls}`}>
              {prefix}{cur}{Math.abs(val).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>

      {/* CALENDAR GRID */}
      <div className={`rounded-[2.5rem] border overflow-hidden ${isDark ? 'bg-white/[0.02] border-white/8' : 'bg-white border-slate-200 shadow-xl'}`}>
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {DAYS.map(d => (
            <div key={d} className={`py-3 text-center text-[10px] font-semibold uppercase tracking-widest opacity-30 ${txt}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const txs = d ? txByDay[d] || [] : [];
            const dayExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
            const dayIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
            const intensity = maxExpense > 0 ? dayExpense / maxExpense : 0;
            const hasTx = txs.length > 0;
            const _isToday = d && isToday(d);

            return (
              <div
                key={i}
                onClick={() => handleDayClick(d)}
                className={`relative min-h-[80px] sm:min-h-[96px] p-2 sm:p-3 border-b border-r transition-all
                  ${isDark ? 'border-white/5' : 'border-slate-100'}
                  ${d ? (hasTx ? 'cursor-pointer hover:bg-white/5' : '') : 'opacity-20'}
                  ${i % 7 === 6 ? 'border-r-0' : ''}
                  ${Math.floor(i / 7) === Math.floor((cells.length - 1) / 7) ? 'border-b-0' : ''}
                `}
              >
                {d && (
                  <>
                    {/* Heat background */}
                    {dayExpense > 0 && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ backgroundColor: `rgba(244, 63, 94, ${intensity * 0.18})` }}
                      />
                    )}
                    {dayIncome > 0 && dayExpense === 0 && (
                      <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(16,185,129,0.10)' }}/>
                    )}

                    {/* Day number */}
                    <div className={`relative z-10 w-7 h-7 flex items-center justify-center rounded-full text-sm font-black mb-1
                      ${_isToday ? `${color.bg} text-white` : `${txt} opacity-70`}`}>
                      {d}
                    </div>

                    {/* Amount */}
                    {hasTx && (
                      <div className="relative z-10 space-y-0.5">
                        {dayExpense > 0 && (
                          <p className="text-[9px] font-black text-rose-400 leading-tight">
                            -{(dayExpense / 1000).toFixed(1)}K
                          </p>
                        )}
                        {dayIncome > 0 && (
                          <p className="text-[9px] font-black text-emerald-400 leading-tight">
                            +{(dayIncome / 1000).toFixed(1)}K
                          </p>
                        )}
                        {/* transaction count dot */}
                        <div className="flex gap-0.5 mt-1">
                          {txs.slice(0, 4).map((_, idx) => (
                            <div key={idx} className={`w-1.5 h-1.5 rounded-full ${txs[idx]?.type === 'income' ? 'bg-emerald-400' : 'bg-rose-400'}`}/>
                          ))}
                          {txs.length > 4 && <span className="text-[8px] opacity-40 font-black">+{txs.length - 4}</span>}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* LEGEND */}
      <div className="flex items-center gap-6 mt-5 px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-400/60"/>
          <span className={`text-[10px] font-semibold uppercase tracking-widest opacity-40 ${txt}`}>Gider</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400/60"/>
          <span className={`text-[10px] font-semibold uppercase tracking-widest opacity-40 ${txt}`}>Gelir</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color.bg}`}/>
          <span className={`text-[10px] font-semibold uppercase tracking-widest opacity-40 ${txt}`}>Bugün</span>
        </div>
      </div>

      {/* DAY DETAIL MODAL */}
      <AnimatePresence>
        {selectedDay && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[300] flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setSelectedDay(null)}>
            <motion.div
              initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] border max-h-[85vh] overflow-y-auto
                ${isDark ? 'bg-[#0a0a0b] border-white/8 text-white' : 'bg-white border-slate-200 shadow-2xl text-slate-900'}`}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className={`text-3xl font-black tracking-tighter ${txt}`}>
                      {selectedDay} {MONTHS[month]}
                    </h3>
                    <p className={`text-[11px] font-black uppercase tracking-widest opacity-30 mt-1 ${txt}`}>
                      {selectedDayTxs.length} işlem
                    </p>
                  </div>
                  <button onClick={() => setSelectedDay(null)}
                    className={`p-3 rounded-2xl ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}>
                    <X size={20}/>
                  </button>
                </div>

                {/* Day summary */}
                {(() => {
                  const inc = selectedDayTxs.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
                  const exp = selectedDayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
                  return (
                    <div className={`flex gap-4 mb-6 p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                      {exp > 0 && (
                        <div className="flex items-center gap-2">
                          <TrendingDown size={14} className="text-rose-500"/>
                          <span className="text-rose-500 font-black text-sm">{cur}{exp.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                        </div>
                      )}
                      {inc > 0 && (
                        <div className="flex items-center gap-2">
                          <TrendingUp size={14} className="text-emerald-500"/>
                          <span className="text-emerald-500 font-black text-sm">{cur}{inc.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="space-y-3">
                  {selectedDayTxs.map((t, i) => {
                    const cat = catMap[t.categoryId];
                    return (
                      <div key={t.id || i} className={`flex items-center justify-between p-4 rounded-[1.5rem] border ${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg"
                            style={{ backgroundColor: cat ? `${cat.color}20` : '#6366f120' }}>
                            {cat?.emoji || (t.type === 'income' ? '💰' : '💸')}
                          </div>
                          <div>
                            <p className={`font-black text-sm ${txt}`}>{t.title || 'İsimsiz'}</p>
                            <p className={`text-[10px] font-semibold uppercase tracking-widest opacity-30 ${txt}`}>
                              {cat?.name || '—'} {t.walletId ? `• ${t.walletId}` : ''}
                            </p>
                          </div>
                        </div>
                        <p className={`font-black text-base ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {t.type === 'income' ? '+' : '-'}{parseFloat(t.amount || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} {cur}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
