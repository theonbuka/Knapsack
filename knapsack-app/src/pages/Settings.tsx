import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, Palette, DollarSign, Shield, LogOut, User, Tags, Plus, X, Check, Target, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { themeColors, customDB, PRESET_EMOJIS, PRESET_COLORS } from '../utils/constants';
import { useAuth } from '../contexts/AuthContext';
import { clearLocalSyncStamp, getAllScopedDataKeys, getAuthStorageId } from '../utils/accountStorage';
import { deleteCloudSnapshot, isCloudSyncConfigured } from '../utils/cloudSync';

const CURRENCIES = ['₺', '$', '€'];

function EmojiPicker({ value, onChange, isDark }) {
  return (
    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
      {PRESET_EMOJIS.map(em => (
        <button key={em} type="button" onClick={() => onChange(em)}
          className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${value === em ? 'bg-indigo-600 ring-2 ring-indigo-400' : isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}>
          {em}
        </button>
      ))}
    </div>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESET_COLORS.map(c => (
        <button key={c} type="button" onClick={() => onChange(c)}
          className={`w-8 h-8 rounded-full transition-all ${value === c ? 'ring-2 ring-offset-2 ring-offset-transparent scale-110' : 'opacity-70 hover:opacity-100'}`}
          style={{ backgroundColor: c, '--tw-ring-color': c }}/>
      ))}
    </div>
  );
}

