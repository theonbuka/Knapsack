import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, CheckCircle, Circle, Zap, CreditCard, Home as HomeIcon, Bell, Edit3 } from 'lucide-react';
import { EXPENSE_TYPES } from '../utils/constants';
import { convertFromTRY, convertToTRY, normalizeCurrencySymbol } from '../utils/currency';

/* ─── streaming / known services ─────────────────────────────────────── */
const KNOWN_SERVICES = [
  { name: 'Netflix', bg: '#E50914', text: '#fff', abbr: 'N', emoji: '🎬' },
  { name: 'Spotify', bg: '#1DB954', text: '#fff', abbr: 'S', emoji: '🎵' },
  { name: 'YouTube Premium', bg: '#FF0000', text: '#fff', abbr: 'YT', emoji: '▶️' },
  { name: 'Disney+', bg: '#113CCF', text: '#fff', abbr: 'D+', emoji: '🏰' },
  { name: 'Apple TV+', bg: '#1C1C1E', text: '#fff', abbr: 'TV+', emoji: '🍎' },
  { name: 'Amazon Prime', bg: '#00A8E0', text: '#fff', abbr: 'AP', emoji: '📦' },
  { name: 'HBO Max', bg: '#5822C9', text: '#fff', abbr: 'HBO', emoji: '🎭' },
  { name: 'Mubi', bg: '#291208', text: '#fff', abbr: 'M', emoji: '🎥' },
  { name: 'Blutv', bg: '#00B4D8', text: '#fff', abbr: 'B', emoji: '📺' },
  { name: 'Gain', bg: '#7B2FBE', text: '#fff', abbr: 'G', emoji: '🎞️' },
  { name: 'Exxen', bg: '#FF4F00', text: '#fff', abbr: 'EX', emoji: '📡' },
  { name: 'Tabii', bg: '#C8102E', text: '#fff', abbr: 'TB', emoji: '🦅' },
  { name: 'Tidal', bg: '#000000', text: '#fff', abbr: 'TI', emoji: '🌊' },
  { name: 'Apple Music', bg: '#FC3C44', text: '#fff', abbr: 'AM', emoji: '🎶' },
  { name: 'Deezer', bg: '#A238FF', text: '#fff', abbr: 'DZ', emoji: '🎸' },
  { name: 'ChatGPT Plus', bg: '#10A37F', text: '#fff', abbr: 'AI', emoji: '🤖' },
  { name: 'Claude Pro', bg: '#CC785C', text: '#fff', abbr: 'CL', emoji: '🧠' },
  { name: 'Midjourney', bg: '#000', text: '#fff', abbr: 'MJ', emoji: '🎨' },
  { name: 'Adobe CC', bg: '#FF0000', text: '#fff', abbr: 'AD', emoji: '🖌️' },
  { name: 'Microsoft 365', bg: '#0078D4', text: '#fff', abbr: 'M365',emoji: '💼' },
  { name: 'Google One', bg: '#4285F4', text: '#fff', abbr: 'G1', emoji: '☁️' },
  { name: 'iCloud+', bg: '#3693EB', text: '#fff', abbr: 'iC', emoji: '🍎' },
  { name: 'Dropbox', bg: '#0061FF', text: '#fff', abbr: 'DB', emoji: '📂' },
  { name: 'Notion', bg: '#000000', text: '#fff', abbr: 'NO', emoji: '📝' },
  { name: 'Figma', bg: '#F24E1E', text: '#fff', abbr: 'FG', emoji: '✏️' },
  { name: 'GitHub Pro', bg: '#24292E', text: '#fff', abbr: 'GH', emoji: '💻' },
  { name: 'LinkedIn Premium', bg: '#0A66C2', text: '#fff', abbr: 'LI', emoji: '🔗' },
  { name: 'Duolingo', bg: '#58CC02', text: '#fff', abbr: 'DU', emoji: '🦉' },
  { name: 'VPN', bg: '#6366f1', text: '#fff', abbr: 'VPN', emoji: '🔒' },
  { name: 'Antivirus', bg: '#34d399', text: '#fff', abbr: 'AV', emoji: '🛡️' },
];

