import React, { useState, useLayoutEffect, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home as HomeIcon, List, CreditCard, PieChart,
  Settings as SetIcon, Plus, X, Sun, Moon, Receipt, CalendarDays,
} from 'lucide-react';
import { useFinance } from './hooks/useFinance';
import { themeColors } from './utils/constants';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthGuard } from './components/AuthGuard';
import { useAuth } from './contexts/AuthContext';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Assets = lazy(() => import('./pages/Assets'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const Landing = lazy(() => import('./pages/Landing'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Calendar = lazy(() => import('./pages/Calendar'));

const EMPTY_FORM = {
  type: 'expense', amount: '', currency: '₺',
  title: '', categoryId: 'c1', note: '', walletId: '',
};
// end EMPTY_FORM

/* ─── Quick Add Modal ─────────────────────────────────────── */
function QuickAddModal({
  isOpen,
  onClose,
  form,
  setForm,
  handleSubmit,
  isDark,
  activeColor,
  cats,
  wallets,
  submitError,
  onClearError,
}) {
  if (!isOpen) return null;

  const inputCls = isDark
    ? 'bg-white/[0.04] border-white/[0.09] text-white placeholder:text-white/25 focus:border-white/20'
    : 'bg-slate-50/80 border-slate-200 text-[#1a1920] focus:border-indigo-400/60';

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%', opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 32, stiffness: 340, mass: 0.9 }}
        className={`relative w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] border overflow-hidden ${
          isDark ? 'bg-[#0c0c14] border-white/[0.09]' : 'bg-white border-slate-200/80 shadow-2xl'
        }`}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3.5 pb-0 sm:hidden">
          <div className={`w-9 h-1 rounded-full ${isDark ? 'bg-white/12' : 'bg-slate-200'}`} />
        </div>

        <div className="max-h-[86dvh] sm:max-h-[90vh] overflow-y-auto p-6 sm:p-8 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          {/* Header row */}
          <div className="flex justify-between items-center mb-6">
            <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-white/[0.05]' : 'bg-slate-100'}`}>
              {[['expense', 'Gider'], ['income', 'Gelir']].map(([t, label]) => (
                <button
                  key={t} type="button"
                  onClick={() => setForm(p => ({ ...p, type: t }))}
                  className={`px-4 py-2 rounded-[0.6rem] text-[11px] font-bold uppercase tracking-widest transition-all ${
                    form.type === t
                      ? t === 'income'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-rose-500 text-white shadow-sm'
                      : isDark ? 'text-white/35 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className={`p-2.5 rounded-xl transition-colors ${isDark ? 'bg-white/[0.04] hover:bg-white/[0.08] text-white/50' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}
            >
              <X size={17} />
            </button>
          </div>

          {/* Amount — dramatic display */}
          <div className="mb-8 text-center py-2">
            <div className="flex items-start justify-center gap-1">
              <span className={`font-num text-2xl font-light mt-3 ${isDark ? 'text-white/25' : 'text-slate-300'}`}>
                {form.currency === 'USD' ? '$' : form.currency === 'EUR' ? '€' : '₺'}
              </span>
              <input
                type="number" placeholder="0" required value={form.amount}
                onChange={e => {
                  if (submitError) onClearError();
                  setForm(p => ({ ...p, amount: e.target.value }));
                }}
                className="font-num bg-transparent text-7xl sm:text-8xl font-extrabold outline-none w-[200px] text-center tracking-tight"
                style={{ color: form.type === 'income' ? '#34d399' : '#f87171' }}
                autoFocus
              />
            </div>
            <div className="flex justify-center gap-1.5 mt-2">
              {['₺', 'USD', 'EUR'].map(c => (
                <button
                  key={c} type="button"
                  onClick={() => {
                    if (submitError) onClearError();
                    setForm(p => ({ ...p, currency: c }));
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    form.currency === c
                      ? `${activeColor.bg} text-white border-transparent`
                      : isDark ? 'border-white/[0.08] text-white/30 hover:text-white/60' : 'border-slate-200 text-slate-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className={`h-px mb-6 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`} />

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text" placeholder="Başlık" value={form.title}
              onChange={e => {
                if (submitError) onClearError();
                setForm(p => ({ ...p, title: e.target.value }));
              }}
              required
              className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none transition-all ${inputCls}`}
            />
            <input
              type="text" placeholder="Not ekle (opsiyonel)" value={form.note || ''}
              onChange={e => {
                if (submitError) onClearError();
                setForm(p => ({ ...p, note: e.target.value }));
              }}
              className={`w-full px-4 py-2.5 rounded-2xl border text-sm outline-none transition-all ${inputCls} opacity-60 focus:opacity-100`}
            />

            {/* Categories — horizontal scroll */}
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${isDark ? 'text-white/25' : 'text-slate-400'}`}>Kategori</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                {cats.map(cat => (
                  <button
                    key={cat.id} type="button"
                    onClick={() => {
                      if (submitError) onClearError();
                      setForm(p => ({ ...p, categoryId: cat.id }));
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border flex-shrink-0 transition-all ${
                      form.categoryId === cat.id
                        ? 'border-transparent text-white shadow-sm'
                        : isDark ? 'border-white/[0.08] text-white/35 hover:text-white/65' : 'border-slate-200 text-slate-400 hover:text-slate-600'
                    }`}
                    style={form.categoryId === cat.id ? { backgroundColor: cat.color || '#6366f1' } : {}}
                  >
                    <span>{cat.emoji || '📌'}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet source */}
            {wallets && wallets.length > 0 && (
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${isDark ? 'text-white/25' : 'text-slate-400'}`}>Ödeme Kaynağı</p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (submitError) onClearError();
                      setForm(p => ({ ...p, walletId: '' }));
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border flex-shrink-0 transition-all ${
                      !form.walletId
                        ? `${activeColor.bg} text-white border-transparent`
                        : isDark ? 'border-white/[0.08] text-white/35' : 'border-slate-200 text-slate-400'
                    }`}
                  >
                    Belirtilmemiş
                  </button>
                  {wallets.map((w, i) => (
                    <button
                      key={i} type="button"
                      onClick={() => {
                        if (submitError) onClearError();
                        setForm(p => ({ ...p, walletId: w.name }));
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border flex-shrink-0 transition-all ${
                        form.walletId === w.name
                          ? (w.isDebt ? 'bg-rose-500 text-white border-transparent' : `${activeColor.bg} text-white border-transparent`)
                          : isDark ? 'border-white/[0.08] text-white/35' : 'border-slate-200 text-slate-400'
                      }`}
                    >
                      {w.isDebt ? '💳' : '🏦'} {w.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {submitError && (
              <p className="text-xs font-semibold text-rose-400" role="alert">
                {submitError}
              </p>
            )}

            <div className={`sticky bottom-0 pt-4 ${isDark ? 'bg-gradient-to-t from-[#0c0c14] via-[#0c0c14] to-transparent' : 'bg-gradient-to-t from-white via-white to-transparent'}`}>
              <button
                type="submit"
                className={`w-full py-4 rounded-2xl text-sm font-bold uppercase tracking-[0.4em] text-white transition-all hover:opacity-90 active:scale-[0.98] ${activeColor.bg}`}
                style={{ boxShadow: `0 4px 24px ${activeColor.hex}35` }}
              >
                Kaydet
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── App Shell ───────────────────────────────────────────── */
function App() {
  const loc = useLocation();
  const { isAuthenticated, auth } = useAuth();
  const {
    data, liveRates, addTransaction, updateTransaction,
    addExpense, removeExpense, toggleExpensePaid, updateExpense,
    savePrefs, saveCats, refresh, loading,
  } = useFinance();

  const [isDark, setIsDark] = useState(() => {
    const s = localStorage.getItem('knapsack_theme');
    return s !== null ? JSON.parse(s) : true;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickAddError, setQuickAddError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

  const activeColor = themeColors[data.prefs?.themeColor] || themeColors.indigo;
  const cats = data.cats || [];

  useLayoutEffect(() => {
    const root = document.documentElement;
    const bg = isDark ? '#06060a' : '#f2f1ed';
    root.style.backgroundColor = bg;
    root.style.colorScheme = isDark ? 'dark' : 'light';
    document.body.style.backgroundColor = bg;
    root.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    }
  }, [isAuthenticated, auth.email, auth.googleId, auth.name, auth.surname, refresh]);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('knapsack_theme', JSON.stringify(next));
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount) {
      setQuickAddError('Lutfen tutar giriniz.');
      return;
    }

    try {
      addTransaction(form);
      setQuickAddError('');
      setForm(EMPTY_FORM);
      setIsModalOpen(false);
    } catch (err) {
      setQuickAddError(err instanceof Error ? err.message : 'Islem kaydedilemedi.');
    }
  };

  if (loc.pathname === '/landing') {
    return (
      <Routes>
        <Route path="/landing" element={isAuthenticated ? <Navigate to="/" replace /> : <Landing />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/landing'} replace />} />
      </Routes>
    );
  }

  if (loading) {
    return (
      <div className={`h-screen flex flex-col items-center justify-center gap-3 ${isDark ? 'bg-[#06060a]' : 'bg-[#f2f1ed]'}`}>
        <p className={`text-sm font-bold tracking-[0.5em] uppercase ${isDark ? 'text-white/15' : 'text-black/20'}`}>
          KNAPSACK
        </p>
        <div className={`w-12 h-px ${isDark ? 'bg-white/8' : 'bg-black/10'}`} />
        <div className={`w-1 h-1 rounded-full animate-pulse ${activeColor.bg}`} />
      </div>
    );
  }

  const navItems = [
    { to: '/', icon: <HomeIcon size={20} strokeWidth={2} />, label: 'Home' },
    { to: '/transactions', icon: <List size={20} strokeWidth={2} />, label: 'Transactions' },
    { to: '/analytics', icon: <PieChart size={20} strokeWidth={2} />, label: 'Analytics' },
    { to: '/assets', icon: <CreditCard size={20} strokeWidth={2} />, label: 'Assets' },
    { to: '/expenses', icon: <Receipt size={20} strokeWidth={2} />, label: 'Expenses' },
    { to: '/calendar', icon: <CalendarDays size={20} strokeWidth={2} />, label: 'Calendar' },
    { to: '/settings', icon: <SetIcon size={20} strokeWidth={2} />, label: 'Settings' },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-700 overflow-x-hidden ${
      isDark ? 'dark bg-[#06060a] text-[#eeecf5]' : 'bg-[#f2f1ed] text-[#1a1920]'
    }`}>

      {/* AMBIENT BACKGROUND — static, GPU-friendly */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
        <div className={`ambient-blob1 absolute -top-1/4 -right-[10%] w-[55%] h-[55%] rounded-full blur-[120px] ${isDark ? 'opacity-[0.06]' : 'opacity-[0.10]'} ${activeColor.bg}`} />
        <div className={`ambient-blob2 absolute bottom-[10%] -left-[8%] w-[40%] h-[40%] rounded-full blur-[100px] ${isDark ? 'opacity-[0.04]' : 'opacity-[0.07]'} bg-violet-600`} />
      </div>

      {/* THEME TOGGLE */}
      <button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 z-[200] p-3 rounded-2xl transition-all ${
          isDark
            ? 'bg-white/[0.06] border border-white/[0.10] text-white/50 hover:text-yellow-400'
            : 'bg-white border border-black/[0.08] text-slate-500 hover:text-indigo-600 shadow-sm'
        }`}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-pressed={!isDark}
      >
        {isDark ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      {/* PAGES */}
      <div className="relative">
        <ErrorBoundary>
          <Suspense fallback={
            <div className={`h-screen flex flex-col items-center justify-center gap-3 ${isDark ? 'bg-[#06060a]' : 'bg-[#f2f1ed]'}`}>
              <p className={`text-sm font-bold tracking-[0.5em] uppercase ${isDark ? 'text-white/15' : 'text-black/20'}`}>
                KNAPSACK
              </p>
              <div className={`w-12 h-px ${isDark ? 'bg-white/8' : 'bg-black/10'}`} />
              <div className={`w-1 h-1 rounded-full animate-pulse ${activeColor.bg}`} />
            </div>
          }>
            <Routes location={loc} key={loc.pathname}>
              <Route path="/" element={<AuthGuard><Home transactions={data.trans} wallets={data.wallets} isDark={isDark} prefs={data.prefs} color={activeColor} liveRates={liveRates} cats={cats} /></AuthGuard>} />
              <Route path="/transactions" element={<AuthGuard><Transactions transactions={data.trans} isDark={isDark} color={activeColor} prefs={data.prefs} liveRates={liveRates} cats={cats} wallets={data.wallets} refreshData={refresh} updateTransaction={updateTransaction} /></AuthGuard>} />
              <Route path="/analytics" element={<AuthGuard><Analytics transactions={data.trans} isDark={isDark} color={activeColor} prefs={data.prefs} liveRates={liveRates} cats={cats} /></AuthGuard>} />
              <Route path="/assets" element={<AuthGuard><Assets wallets={data.wallets} refreshData={refresh} isDark={isDark} color={activeColor} liveRates={liveRates} prefs={data.prefs} /></AuthGuard>} />
              <Route path="/expenses" element={<AuthGuard><Expenses expenses={data.expenses} isDark={isDark} color={activeColor} prefs={data.prefs} liveRates={liveRates} addExpense={addExpense} removeExpense={removeExpense} toggleExpensePaid={toggleExpensePaid} updateExpense={updateExpense} /></AuthGuard>} />
              <Route path="/calendar" element={<AuthGuard><Calendar transactions={data.trans} isDark={isDark} color={activeColor} prefs={data.prefs} liveRates={liveRates} cats={cats} /></AuthGuard>} />
              <Route path="/settings" element={<AuthGuard><Settings isDark={isDark} color={activeColor} prefs={data.prefs} savePrefs={savePrefs} cats={cats} saveCats={saveCats} /></AuthGuard>} />
              <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/landing'} replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* CIRCULAR FAB */}
      <button
        onClick={() => {
          setQuickAddError('');
          setIsModalOpen(true);
        }}
        className={`fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-5 z-[250] w-[52px] h-[52px] rounded-full flex items-center justify-center ${activeColor.bg} text-white active:scale-90 transition-transform`}
        style={{ boxShadow: `0 6px 28px ${activeColor.hex}50` }}
        aria-label="Create new transaction"
        aria-expanded={isModalOpen}
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {/* DOCK NAV */}
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] left-0 right-0 flex justify-center z-[150] px-4">
        <div
          className={`flex items-center px-1.5 py-1.5 rounded-full border ${
            isDark
              ? 'bg-[#0d0d16]/95 border-white/[0.08]'
              : 'bg-white/98 border-black/[0.07] shadow-lg'
          }`}
        >
          {navItems.map(({ to, icon, label }) => {
            const isActive = loc.pathname === to;
            return (
              <Link key={to} to={to} aria-label={label} title={label}>
                <div className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all active:scale-90 ${
                  isActive ? '' : 'hover:bg-white/5'
                }`}>
                  <div className={`transition-all duration-200 ${
                    isActive
                      ? isDark ? 'text-white' : 'text-[#1a1920]'
                      : 'text-slate-400/60'
                  }`}>
                    {icon}
                  </div>
                  {isActive && (
                    <div className={`absolute -bottom-0.5 w-[5px] h-[5px] rounded-full ${activeColor.bg}`} />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* QUICK ADD MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <QuickAddModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setQuickAddError('');
              setForm(EMPTY_FORM);
            }}
            form={form} setForm={setForm}
            handleSubmit={handleSubmit}
            isDark={isDark} activeColor={activeColor}
            cats={cats} wallets={data.wallets}
            submitError={quickAddError}
            onClearError={() => setQuickAddError('')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
