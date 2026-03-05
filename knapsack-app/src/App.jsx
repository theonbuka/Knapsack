import React, { useState, useLayoutEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, CreditCard, List, Settings as SetIcon, Plus, Sun, Moon } from 'lucide-react';
import { useFinance } from './hooks/useFinance';
import { themeColors } from './utils/constants';

// Sayfa Importları
import Home from './pages/Home';
import Assets from './pages/Assets';
import Transactions from './pages/Transactions';

function App() {
  const loc = useLocation();
  const { data, loading, liveRates } = useFinance();
  
  // Tema Kontrolü
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('knapsack_theme');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Renk Kontrolü
  const activeColor = themeColors[data?.prefs?.themeColor] || themeColors.indigo;

  useLayoutEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.backgroundColor = '#000000';
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#F8F9FA';
    }
    localStorage.setItem('knapsack_theme', JSON.stringify(isDark));
  }, [isDark]);

  // BEYAZ EKRAN KORUMASI: Veri yüklenene kadar boş dönme, iskelet göster
  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center font-black text-white/20 italic tracking-widest">
      KNAPSACK.
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'dark bg-black text-white' : 'bg-[#F8F9FA] text-slate-900'}`}>
      
      {/* Üst Nav - Tema Değiştirici */}
      <div className="fixed top-8 right-8 z-[200]">
        <button 
          onClick={() => setIsDark(!isDark)}
          className={`p-4 rounded-3xl border backdrop-blur-xl transition-all ${isDark ? 'bg-white/5 border-white/10 text-yellow-400' : 'bg-white border-slate-200 text-indigo-600 shadow-xl'}`}
        >
          {isDark ? <Sun size={20}/> : <Moon size={20}/>}
        </button>
      </div>

      {/* Sayfa Yönlendirmeleri */}
      <Routes>
        <Route path="/" element={<Home {...data} isDark={isDark} color={activeColor} liveRates={liveRates} />} />
        <Route path="/assets" element={<Assets wallets={data.wallets || []} isDark={isDark} color={activeColor} liveRates={liveRates} />} />
        <Route path="/transactions" element={<Transactions transactions={data.trans || []} isDark={isDark} color={activeColor} />} />
      </Routes>

      {/* DOCK NAV - APPLE STYLE */}
      <div className="fixed bottom-10 left-0 right-0 flex justify-center z-[150] px-4">
        <div className={`flex items-center gap-2 p-3 rounded-[2.8rem] border backdrop-blur-3xl shadow-2xl transition-all ${isDark ? 'bg-black/80 border-white/10' : 'bg-white/90 border-slate-200'}`}>
          
          <Link to="/">
            <div className={`p-4 rounded-[1.6rem] transition-all duration-300 ${loc.pathname === '/' ? activeColor.bg + ' text-white scale-110 shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>
              <HomeIcon size={22} strokeWidth={loc.pathname === '/' ? 2.5 : 2}/>
            </div>
          </Link>

          <Link to="/assets">
            <div className={`p-4 rounded-[1.6rem] transition-all duration-300 ${loc.pathname === '/assets' ? activeColor.bg + ' text-white scale-110 shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>
              <CreditCard size={22} strokeWidth={loc.pathname === '/assets' ? 2.5 : 2}/>
            </div>
          </Link>

          <div className="mx-2 w-[1px] h-8 bg-white/10" />

          <Link to="/transactions">
            <div className={`p-4 rounded-[1.6rem] transition-all duration-300 ${loc.pathname === '/transactions' ? activeColor.bg + ' text-white scale-110 shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>
              <List size={22} strokeWidth={loc.pathname === '/transactions' ? 2.5 : 2}/>
            </div>
          </Link>

          <div className={`p-4 rounded-[1.6rem] text-slate-500 hover:bg-white/5 transition-all`}>
            <SetIcon size={22}/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;