const TYPE_META = {
  bill:         { label: 'Fatura', icon: <Zap size={18}/>, color: '#818cf8', bg: 'bg-violet-500/10', text: 'text-violet-400' },
  subscription: { label: 'Abonelik', icon: <CreditCard size={18}/>, color: '#60a5fa', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  rent:         { label: 'Sabit Giderler', icon: <HomeIcon size={18}/>, color: '#f87171', bg: 'bg-rose-500/10', text: 'text-rose-400' },
};

const EMPTY_FORM = { type: 'bill', name: '', amount: '', currency: '₺', dueDay: 1, serviceKey: '' };
const DAY_MS = 24 * 60 * 60 * 1000;

function clampDueDay(year, month, dueDay) {
  const maxDay = new Date(year, month + 1, 0).getDate();
  const normalized = Math.max(1, parseInt(dueDay, 10) || 1);
  return Math.min(normalized, maxDay);
}

function buildDueDate(year, month, dueDay) {
  return new Date(year, month, clampDueDay(year, month, dueDay));
}

function getCurrentMonthDueDate(dueDay, referenceDate) {
  return buildDueDate(referenceDate.getFullYear(), referenceDate.getMonth(), dueDay);
}

function getNextDueDate(dueDay, referenceDate) {
  const currentMonthDue = getCurrentMonthDueDate(dueDay, referenceDate);
  if (currentMonthDue.getTime() >= referenceDate.getTime()) {
    return currentMonthDue;
  }

  const year = referenceDate.getMonth() === 11 ? referenceDate.getFullYear() + 1 : referenceDate.getFullYear();
  const month = referenceDate.getMonth() === 11 ? 0 : referenceDate.getMonth() + 1;
  return buildDueDate(year, month, dueDay);
}

/* ─── ServiceBadge ──────────────────────────────────────────────────── */
function ServiceBadge({ name, size = 'md' }) {
  const svc = KNOWN_SERVICES.find(s => name?.toLowerCase().includes(s.name.toLowerCase()));
  if (!svc) return null;
  const sz = size === 'sm' ? 'w-7 h-7 text-[9px]' : 'w-10 h-10 text-xs';
  return (
    <div className={`${sz} rounded-xl flex items-center justify-center font-black flex-shrink-0`}
      style={{ backgroundColor: svc.bg, color: svc.text }}>
      {svc.abbr}
    </div>
  );
}

/* ─── Expenses page ──────────────────────────────────────────────────── */
function Expenses({ expenses = [], isDark, color, prefs, liveRates, addExpense, removeExpense, toggleExpensePaid, updateExpense }) {
  const [tab, setTab] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [svcSearch, setSvcSearch] = useState('');
  const displayCurrency = normalizeCurrencySymbol(prefs?.currency);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const grouped = useMemo(() => {
    const list = tab === 'all' ? expenses : expenses.filter(e => e.type === tab);
    return {
      rent:         list.filter(e => e.type === 'rent'),
      bill:         list.filter(e => e.type === 'bill'),
      subscription: list.filter(e => e.type === 'subscription'),
    };
  }, [expenses, tab]);

  const totals = useMemo(() => {
    const monthly = expenses.reduce((s, e) => s + convertToTRY(e.amount || 0, e.currency, liveRates), 0);
    const paid = expenses.filter(e => (e.paidMonths || []).includes(currentMonth))
                            .reduce((s, e) => s + convertToTRY(e.amount || 0, e.currency, liveRates), 0);
    return { monthly, paid, unpaid: monthly - paid };
  }, [expenses, currentMonth, liveRates]);

  const txt = isDark ? 'text-white' : 'text-slate-900';
  const sub = isDark ? 'text-white/40' : 'text-slate-400';
  const cardBg = isDark ? 'bg-white/[0.035] border-white/[0.08]' : 'bg-white border-slate-200 shadow-lg shadow-slate-200/50';
  const inputCls = isDark
    ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500/50'
    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400';

  const openAdd = () => { setForm(EMPTY_FORM); setSvcSearch(''); setEditItem(null); setShowAdd(true); };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.amount) return;
    const payload = { ...form, amount: parseFloat(form.amount), dueDay: parseInt(form.dueDay) };
    if (editItem) {
      updateExpense(editItem.id, payload);
    } else {
      addExpense(payload);
    }
    setForm(EMPTY_FORM); setShowAdd(false); setEditItem(null);
  };

  const filteredServices = svcSearch
    ? KNOWN_SERVICES.filter(s => s.name.toLowerCase().includes(svcSearch.toLowerCase()))
    : KNOWN_SERVICES;

  const renderExpenseRow = (item, type) => {
    const meta = TYPE_META[type];
    const isPaid = (item.paidMonths || []).includes(currentMonth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDueDate = getCurrentMonthDueDate(item.dueDay, today);
    const nextDueDate = getNextDueDate(item.dueDay, today);
    const daysLeft = Math.ceil((nextDueDate.getTime() - today.getTime()) / DAY_MS);
    const isOverdue = !isPaid && currentDueDate.getTime() < today.getTime();
    const isUrgent = !isPaid && (isOverdue || daysLeft <= 3);
    const svc = KNOWN_SERVICES.find(s => item.name?.toLowerCase().includes(s.name.toLowerCase()));

    return (
      <motion.div layout key={item.id} whileHover={{ scale: 1.005 }}
        className={`flex items-center gap-4 p-4 rounded-[2rem] border transition-all group ${isPaid ? (isDark ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' : 'bg-emerald-50 border-emerald-200 opacity-70') : cardBg}`}>

        {/* checkbox */}
        <button onClick={() => toggleExpensePaid(item.id)}
          className={`flex-shrink-0 transition-colors ${isPaid ? 'text-emerald-500' : isDark ? 'text-white/20 hover:text-white/60' : 'text-slate-300 hover:text-slate-600'}`}>
          {isPaid ? <CheckCircle size={22}/> : <Circle size={22}/>}
        </button>

        {/* icon — service badge or type icon */}
        {svc ? (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0"
            style={{ backgroundColor: svc.bg, color: svc.text }}>{svc.abbr}</div>
        ) : (
          <div className={`p-2 rounded-xl flex-shrink-0 ${meta.bg} ${meta.text}`}>{meta.icon}</div>
        )}

        {/* info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-black text-sm truncate ${isPaid ? 'line-through opacity-50' : ''} ${txt}`}>{item.name}</p>
            {isUrgent && !isPaid && (
              <span className="text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full flex-shrink-0">
                {isOverdue ? 'Gecikti' : daysLeft === 0 ? 'Bugün!' : `${daysLeft} gün`}
              </span>
            )}
          </div>
          <p className={`text-[10px] opacity-40 ${txt}`}>
            Her ay {item.dueDay}. günü{item.currency !== '₺' ? ` · ${item.currency}` : ''}
          </p>
        </div>

        {/* amount */}
        <p className={`text-lg font-black tracking-tighter flex-shrink-0 ${isPaid ? 'text-emerald-500' : txt}`}>
          {parseFloat(item.amount).toLocaleString('tr-TR')} <span className="text-xs opacity-40">{item.currency || '₺'}</span>
        </p>

        {/* actions */}
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => { setEditItem(item); setForm({ type: item.type, name: item.name, amount: String(item.amount), currency: item.currency || '₺', dueDay: item.dueDay }); setShowAdd(true); }}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
            <Edit3 size={13}/>
          </button>
          <button onClick={() => removeExpense(item.id)} className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 transition-colors">
            <Trash2 size={14}/>
          </button>
        </div>
      </motion.div>
    );
  };

  const renderExpenseSection = (items, type) => {
    const meta = TYPE_META[type];
    if (items.length === 0 && tab !== 'all') return null;
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-xl ${meta.bg} ${meta.text}`}>{meta.icon}</div>
          <h2 className={`text-base font-black ${txt}`}>{meta.label}</h2>
          <span className={`text-xs opacity-30 font-black ${txt}`}>({items.length})</span>
        </div>
        {items.length === 0 ? (
          <div className={`p-6 rounded-[2rem] border border-dashed text-center ${isDark ? 'border-white/10 opacity-30' : 'border-slate-200 opacity-50'}`}>
            <p className={`text-xs font-black uppercase tracking-widest ${txt}`}>Henüz {meta.label.toLowerCase()} yok</p>
          </div>
        ) : (
          <div className="space-y-2.5">{items.map(item => renderExpenseRow(item, type))}</div>
        )}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-[calc(env(safe-area-inset-bottom)+11rem)]">

      <header className="mb-8 flex justify-between items-end">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-2 text-indigo-500 opacity-60">Knapsack</p>
          <h1 className={`text-5xl sm:text-6xl font-extrabold tracking-tight mb-1 ${txt}`}>Giderler.</h1>
          <p className={`text-[10px] font-semibold uppercase tracking-widest ${sub}`}>Sabit Harcamalar</p>
        </div>
        <button onClick={openAdd}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm text-white ${color.bg}`}>
          <Plus size={16}/> Ekle
        </button>
      </header>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Aylık Toplam', value: totals.monthly, cls: txt },
          { label: 'Ödendi', value: totals.paid, cls: 'text-emerald-500' },
          { label: 'Kalan', value: totals.unpaid, cls: totals.unpaid > 0 ? 'text-rose-500' : txt },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`p-5 rounded-[2rem] border text-center ${cardBg}`}>
            <p className={`text-[10px] font-black uppercase tracking-widest opacity-30 mb-2 ${txt}`}>{label}</p>
            <p className={`text-xl font-black tracking-tighter ${cls}`}>
              {displayCurrency}{convertFromTRY(value, displayCurrency, liveRates).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {[['all','Tümü'],['rent','Sabit'],['bill','Faturalar'],['subscription','Abonelikler']].map(([val,label]) => (
          <button key={val} onClick={() => setTab(val)}
            className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${tab===val ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40 hover:text-white' : 'border-slate-200 text-slate-400 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {expenses.length === 0 ? (
        <div className={`p-20 rounded-[3rem] border border-dashed text-center ${isDark ? 'border-white/10 opacity-30' : 'border-slate-200 opacity-50'}`}>
          <Bell size={32} className={`mx-auto mb-4 ${txt}`}/>
          <p className={`font-black uppercase tracking-widest text-xs ${txt}`}>Sabit gider eklemediniz.</p>
        </div>
      ) : (
        <>
          {renderExpenseSection(grouped.rent, 'rent')}
          {renderExpenseSection(grouped.bill, 'bill')}
          {renderExpenseSection(grouped.subscription, 'subscription')}
        </>
      )}

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md"
            onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-t-[2.25rem] sm:rounded-[3rem] border ${isDark ? 'bg-[#0e0e0f] border-white/10' : 'bg-white border-slate-200 shadow-2xl'}`}>
              <div className="max-h-[86dvh] sm:max-h-[92vh] overflow-y-auto p-6 sm:p-8 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl font-black ${txt}`}>{editItem ? 'Gideri Düzenle' : 'Yeni Sabit Gider'}</h2>
                  <button onClick={() => setShowAdd(false)} className="opacity-40 hover:opacity-100"><X size={20} className={txt}/></button>
                </div>

                <form onSubmit={handleAdd} className="space-y-4">
                  {/* Type */}
                  <div className="flex gap-2">
                    {EXPENSE_TYPES.map(t => (
                      <button key={t.id} type="button" onClick={() => setForm(p => ({ ...p, type: t.id }))}
                        className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${form.type===t.id ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Quick-pick streaming (only for subscription) */}
                  {form.type === 'subscription' && !editItem && (
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ${txt}`}>Hızlı Seç</p>
                      <input type="text" placeholder="Ara..." value={svcSearch}
                        onChange={e => setSvcSearch(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-medium outline-none mb-2 ${inputCls}`}/>
                      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                        {filteredServices.map(svc => (
                          <button key={svc.name} type="button"
                            onClick={() => { setForm(p => ({ ...p, name: svc.name })); setSvcSearch(''); }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${form.name === svc.name ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40 hover:text-white' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                            <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black" style={{ backgroundColor: svc.bg, color: svc.text }}>{svc.abbr}</span>
                            {svc.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <input type="text" placeholder="Ad (Elektrik, Netflix...)" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                    className={`w-full px-5 py-4 rounded-2xl border text-sm font-medium outline-none ${inputCls}`}/>

                  <div className="flex gap-3 items-center">
                    <input type="number" placeholder="Tutar" value={form.amount}
                      onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required
                      className={`flex-1 px-5 py-4 rounded-2xl border text-sm font-medium outline-none ${inputCls}`}/>
                    <div className="flex gap-1.5">
                      {['₺','USD','EUR'].map(c => (
                        <button key={c} type="button" onClick={() => setForm(p => ({ ...p, currency: c }))}
                          className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${form.currency===c ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className={`text-xs font-black uppercase tracking-widest opacity-40 flex-shrink-0 ${txt}`}>Ödeme Günü</label>
                    <input type="number" min="1" max="31" value={form.dueDay}
                      onChange={e => setForm(p => ({ ...p, dueDay: e.target.value }))}
                      className={`w-20 px-4 py-3 rounded-2xl border text-sm font-black text-center outline-none ${inputCls}`}/>
                    <span className={`text-xs opacity-30 ${txt}`}>Her ayın {form.dueDay || 1}. günü</span>
                  </div>

                  <div className={`sticky bottom-0 pt-4 ${isDark ? 'bg-gradient-to-t from-[#0e0e0f] via-[#0e0e0f] to-transparent' : 'bg-gradient-to-t from-white via-white to-transparent'}`}>
                    <button type="submit"
                      className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white ${color.bg}`}>
                      {editItem ? 'Güncelle' : 'Ekle'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Expenses;
