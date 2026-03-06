import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Search, Trash2, Edit3, X, Check, Filter } from 'lucide-react';
import { customDB } from '../utils/constants';
import { convertFromTRY, normalizeCurrencySymbol } from '../utils/currency';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.04 } } },
  item: { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } },
};

function EditModal({ tx, cats, isDark, color, wallets, onSave, onClose }) {
  const [form, setForm] = useState({
    type: tx.type || 'expense',
    amount: tx.amount || '',
    currency: tx.currency || '₺',
    title: tx.title || '',
    note: tx.note || '',
    categoryId: tx.categoryId || 'c1',
    walletId: tx.walletId || '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const txt = isDark ? 'text-white' : 'text-slate-900';
  const inputCls = isDark
    ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500/40'
    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className={`w-full max-w-md rounded-t-[2.25rem] sm:rounded-[2.5rem] border ${isDark ? 'bg-[#0c0c0d] border-white/10' : 'bg-white border-slate-200 shadow-2xl'}`}
      >
        <div className="max-h-[86dvh] sm:max-h-[92vh] overflow-y-auto p-6 sm:p-8 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`font-num text-2xl font-bold tracking-tighter ${txt}`}>İşlemi Düzenle</h2>
            <button onClick={onClose} className={`p-2.5 rounded-2xl transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}>
              <X size={18} className={txt} />
            </button>
          </div>
          <div className="space-y-3.5">
            <div className={`flex gap-1.5 p-1.5 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
              {[['expense', 'Gider'], ['income', 'Gelir']].map(([t, label]) => (
                <button key={t} type="button" onClick={() => set('type', t)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${form.type === t ? (t === 'income' ? 'bg-emerald-500 text-white shadow' : 'bg-rose-500 text-white shadow') : 'opacity-40 hover:opacity-70'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-3 items-stretch">
              <input
                type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
                className={`flex-1 px-4 py-3.5 rounded-2xl border font-num text-xl font-bold outline-none transition-all ${inputCls}`}
                style={{ color: form.type === 'income' ? '#10b981' : '#f43f5e' }}
              />
              <div className="flex gap-1">
                {['₺', 'USD', 'EUR'].map(c => (
                  <button key={c} type="button" onClick={() => set('currency', c)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-black border transition-all ${form.currency === c ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <input type="text" placeholder="Başlık" value={form.title} onChange={e => set('title', e.target.value)}
              className={`w-full px-4 py-3.5 rounded-2xl border text-sm font-medium outline-none transition-all ${inputCls}`} />
            <input type="text" placeholder="Not (opsiyonel)" value={form.note} onChange={e => set('note', e.target.value)}
              className={`w-full px-4 py-3 rounded-2xl border text-sm outline-none opacity-70 focus:opacity-100 transition-all ${inputCls}`} />
            <div className="flex flex-wrap gap-1.5">
              {cats.map(cat => (
                <button key={cat.id} type="button" onClick={() => set('categoryId', cat.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black border transition-all ${form.categoryId === cat.id ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                  <span>{cat.emoji || '📌'}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
            {wallets.length > 0 && (
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 opacity-30 ${txt}`}>Ödeme Kaynağı</p>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => set('walletId', '')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-black border transition-all ${!form.walletId ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                    Belirtilmemiş
                  </button>
                  {wallets.map((w, i) => (
                    <button key={i} type="button" onClick={() => set('walletId', w.name)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-black border transition-all ${form.walletId === w.name ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                      {w.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className={`sticky bottom-0 pt-4 ${isDark ? 'bg-gradient-to-t from-[#0c0c0d] via-[#0c0c0d] to-transparent' : 'bg-gradient-to-t from-white via-white to-transparent'}`}>
              <button onClick={() => onSave(form)}
                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-opacity hover:opacity-90 ${color.bg}`}>
                <Check size={15} className="inline mr-2" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Transactions({ transactions = [], isDark, color, prefs, liveRates, refreshData, cats = [], wallets = [], updateTransaction }) {
  const catMap = useMemo(() => Object.fromEntries(cats.map(c => [c.id, c])), [cats]);
  const cur = normalizeCurrencySymbol(prefs?.currency);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [monthFilter, setMonth] = useState('all');
  const [yearFilter, setYear] = useState('all');
  const [editTx, setEditTx] = useState(null);

  const years = useMemo(() =>
    [...new Set(transactions.map(t => new Date(t.created).getFullYear()))].sort((a, b) => b - a),
    [transactions]);

  const filtered = useMemo(() => transactions.filter(t => {
    if (filter === 'income' && t.type !== 'income') return false;
    if (filter === 'expense' && t.type !== 'expense') return false;
    if (search && !(t.title || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (monthFilter !== 'all' && new Date(t.created).getMonth() !== parseInt(monthFilter)) return false;
    if (yearFilter !== 'all' && new Date(t.created).getFullYear() !== parseInt(yearFilter)) return false;
    return true;
  }), [transactions, filter, search, monthFilter, yearFilter]);

  const totals = useMemo(() => {
    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    return { income, expense, net: income - expense };
  }, [filtered]);

  const deleteTransaction = (id) => {
    customDB.set('knapsack_t', customDB.get('knapsack_t', []).filter(t => t.id !== id));
    if (refreshData) refreshData();
  };

  const handleSave = (form) => {
    if (updateTransaction) updateTransaction(editTx.id, form);
    setEditTx(null);
  };

  const txt = isDark ? 'text-white' : 'text-slate-900';
  const sub = isDark ? 'text-white/60' : 'text-slate-600';
  const cardBg = isDark ? 'bg-white/[0.035] border-white/[0.08]' : 'bg-white border-slate-100 shadow-sm';
  const inputCls = isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30' : 'bg-white border-slate-200 text-slate-900';
  const selCls = isDark ? 'bg-[#111] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-44"
    >
      <header className="mb-8">
        <p className={`text-[10px] font-semibold uppercase tracking-[0.45em] mb-2 text-indigo-500/60`}>Knapsack</p>
        <h1 className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${txt}`}>Harcama Geçmişi</h1>
        <p className={`text-[10px] font-semibold uppercase tracking-widest mt-1 ${sub}`}>İşlem Kayıtları</p>
      </header>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Gelir', value: totals.income, cls: 'text-emerald-500' },
          { label: 'Gider', value: totals.expense, cls: 'text-rose-500' },
          { label: 'Net', value: totals.net, cls: totals.net >= 0 ? 'text-emerald-500' : 'text-rose-500' },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`p-4 sm:p-5 rounded-[1.8rem] border text-center ${cardBg}`}>
            <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1 ${sub}`}>{label}</p>
            <p className={`font-num text-base sm:text-xl font-bold ${cls}`}>
              {value >= 0 ? '+' : ''}
              {convertFromTRY(Math.abs(value), cur, liveRates).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              {' '}
              {cur}
            </p>
          </div>
        ))}
      </div>

      {/* SEARCH */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border mb-3 ${inputCls}`}>
        <Search size={15} className={`flex-shrink-0 ${sub}`} />
        <input
          type="text" placeholder="İşlem ara..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-transparent outline-none text-sm font-medium w-full"
        />
        {search && (
          <button onClick={() => setSearch('')} className={`flex-shrink-0 ${sub} hover:opacity-100`}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* FILTERS — horizontal scroll on mobile */}
      <div className="flex items-center gap-2 mb-7 overflow-x-auto pb-1 scrollbar-none">
        <div className={`flex items-center gap-1 p-1 rounded-xl mr-1 flex-shrink-0 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
          <Filter size={12} className={sub} />
        </div>
        {[['all', 'Tümü'], ['income', 'Gelir'], ['expense', 'Gider']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-widest border flex-shrink-0 transition-all ${filter === val ? `${color.bg} text-white border-transparent shadow-sm` : isDark ? 'border-white/10 text-white/40 hover:text-white/70' : 'border-slate-200 text-slate-400 hover:text-slate-600'}`}>
            {label}
          </button>
        ))}
        <select value={monthFilter} onChange={e => setMonth(e.target.value)}
          className={`px-3 py-2 rounded-xl text-xs font-black border outline-none cursor-pointer flex-shrink-0 ${selCls}`}>
          <option value="all">Tüm Aylar</option>
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        {years.length > 0 && (
          <select value={yearFilter} onChange={e => setYear(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-black border outline-none cursor-pointer flex-shrink-0 ${selCls}`}>
            <option value="all">Tüm Yıllar</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </div>

      {/* LIST */}
      {filtered.length === 0 ? (
        <div className={`p-16 text-center rounded-[2.5rem] border border-dashed ${isDark ? 'border-white/8 opacity-40' : 'border-slate-200 opacity-50'}`}>
          <p className={`font-black uppercase tracking-widest text-xs ${txt}`}>
            {transactions.length === 0 ? 'Henüz işlem yok' : 'Sonuç bulunamadı'}
          </p>
        </div>
      ) : (
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="space-y-2.5"
        >
          {filtered.map((t, idx) => {
            const cat = catMap[t.categoryId] || cats[0] || { name: 'Genel', emoji: '📌', color: '#6366f1' };
            return (
              <motion.div
                key={t.id || idx}
                variants={stagger.item}
                whileHover={{ scale: 1.005, transition: { duration: 0.15 } }}
                className={`group flex items-center justify-between p-4 sm:p-5 rounded-[2rem] border transition-all ${cardBg}`}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className={`p-2.5 rounded-2xl flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                  </div>
                  <div className="min-w-0">
                    <h4 className={`font-bold text-sm truncate ${txt}`}>{t.title || cat.name}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-sm leading-none">{cat.emoji || '📌'}</span>
                      <span className="text-[9px] font-black uppercase tracking-wide" style={{ color: cat.color }}>{cat.name}</span>
                      {t.walletId && <span className={`text-[9px] font-black ${sub}`}>· {t.walletId}</span>}
                      <span className={`text-[9px] ${sub}`}>{t.created ? new Date(t.created).toLocaleDateString('tr-TR') : ''}</span>
                    </div>
                    {t.note && <p className={`text-xs italic mt-0.5 truncate ${sub}`}>{t.note}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 pl-2">
                  <div className="text-right">
                    <p className={`font-num text-base sm:text-lg font-bold ${t.type === 'income' ? 'text-emerald-500' : txt}`}>
                      {t.type === 'income' ? '+' : '-'}
                      {convertFromTRY(parseFloat(t.amount || 0), cur, liveRates).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      {' '}
                      {cur}
                    </p>
                    {t.currency && t.currency !== '₺' && <p className={`text-[9px] mt-0.5 ${sub}`}>{t.currency}</p>}
                  </div>
                  <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditTx(t)}
                      className={`p-1.5 rounded-xl transition-colors ${isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}>
                      <Edit3 size={12} />
                    </button>
                    <button onClick={() => deleteTransaction(t.id)}
                      className="p-1.5 rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <AnimatePresence>
        {editTx && (
          <EditModal
            tx={editTx} cats={cats} isDark={isDark} color={color}
            wallets={wallets} onSave={handleSave} onClose={() => setEditTx(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Transactions;