function CategoryEditor({ cats, saveCats, isDark, color }) {
  const [editId, setEditId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', emoji: '📌', color: '#6366f1', limit: 0 });
  const [editData, setEditData] = useState({});

  const txt = isDark ? 'text-white' : 'text-slate-900';
  const inputCls = isDark
    ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500/40'
    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400';

  const startEdit = (cat) => {
    setEditId(cat.id);
    setEditData({ name: cat.name, emoji: cat.emoji || '📌', color: cat.color, limit: cat.limit || 0 });
  };

  const saveEdit = (id) => {
    const updated = cats.map(c => c.id === id ? { ...c, ...editData } : c);
    saveCats(updated);
    setEditId(null);
  };

  const deletecat = (id) => {
    saveCats(cats.filter(c => c.id !== id));
  };

  const addCat = () => {
    if (!newCat.name.trim()) return;
    const id = `cu${ Date.now()}`;
    saveCats([...cats, { ...newCat, id, limit: parseInt(newCat.limit) || 0 }]);
    setNewCat({ name: '', emoji: '📌', color: '#6366f1', limit: 0 });
    setShowNew(false);
  };

  return (
    <div className="space-y-3">
      {cats.map(cat => (
        <div key={cat.id}>
          {editId === cat.id ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`p-5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} space-y-3`}>
              <div className="flex gap-3">
                <input type="text" value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                  className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium outline-none ${inputCls}`}/>
                <input type="number" value={editData.limit} placeholder="Bütçe limiti"
                  onChange={e => setEditData(p => ({ ...p, limit: e.target.value }))}
                  className={`w-28 px-3 py-2.5 rounded-xl border text-sm outline-none ${inputCls}`}/>
              </div>
              <p className={`text-[10px] font-black uppercase tracking-widest opacity-30 ${txt}`}>Emoji</p>
              <EmojiPicker value={editData.emoji} onChange={v => setEditData(p => ({ ...p, emoji: v }))} isDark={isDark}/>
              <p className={`text-[10px] font-black uppercase tracking-widest opacity-30 ${txt}`}>Renk</p>
              <ColorPicker value={editData.color} onChange={v => setEditData(p => ({ ...p, color: v }))}/>
              <div className="flex gap-2 pt-1">
                <button onClick={() => saveEdit(cat.id)}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs text-white ${color.bg}`}>
                  <Check size={14} className="inline mr-1"/>Kaydet
                </button>
                <button onClick={() => setEditId(null)}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs border ${isDark ? 'border-white/10 text-white/60' : 'border-slate-200 text-slate-500'}`}>
                  İptal
                </button>
              </div>
            </motion.div>
          ) : (
            <div className={`flex items-center gap-3 p-3 rounded-2xl group ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'} transition-colors`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: `${cat.color}20` }}>{cat.emoji || '📌'}</div>
              <div className="flex-1 min-w-0">
                <p className={`font-black text-sm truncate ${txt}`}>{cat.name}</p>
                {cat.limit > 0 && <p className={`text-[10px] opacity-30 ${txt}`}>Limit: ₺{cat.limit.toLocaleString()}</p>}
              </div>
              <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(cat)}
                  className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                  <Edit3 size={13}/>
                </button>
                <button onClick={() => deletecat(cat.id)}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 transition-colors">
                  <Trash2 size={13}/>
                </button>
              </div>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }}/>
            </div>
          )}
        </div>
      ))}

      {/* ADD NEW */}
      <AnimatePresence>
        {showNew ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className={`p-5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} space-y-3 overflow-hidden`}>
            <div className="flex gap-3">
              <input type="text" value={newCat.name} placeholder="Kategori adı" onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
                className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium outline-none ${inputCls}`}/>
              <input type="number" value={newCat.limit} placeholder="Limit"
                onChange={e => setNewCat(p => ({ ...p, limit: e.target.value }))}
                className={`w-28 px-3 py-2.5 rounded-xl border text-sm outline-none ${inputCls}`}/>
            </div>
            <p className={`text-[10px] font-black uppercase tracking-widest opacity-30 ${txt}`}>Emoji</p>
            <EmojiPicker value={newCat.emoji} onChange={v => setNewCat(p => ({ ...p, emoji: v }))} isDark={isDark}/>
            <p className={`text-[10px] font-black uppercase tracking-widest opacity-30 ${txt}`}>Renk</p>
            <ColorPicker value={newCat.color} onChange={v => setNewCat(p => ({ ...p, color: v }))}/>
            <div className="flex gap-2 pt-1">
              <button onClick={addCat}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs text-white ${color.bg}`}>
                Ekle
              </button>
              <button onClick={() => setShowNew(false)}
                className={`px-5 py-2.5 rounded-xl font-black text-xs border ${isDark ? 'border-white/10 text-white/60' : 'border-slate-200 text-slate-500'}`}>
                İptal
              </button>
            </div>
          </motion.div>
        ) : (
          <button onClick={() => setShowNew(true)}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed text-xs font-black uppercase tracking-widest transition-all ${isDark ? 'border-white/10 text-white/30 hover:border-white/30 hover:text-white/60' : 'border-slate-200 text-slate-400 hover:border-indigo-400 hover:text-indigo-500'}`}>
            <Plus size={14}/> Yeni Kategori
          </button>
        )}
      </AnimatePresence>
    </div>
  );
}

function Settings({ isDark, color, prefs, savePrefs, cats = [], saveCats }) {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const fullName = `${auth?.name || ''} ${auth?.surname || ''}`.trim() || 'Kullanıcı';
  const cloudSyncEnabled = isCloudSyncConfigured();
  const accountTypeText = auth?.googleId
    ? `Google hesabı · ${cloudSyncEnabled ? 'bulut senkron aktif' : 'veriler bu cihazda'}`
    : `Yerel hesap · ${cloudSyncEnabled ? 'bulut senkron aktif' : 'veriler bu cihazda'}`;

  const txt = isDark ? 'text-white' : 'text-slate-900';
  const cardBg = isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200 shadow-xl';

  const handleLogout = () => {
    logout();
    navigate('/landing');
  };

  const handleExport = () => {
    const exportData = {
      wallets:      customDB.get('knapsack_w', []),
      transactions: customDB.get('knapsack_t', []),
      expenses:     customDB.get('knapsack_exp', []),
      cats:         customDB.get('knapsack_cats', []),
      prefs:        customDB.get('knapsack_p', {}),
      exportedAt:   new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `knapsack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleClearData = async () => {
    const storageId = getAuthStorageId(auth);
    const scopedKeys = getAllScopedDataKeys(storageId);
    scopedKeys.forEach(k => localStorage.removeItem(k));
    clearLocalSyncStamp(storageId);

    // Clean any leftover legacy global finance keys.
    ['knapsack_w', 'knapsack_t', 'knapsack_p', 'knapsack_exp', 'knapsack_cats'].forEach(k => localStorage.removeItem(k));

    try {
      await deleteCloudSnapshot(storageId);
    } catch (err) {
      console.error('Cloud account cleanup failed:', err);
    }

    logout(true);
    navigate('/landing');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto px-4 sm:px-6 pt-20 pb-[calc(env(safe-area-inset-bottom)+11rem)]">

      <header className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-2 text-indigo-500 opacity-60">Knapsack</p>
        <h1 className={`text-5xl sm:text-6xl font-extrabold tracking-tight mb-1 ${txt}`}>Settings.</h1>
        <p className={`text-[10px] font-semibold uppercase tracking-widest ${isDark ? 'text-white/38' : 'text-black/38'}`}>Tercihler</p>
      </header>

      {/* ACCOUNT */}
      <section className={`p-8 rounded-[2.5rem] border mb-6 ${cardBg}`}>
        <div className="flex items-center gap-3 mb-6">
          <User size={18} className="text-indigo-500"/>
          <h2 className={`text-base font-black ${txt}`}>Hesap</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-black text-base ${txt}`}>{fullName}</p>
            {auth?.email && <p className={`text-xs opacity-55 ${txt}`}>{auth.email}</p>}
            <p className={`text-xs opacity-40 ${txt}`}>{accountTypeText}</p>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-all text-sm font-black">
            <LogOut size={14}/> Çıkış
          </button>
        </div>
      </section>

      {/* SAVINGS GOAL — yeni özellik */}
      <section className={`p-8 rounded-[2.5rem] border mb-6 ${cardBg}`}>
        <div className="flex items-center gap-3 mb-6">
          <Target size={18} className="text-indigo-500"/>
          <h2 className={`text-base font-black ${txt}`}>Aylık Tasarruf Hedefi</h2>
        </div>
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <span className={`text-sm font-black opacity-40 ${txt}`}>₺</span>
          <input
            type="number" min="0" step="100"
            value={prefs?.savingsGoal || 0}
            onChange={e => savePrefs({ ...prefs, savingsGoal: parseFloat(e.target.value) || 0 })}
            className={`flex-1 bg-transparent text-xl font-black outline-none ${txt}`}
            placeholder="0"
          />
        </div>
        <p className={`text-xs opacity-30 mt-2 ${txt}`}>Ana sayfada ilerleme çubuğu olarak gösterilir.</p>
      </section>

      {/* THEME COLOR */}
      <section className={`p-8 rounded-[2.5rem] border mb-6 ${cardBg}`}>
        <div className="flex items-center gap-3 mb-6">
          <Palette size={18} className="text-indigo-500"/>
          <h2 className={`text-base font-black ${txt}`}>Tema Rengi</h2>
        </div>
        <div className="flex gap-3 flex-wrap">
          {Object.entries(themeColors).map(([key, val]) => (
            <button key={key} onClick={() => savePrefs({ ...prefs, themeColor: key })}
              className={`w-12 h-12 rounded-2xl ${val.bg} transition-all ${prefs?.themeColor === key ? 'ring-4 ring-offset-2 ring-offset-transparent scale-110' : 'opacity-50 hover:opacity-90'}`}
              style={{ '--tw-ring-color': val.hex }}/>
          ))}
        </div>
      </section>

      {/* CURRENCY */}
      <section className={`p-8 rounded-[2.5rem] border mb-6 ${cardBg}`}>
        <div className="flex items-center gap-3 mb-6">
          <DollarSign size={18} className="text-indigo-500"/>
          <h2 className={`text-base font-black ${txt}`}>Para Birimi Sembolü</h2>
        </div>
        <div className="flex gap-3">
          {CURRENCIES.map(c => (
            <button key={c} onClick={() => savePrefs({ ...prefs, currency: c })}
              className={`flex-1 py-3.5 rounded-2xl text-base font-black border transition-all ${prefs?.currency === c ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* CATEGORY MANAGEMENT */}
      <section className={`p-8 rounded-[2.5rem] border mb-6 ${cardBg}`}>
        <div className="flex items-center gap-3 mb-6">
          <Tags size={18} className="text-indigo-500"/>
          <h2 className={`text-base font-black ${txt}`}>Kategoriler</h2>
          <span className={`text-[10px] font-black opacity-30 ${txt}`}>{cats.length} adet</span>
        </div>
        <CategoryEditor cats={cats} saveCats={saveCats} isDark={isDark} color={color}/>
      </section>

      {/* DATA MANAGEMENT */}
      <section className={`p-8 rounded-[2.5rem] border mb-6 ${cardBg}`}>
        <div className="flex items-center gap-3 mb-6">
          <Shield size={18} className="text-indigo-500"/>
          <h2 className={`text-base font-black ${txt}`}>Veri Yönetimi</h2>
        </div>
        <div className="space-y-3">
          <button onClick={handleExport}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${isDark ? 'border-white/10 hover:border-white/30 text-white' : 'border-slate-200 hover:border-indigo-400 text-slate-700'}`}>
            <Download size={18} className="text-indigo-500 flex-shrink-0"/>
            <div className="text-left">
              <p className="font-black text-sm">Dışa Aktar (JSON)</p>
              <p className={`text-xs opacity-40 ${txt}`}>Tüm veriyi yedekle</p>
            </div>
          </button>

          {!showConfirm ? (
            <button onClick={() => setShowConfirm(true)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-rose-500/20 hover:border-rose-500/50 transition-all text-rose-500">
              <Trash2 size={18} className="flex-shrink-0"/>
              <div className="text-left">
                <p className="font-black text-sm">Tüm Verileri Sil</p>
                <p className="text-xs opacity-60">Geri alınamaz</p>
              </div>
            </button>
          ) : (
            <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5">
              <p className="text-sm font-black text-rose-500 mb-3">Emin misin? Tüm veriler silinecek.</p>
              <div className="flex gap-3">
                <button onClick={handleClearData} className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-black text-sm">Evet, Sil</button>
                <button onClick={() => setShowConfirm(false)} className={`flex-1 py-3 rounded-xl border font-black text-sm ${isDark ? 'border-white/10 text-white' : 'border-slate-200 text-slate-600'}`}>İptal</button>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className={`text-center opacity-20 text-xs font-black uppercase tracking-widest ${txt}`}>
        Knapsack v2.0 — Local First · Zero Server
      </div>
    </motion.div>
  );
}

export default Settings;
