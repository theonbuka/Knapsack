import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Wallet, Landmark, Trash2, X, TrendingUp, TrendingDown,
  CreditCard, Edit3, Calculator, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { customDB, UNIT_LABELS } from '../utils/constants';
import { convertFromTRY, normalizeCurrencySymbol } from '../utils/currency';

/* ─── helpers ─────────────────────────────────────────────────────────── */
// PMT — standart kredi taksit formülü
function calcPMT(principal, monthlyRatePct, months) {
  if (!principal || !months) return 0;
  const r = monthlyRatePct / 100;
  if (r === 0) return principal / months;
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

const ASSET_TYPES = ['Nakit', 'Banka', 'Dijital', 'Yatırım'];
const CURRENCY_TYPES = ['₺', 'USD', 'EUR', 'GOLD'];

const EMPTY_ASSET = { name: '', balance: '', type: 'Nakit', iconType: '₺', isDebt: false };
const EMPTY_CC = { name: '', balance: '', type: 'Kredi Kartı', iconType: '₺', isDebt: true,
                   cardLimit: '', dueDay: 1, kmhLimit: '' };
const EMPTY_LOAN = { name: '', balance: '', type: 'Taksitli Kredi', iconType: '₺', isDebt: true,
                     months: '', interestRate: '', paidMonths: 0 };

/* ─── WalletCard ────────────────────────────────────────────────────────── */
function WalletCard({ wallet, globalIdx, isDark, color, liveRates, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const txt = isDark ? 'text-white' : 'text-slate-900';
  const rates = liveRates || { USD: 33, EUR: 35, GOLD: 3185 };
  const val = parseFloat(wallet.balance || 0);

  const tlVal = wallet.iconType === 'USD' ? val * rates.USD
              : wallet.iconType === 'EUR' ? val * rates.EUR
              : wallet.iconType === 'GOLD' ? val * rates.GOLD
              : null;

  const unitLabel = UNIT_LABELS[wallet.iconType] || wallet.iconType;
  const isDebt = wallet.isDebt;
  const isCC = wallet.type === 'Kredi Kartı';
  const isLoan = wallet.type === 'Taksitli Kredi';

  const monthlyPmt = isLoan && wallet.months && wallet.interestRate != null
    ? calcPMT(val, parseFloat(wallet.interestRate), parseInt(wallet.months))
    : 0;

  const totalCost = monthlyPmt * parseInt(wallet.months || 0);
  const totalInterest = totalCost - val;

  const remaining = isLoan ? parseInt(wallet.months || 0) - parseInt(wallet.paidMonths || 0) : 0;

  const bgCls = isDebt
    ? (isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-200 shadow-xl shadow-rose-100/30')
    : (isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-xl');

  return (
    <motion.div layout whileHover={{ y: -4 }} className={`rounded-[2.5rem] border relative group overflow-hidden ${bgCls}`}>
      <div className="p-7">
        {/* top row */}
        <div className="flex justify-between items-start mb-6">
          <div className={`p-3 rounded-2xl ${isDebt ? 'bg-rose-500/10 text-rose-400' : `${color.bg} text-white`}`}>
            {isCC ? <CreditCard size={20}/> : isLoan ? <Calculator size={20}/> : wallet.type === 'Banka' ? <Landmark size={20}/> : <Wallet size={20}/>}
          </div>
          <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {(isCC || isLoan) && (
              <button onClick={() => setExpanded(p => !p)}
                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                {expanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
              </button>
            )}
            <button onClick={() => onRemove(globalIdx)}
              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 transition-colors">
              <Trash2 size={13}/>
            </button>
          </div>
        </div>

        <span className={`text-[10px] font-black uppercase tracking-widest opacity-40 block mb-0.5 ${txt}`}>{wallet.type}</span>
        <h3 className={`text-lg font-bold mb-3 ${txt}`}>{wallet.name}</h3>

        {/* balance */}
        <p className={`text-3xl font-black tracking-tight ${isDebt ? 'text-rose-500' : txt}`}>
          {isDebt ? '-' : ''}{val.toLocaleString('tr-TR')}
          <span className="text-base opacity-40 font-medium ml-1">{unitLabel}</span>
        </p>
        {tlVal !== null && (
          <div className="flex items-center gap-1.5 mt-1">
            {isDebt ? <TrendingDown size={11} className="text-rose-400"/> : <TrendingUp size={11} className="text-indigo-400"/>}
            <p className={`text-xs font-black opacity-60 ${isDebt ? 'text-rose-400' : 'text-indigo-400'}`}>
              {isDebt ? '-' : '≈'} ₺{tlVal.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </p>
          </div>
        )}

        {/* credit card quick info */}
        {isCC && wallet.cardLimit > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className={`opacity-40 font-black uppercase tracking-wider ${txt}`}>Kullanım</span>
              <span className="font-black text-rose-400">%{Math.round((val / wallet.cardLimit) * 100)}</span>
            </div>
            <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
              <motion.div initial={{ width: 0 }}
                animate={{ width: `${Math.min((val / wallet.cardLimit) * 100, 100)}%` }}
                className={`h-full rounded-full ${(val / wallet.cardLimit) > 0.8 ? 'bg-rose-500' : 'bg-indigo-500'}`}/>
            </div>
            <p className={`text-[10px] opacity-30 mt-1 ${txt}`}>Limit: ₺{parseFloat(wallet.cardLimit).toLocaleString('tr-TR')}</p>
          </div>
        )}

        {/* loan quick info */}
        {isLoan && monthlyPmt > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
            <p className="text-sm font-black text-rose-400">
              ₺{monthlyPmt.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} <span className="text-xs opacity-60">/ay</span>
            </p>
            <p className={`text-[10px] opacity-40 ${txt}`}>Kalan {remaining} taksit</p>
          </div>
        )}
      </div>

      {/* expanded detail panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className={`border-t px-7 py-5 space-y-2 ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'}`}>
            {isCC && (
              <>
                {wallet.cardLimit > 0 && <Row label="Kart Limiti" val={`₺${parseFloat(wallet.cardLimit).toLocaleString('tr-TR')}`} txt={txt}/>}
                {wallet.dueDay > 0 && <Row label="Son Ödeme Günü" val={`Her ay ${wallet.dueDay}. günü`} txt={txt}/>}
                {wallet.kmhLimit > 0 && <Row label="KMH Limiti" val={`₺${parseFloat(wallet.kmhLimit).toLocaleString('tr-TR')}`} txt={txt}/>}
                {wallet.cardLimit > 0 && <Row label="Kalan Limit" val={`₺${Math.max(0, wallet.cardLimit - val).toLocaleString('tr-TR')}`} txt={txt} highlight="text-emerald-500"/>}
              </>
            )}
            {isLoan && (
              <>
                <Row label="Faiz Oranı (aylık)" val={`%${wallet.interestRate}`} txt={txt}/>
                <Row label="Toplam Taksit" val={`${wallet.months} ay`} txt={txt}/>
                <Row label="Kalan Taksit" val={`${remaining} ay`} txt={txt}/>
                <Row label="Aylık Taksit" val={`₺${monthlyPmt.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`} txt={txt} highlight="text-rose-400"/>
                <Row label="Toplam Ödenecek" val={`₺${totalCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`} txt={txt}/>
                <Row label="Toplam Faiz" val={`₺${totalInterest.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`} txt={txt} highlight="text-rose-400"/>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Row({ label, val, txt, highlight }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-[11px] font-black uppercase tracking-widest opacity-30 ${txt}`}>{label}</span>
      <span className={`text-sm font-black ${highlight || txt}`}>{val}</span>
    </div>
  );
}

/* ─── LoanCalcModal ─────────────────────────────────────────────────────── */
function LoanCalcModal({ isDark, inputCls, onClose, onSubmit }) {
  const txt = isDark ? 'text-white' : 'text-slate-900';
  const [form, setForm] = useState(EMPTY_LOAN);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const monthlyRate = parseFloat(form.interestRate) || 0;
  const months = parseInt(form.months) || 0;
  const principal = parseFloat(form.balance) || 0;
  const pmt = calcPMT(principal, monthlyRate, months);
  const totalCost = pmt * months;
  const totalInt = totalCost - principal;
  const annualEff = monthlyRate > 0 ? (Math.pow(1 + monthlyRate / 100, 12) - 1) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        className={`w-full max-w-lg rounded-t-[2.25rem] sm:rounded-[3rem] border ${isDark ? 'bg-[#0e0e0f] border-white/10' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <div className="max-h-[86dvh] sm:max-h-[92vh] overflow-y-auto p-6 sm:p-8 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          <div className="flex justify-between items-center mb-7">
            <div>
              <h2 className={`text-2xl font-black ${txt}`}>Taksitli Kredi / Borç</h2>
              <p className={`text-xs opacity-40 mt-1 ${txt}`}>Faiz ve taksit hesaplama</p>
            </div>
            <button onClick={onClose} className="opacity-40 hover:opacity-100"><X size={20} className={txt}/></button>
          </div>

          <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, balance: principal, months, interestRate: monthlyRate, paidMonths: parseInt(form.paidMonths) || 0, isDebt: true }); }} className="space-y-4">
            <input type="text" placeholder="Kredi / Borç adı" value={form.name}
              onChange={e => set('name', e.target.value)} required
              className={`w-full px-5 py-4 rounded-2xl border text-sm font-medium outline-none ${inputCls}`}/>

            {/* Tür seç */}
            <div className="flex gap-2">
              {['Taksitli Kredi', 'Kredi / Borç', 'Taksit'].map(t => (
                <button key={t} type="button" onClick={() => set('type', t)}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wide border transition-all ${form.type === t ? 'bg-rose-500 text-white border-transparent' : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* Ana borç */}
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>Toplam Borç Tutarı (₺)</p>
              <input type="number" placeholder="100000" value={form.balance}
                onChange={e => set('balance', e.target.value)} required min="1" step="any"
                className={`w-full px-5 py-4 rounded-2xl border text-lg font-black outline-none ${inputCls}`}/>
            </div>

            {/* Faiz + Ay */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>Aylık Faiz Oranı (%)</p>
                <div className="relative">
                  <input type="number" placeholder="3.50" step="0.01" min="0" max="100" value={form.interestRate}
                    onChange={e => set('interestRate', e.target.value)} required
                    className={`w-full px-5 py-4 rounded-2xl border text-sm font-black outline-none pr-10 ${inputCls}`}/>
                  <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm opacity-40 font-black ${txt}`}>%</span>
                </div>
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>Taksit Sayısı (Ay)</p>
                <input type="number" placeholder="36" min="1" max="360" value={form.months}
                  onChange={e => set('months', e.target.value)} required
                  className={`w-full px-5 py-4 rounded-2xl border text-sm font-black outline-none ${inputCls}`}/>
              </div>
            </div>

            {/* Ödenmiş taksit */}
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>Ödenmiş Taksit Sayısı</p>
              <input type="number" placeholder="0" min="0" max={months} value={form.paidMonths || 0}
                onChange={e => set('paidMonths', e.target.value)}
                className={`w-full px-5 py-4 rounded-2xl border text-sm font-black outline-none ${inputCls}`}/>
            </div>

            {/* LIVE CALCULATOR */}
            {principal > 0 && months > 0 && monthlyRate > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border p-5 space-y-3 ${isDark ? 'bg-rose-500/5 border-rose-500/15' : 'bg-rose-50 border-rose-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Calculator size={16} className="text-rose-400"/>
                  <span className="text-sm font-black text-rose-400">Hesaplama Sonucu</span>
                </div>
                <Row label="Aylık Taksit" val={`₺${pmt.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`} txt={txt} highlight="text-rose-500"/>
                <Row label="Toplam Ödenecek" val={`₺${totalCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`} txt={txt}/>
                <Row label="Toplam Faiz Maliyeti" val={`₺${totalInt.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`} txt={txt} highlight="text-rose-400"/>
                <Row label="Yıllık Efektif Faiz" val={`%${annualEff.toFixed(2)}`} txt={txt}/>
                {form.paidMonths > 0 && <Row label="Kalan Borç" val={`₺${Math.max(0, pmt * (months - parseInt(form.paidMonths || 0))).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`} txt={txt} highlight="text-rose-400"/>}
              </motion.div>
            )}

            {principal > 0 && months > 0 && monthlyRate === 0 && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                <AlertTriangle size={16} className="text-amber-400 flex-shrink-0"/>
                <p className="text-xs text-amber-400 font-black">Faiz oranı 0 — faizsiz eşit taksit hesaplanıyor.</p>
              </div>
            )}

            <div className={`sticky bottom-0 pt-4 ${isDark ? 'bg-gradient-to-t from-[#0e0e0f] via-[#0e0e0f] to-transparent' : 'bg-gradient-to-t from-white via-white to-transparent'}`}>
              <button type="submit" className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white bg-rose-500 hover:bg-rose-600 transition-colors">
                Kaydet
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── CreditCardModal ───────────────────────────────────────────────────── */
function CreditCardModal({ isDark, color, inputCls, onClose, onSubmit }) {
  const txt = isDark ? 'text-white' : 'text-slate-900';
  const [form, setForm] = useState(EMPTY_CC);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const debt = parseFloat(form.balance) || 0;
  const limit = parseFloat(form.cardLimit) || 0;
  const usagePct = limit > 0 ? Math.min((debt / limit) * 100, 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        className={`w-full max-w-lg rounded-t-[2.25rem] sm:rounded-[3rem] border ${isDark ? 'bg-[#0e0e0f] border-white/10' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <div className="max-h-[86dvh] sm:max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className={`text-2xl font-black ${txt}`}>Kredi Kartı / KMH Ekle</h2>
              <p className={`text-xs opacity-40 mt-1 ${txt}`}>Limit, borç ve ödeme bilgileri</p>
            </div>
            <button onClick={onClose} className="opacity-40 hover:opacity-100"><X size={20} className={txt}/></button>
          </div>

          {/* card type */}
          <div className="flex gap-2">
            {['Kredi Kartı', 'KMH', 'Kredi Kartı + KMH'].map(t => (
              <button key={t} type="button" onClick={() => set('type', t)}
                className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wide border transition-all ${form.type === t ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                {t}
              </button>
            ))}
          </div>

          <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, balance: debt, cardLimit: limit, kmhLimit: parseFloat(form.kmhLimit) || 0, dueDay: parseInt(form.dueDay), isDebt: true }); }} className="space-y-4">
            <input type="text" placeholder="Kart adı (Vakıfbank Kredi Kartı...)" value={form.name}
              onChange={e => set('name', e.target.value)} required
              className={`w-full px-5 py-4 rounded-2xl border text-sm font-medium outline-none ${inputCls}`}/>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>Mevcut Borç (₺)</p>
                <input type="number" placeholder="0" min="0" step="any" value={form.balance}
                  onChange={e => set('balance', e.target.value)} required
                  className={`w-full px-5 py-4 rounded-2xl border text-sm font-black outline-none ${inputCls}`}/>
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>Kart Limiti (₺)</p>
                <input type="number" placeholder="50000" min="0" step="any" value={form.cardLimit}
                  onChange={e => set('cardLimit', e.target.value)}
                  className={`w-full px-5 py-4 rounded-2xl border text-sm font-black outline-none ${inputCls}`}/>
              </div>
            </div>

            {(form.type === 'KMH' || form.type === 'Kredi Kartı + KMH') && (
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>KMH Limiti (₺)</p>
                <input type="number" placeholder="10000" min="0" step="any" value={form.kmhLimit}
                  onChange={e => set('kmhLimit', e.target.value)}
                  className={`w-full px-5 py-4 rounded-2xl border text-sm font-black outline-none ${inputCls}`}/>
              </div>
            )}

            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>Son Ödeme / Ekstre Günü</p>
              <input type="number" min="1" max="31" placeholder="1" value={form.dueDay}
                onChange={e => set('dueDay', e.target.value)}
                className={`w-32 px-5 py-4 rounded-2xl border text-sm font-black text-center outline-none ${inputCls}`}/>
            </div>

            {/* live usage bar */}
            {debt > 0 && limit > 0 && (
              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-rose-500/5 border-rose-500/15' : 'bg-rose-50 border-rose-200'}`}>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-black text-rose-400">Limit Kullanımı</span>
                  <span className={`text-xs font-black ${usagePct > 80 ? 'text-rose-500' : 'text-emerald-500'}`}>%{usagePct.toFixed(1)}</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${usagePct}%`, backgroundColor: usagePct > 80 ? '#f43f5e' : '#6366f1' }}/>
                </div>
                <div className="flex justify-between mt-2">
                  <span className={`text-[10px] opacity-40 ${txt}`}>Borç: ₺{debt.toLocaleString('tr-TR')}</span>
                  <span className={`text-[10px] opacity-40 ${txt}`}>Kalan: ₺{Math.max(0, limit - debt).toLocaleString('tr-TR')}</span>
                </div>
              </div>
            )}

            <div className={`sticky bottom-0 pt-4 ${isDark ? 'bg-gradient-to-t from-[#0e0e0f] via-[#0e0e0f] to-transparent' : 'bg-gradient-to-t from-white via-white to-transparent'}`}>
              <button type="submit" className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white ${color.bg}`}>
                Kartı Ekle
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── AssetModal ────────────────────────────────────────────────────────── */
function AssetModal({ isDark, color, inputCls, onClose, onSubmit }) {
  const txt = isDark ? 'text-white' : 'text-slate-900';
  const [form, setForm] = useState(EMPTY_ASSET);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        className={`w-full max-w-md rounded-t-[2.25rem] sm:rounded-[3rem] border ${isDark ? 'bg-[#0e0e0f] border-white/10' : 'bg-white border-slate-200 shadow-2xl'}`}>
        <div className="max-h-[86dvh] sm:max-h-[92vh] overflow-y-auto p-6 sm:p-8 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          <div className="flex justify-between items-center mb-7">
            <h2 className={`text-2xl font-black ${txt}`}>Yeni Varlık Ekle</h2>
            <button onClick={onClose} className="opacity-40 hover:opacity-100"><X size={20} className={txt}/></button>
          </div>
          <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, balance: parseFloat(form.balance), isDebt: false }); }} className="space-y-4">
            <input type="text" placeholder="Hesap / Cüzdan adı" value={form.name}
              onChange={e => set('name', e.target.value)} required
              className={`w-full px-5 py-4 rounded-2xl border text-sm font-medium outline-none ${inputCls}`}/>
            <div className="flex gap-3">
              <input type="number" placeholder={form.iconType === 'GOLD' ? 'Gram miktarı' : 'Bakiye'} value={form.balance}
                onChange={e => set('balance', e.target.value)} required min="0" step="any"
                className={`flex-1 px-5 py-4 rounded-2xl border text-sm font-black outline-none ${inputCls}`}/>
              <div className="flex gap-1.5 flex-wrap">
                {CURRENCY_TYPES.map(c => (
                  <button key={c} type="button" onClick={() => set('iconType', c)}
                    className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${form.iconType === c ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                    {c === 'GOLD' ? 'gr' : c}
                  </button>
                ))}
              </div>
            </div>
            {form.iconType === 'GOLD' && <p className={`text-xs opacity-40 px-1 ${txt}`}>Gram cinsinden girin. TL karşılığı otomatik hesaplanır.</p>}
            <div className="flex gap-2 flex-wrap">
              {ASSET_TYPES.map(t => (
                <button key={t} type="button" onClick={() => set('type', t)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black border transition-all ${form.type === t ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className={`sticky bottom-0 pt-4 ${isDark ? 'bg-gradient-to-t from-[#0e0e0f] via-[#0e0e0f] to-transparent' : 'bg-gradient-to-t from-white via-white to-transparent'}`}>
              <button type="submit" className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white ${color.bg}`}>
                Ekle
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Assets page ──────────────────────────────────────────────────────── */
function Assets({ wallets = [], refreshData, isDark, color, liveRates, prefs }) {
  const [showAdd, setShowAdd] = useState(null); // null | 'asset' | 'cc' | 'loan'
  const cur = normalizeCurrencySymbol(prefs?.currency);

  const rates = liveRates || { USD: 33, EUR: 35, GOLD: 3185 };

  const toTL = (w) => {
    const v = parseFloat(w.balance || 0);
    if (w.iconType === 'USD') return v * rates.USD;
    if (w.iconType === 'EUR') return v * rates.EUR;
    if (w.iconType === 'GOLD') return v * rates.GOLD;
    return v;
  };

  const assets = wallets.filter(w => !w.isDebt);
  const debts = wallets.filter(w => w.isDebt);

  const totalAssets = assets.reduce((s, w) => s + toTL(w), 0);
  const totalDebts = debts.reduce((s, w) => s + toTL(w), 0);
  const netWorth = totalAssets - totalDebts;
  const totalAssetsDisplay = convertFromTRY(totalAssets, cur, liveRates);
  const totalDebtsDisplay = convertFromTRY(totalDebts, cur, liveRates);
  const netWorthDisplay = convertFromTRY(Math.abs(netWorth), cur, liveRates);

  // Total monthly debt obligations
  const monthlyDebtLoad = debts.reduce((s, w) => {
    if (w.type === 'Taksitli Kredi' && w.months && w.interestRate != null) {
      return s + calcPMT(parseFloat(w.balance), parseFloat(w.interestRate), parseInt(w.months));
    }
    return s;
  }, 0);
  const monthlyDebtLoadDisplay = convertFromTRY(monthlyDebtLoad, cur, liveRates);

  const handleAdd = (form) => {
    if (!form.name?.trim()) return;
    customDB.set('knapsack_w', [...wallets, form]);
    refreshData();
    setShowAdd(null);
  };

  const handleRemove = (idx) => {
    customDB.set('knapsack_w', wallets.filter((_, i) => i !== idx));
    refreshData();
  };

  const txt = isDark ? 'text-white' : 'text-slate-900';
  const cardBg = isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-xl';
  const inputCls = isDark
    ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500/40'
    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400';

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-[calc(env(safe-area-inset-bottom)+11rem)]">

      {/* HEADER */}
      <header className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-2 text-indigo-500 opacity-60">Knapsack</p>
        <h1 className={`text-5xl sm:text-6xl font-extrabold tracking-tight mb-8 ${txt}`}>Assets.</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200 shadow-xl'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Toplam Varlık</p>
            <p className="text-xl font-black text-emerald-500">+{cur}{totalAssetsDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-200 shadow-xl'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-2">Toplam Borç</p>
            <p className="text-xl font-black text-rose-500">-{cur}{totalDebtsDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className={`p-6 rounded-[2rem] border ${cardBg}`}>
            <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>Net Değer</p>
            <p className={`text-xl font-black ${netWorth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {netWorth >= 0 ? '+' : '-'}{cur}{netWorthDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-rose-500/5 border-rose-500/10' : 'bg-slate-50 border-slate-200 shadow-xl'}`}>
            <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>Aylık Taksit Yükü</p>
            <p className="text-xl font-black text-rose-400">{cur}{monthlyDebtLoadDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </header>

      {/* ASSETS */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${txt}`}>Varlıklar</h2>
            <p className={`text-[10px] uppercase tracking-widest opacity-30 font-black ${txt}`}>{assets.length} hesap</p>
          </div>
          <button onClick={() => setShowAdd('asset')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm text-white ${color.bg}`}>
            <Plus size={15}/> Ekle
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assets.map((w, i) => (
            <WalletCard key={i} wallet={w} globalIdx={wallets.indexOf(w)} isDark={isDark} color={color} liveRates={liveRates} onRemove={handleRemove}/>
          ))}
          {assets.length === 0 && (
            <button onClick={() => setShowAdd('asset')}
              className={`p-10 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 min-h-[180px] transition-all ${isDark ? 'border-white/10 hover:border-white/30 text-white/30 hover:text-white' : 'border-slate-200 hover:border-indigo-400 text-slate-300 hover:text-indigo-500'}`}>
              <Plus size={32} strokeWidth={2.5}/><span className="text-xs font-black uppercase tracking-widest">Varlık Ekle</span>
            </button>
          )}
        </div>
      </section>

      {/* DEBTS */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-rose-500">Borçlar & Krediler</h2>
            <p className={`text-[10px] uppercase tracking-widest opacity-30 font-black ${txt}`}>{debts.length} kayıt</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <button onClick={() => setShowAdd('cc')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs text-white bg-violet-500 hover:bg-violet-600 transition-colors whitespace-nowrap">
              <CreditCard size={14}/> Kart / KMH
            </button>
            <button onClick={() => setShowAdd('loan')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs text-white bg-rose-500 hover:bg-rose-600 transition-colors whitespace-nowrap">
              <Calculator size={14}/> Kredi / Taksit
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {debts.map((w, i) => (
            <WalletCard key={i} wallet={w} globalIdx={wallets.indexOf(w)} isDark={isDark} color={color} liveRates={liveRates} onRemove={handleRemove}/>
          ))}
          {debts.length === 0 && (
            <div className={`p-8 rounded-[2.5rem] border-2 border-dashed flex items-center justify-center gap-3 col-span-full ${isDark ? 'border-rose-500/20 text-rose-500/30' : 'border-rose-200 text-rose-300'}`}>
              <span className="text-xs font-black uppercase tracking-widest">Kredi kartı veya taksitli borcunu ekle</span>
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {showAdd === 'asset' && <AssetModal isDark={isDark} color={color} inputCls={inputCls} onClose={() => setShowAdd(null)} onSubmit={handleAdd}/>}
        {showAdd === 'cc' && <CreditCardModal isDark={isDark} color={color} inputCls={inputCls} onClose={() => setShowAdd(null)} onSubmit={handleAdd}/>}
        {showAdd === 'loan' && <LoanCalcModal isDark={isDark} inputCls={inputCls} onClose={() => setShowAdd(null)} onSubmit={handleAdd}/>}
      </AnimatePresence>
    </motion.div>
  );
}

export default Assets;
