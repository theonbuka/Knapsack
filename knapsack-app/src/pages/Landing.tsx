import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Lock, User, Mail, ArrowRight, Zap, Shield, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { customDB } from '../utils/constants';
import { useAuth } from '../contexts/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const FEATURES = [
  { icon: <TrendingUp size={20}/>, title: 'Canlı Kurlar', desc: 'USD, EUR ve Altın anlık takip' },
  { icon: <Shield size={20}/>, title: 'Yerel Depolama', desc: 'Verileriniz sadece cihazınızda' },
  { icon: <Zap size={20}/>, title: 'Akıllı Analiz', desc: 'Harcama tahmin motoru' },
];

interface GoogleJwtPayload {
  name?: string;
  given_name?: string;
  email?: string;
  picture?: string;
  sub?: string;
}

function decodeGoogleJwtPayload(credential: string): GoogleJwtPayload | null {
  try {
    const [, payloadPart] = credential.split('.');
    if (!payloadPart) return null;

    // JWT payload is base64url encoded; normalize before decoding.
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const binary = window.atob(padded);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);

    return JSON.parse(json) as GoogleJwtPayload;
  } catch {
    return null;
  }
}

export default function Landing() {
  const navigate = useNavigate();
  const { auth, login, register, loginWithGoogle, isAuthenticated, error: authError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [googleReady, setGoogleReady] = useState(false);

  const error = localError || authError || '';

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initializeGoogle = () => {
      window.google?.accounts?.id?.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => {
          if (!response?.credential) {
            setLocalError('Google ile giriş başarısız.');
            return;
          }

          const payload = decodeGoogleJwtPayload(response.credential);
          if (!payload?.sub) {
            setLocalError('Google ile giriş başarısız.');
            return;
          }

          setLocalError('');
          loginWithGoogle({
            name: payload.given_name || payload.name || payload.email || 'Google Kullanıcısı',
            googleId: payload.sub,
            email: payload.email,
            picture: payload.picture,
          });
          navigate('/');
        },
      });

      setGoogleReady(Boolean(window.google?.accounts?.id));
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    const existingScript = document.getElementById('google-gsi-client') as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', initializeGoogle);
      return () => {
        existingScript.removeEventListener('load', initializeGoogle);
      };
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    script.onerror = () => {
      setGoogleReady(false);
      setLocalError('Google servisine ulaşılamadı. Lütfen daha sonra tekrar deneyin.');
    };

    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', initializeGoogle);
    };
  }, [loginWithGoogle, navigate]);

  const handleGoogleSignIn = () => {
    if (!GOOGLE_CLIENT_ID) {
      setLocalError('Google Sign-In için VITE_GOOGLE_CLIENT_ID ortam değişkeni gerekli.');
      return;
    }

    if (!googleReady || !window.google?.accounts?.id) {
      setLocalError('Google giriş servisi henüz hazır değil.');
      return;
    }

    setLocalError('');
    window.google.accounts.id.prompt((notification: {
      isNotDisplayed: () => boolean;
      isSkippedMoment: () => boolean;
    }) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setLocalError('Google giriş penceresi açılamadı. Tarayıcı izinlerini kontrol edin.');
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError('');
    setInfoMessage('');

    if (mode === 'register') {
      const result = await register(name, surname, email, password);
      if (result.success) {
        navigate('/');
        return;
      }

      if (result.requiresVerification) {
        setMode('login');
        setPassword('');
        setInfoMessage(result.message || 'Aktivasyon emaili gönderildi. Mail kutunu kontrol et.');
        return;
      }

      if (!authError) {
        setLocalError(result.message || 'Kayıt işlemi başarısız.');
      }
    } else {
      const success = await login(email, password);
      if (success) {
        navigate('/');
        return;
      }

      if (!authError) {
        setLocalError('Giriş işlemi başarısız.');
      }
    }
  };

  const handleDemo = async () => {
    setLocalError('');
    setInfoMessage('');

    const result = await register('Demo', 'Kullanıcı', 'demo@knapsack.local', '123456');
    if (!result.success) {
      if (!authError) {
        setLocalError(result.message || 'Demo hesabı oluşturulamadı.');
      }
      return;
    }

    customDB.set('knapsack_w', [
      { name: 'Vadesiz Hesap', balance: 24500, type: 'Banka', iconType: '₺' },
      { name: 'Nakit', balance: 3200, type: 'Nakit', iconType: '₺' },
      { name: 'Dolar Hesabı', balance: 350, type: 'Dijital', iconType: 'USD' },
    ]);
    customDB.set('knapsack_t', [
      { id: '1', type: 'expense', amount: 420, title: 'Market', categoryId: 'c1', currency: '₺', created: new Date(Date.now()-1*86400000).toISOString() },
      { id: '2', type: 'expense', amount: 180, title: 'Akşam yemeği',categoryId: 'c2', currency: '₺', created: new Date(Date.now()-2*86400000).toISOString() },
      { id: '3', type: 'income', amount: 32000,title: 'Maaş', categoryId: 'c7', currency: '₺', created: new Date(Date.now()-3*86400000).toISOString() },
      { id: '4', type: 'expense', amount: 250, title: 'Taksi', categoryId: 'c3', currency: '₺', created: new Date(Date.now()-4*86400000).toISOString() },
    ]);
    customDB.set('knapsack_exp', [
      { id: 'e1', type: 'rent', name: 'Kira', amount: 12000, currency: '₺', dueDay: 1, paidMonths: [] },
      { id: 'e2', type: 'bill', name: 'Elektrik', amount: 450, currency: '₺', dueDay: 10, paidMonths: [] },
      { id: 'e3', type: 'subscription', name: 'Netflix', amount: 199, currency: '₺', dueDay: 15, paidMonths: [] },
      { id: 'e4', type: 'subscription', name: 'Spotify', amount: 79, currency: '₺', dueDay: 20, paidMonths: [] },
    ]);
    navigate('/');
  };

  const hasAccount = Boolean(auth?.email || auth?.googleId || auth?.name);

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden antialiased">

      {/* LEFT — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div animate={{ x:[0,80,0], y:[0,40,0] }} transition={{ duration:18, repeat:Infinity }}
            className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full blur-[160px] bg-indigo-600/20"/>
          <motion.div animate={{ x:[0,-60,0], y:[0,80,0] }} transition={{ duration:14, repeat:Infinity, delay:2 }}
            className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-full blur-[120px] bg-violet-600/15"/>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/20">
              <Wallet size={20} className="text-indigo-400"/>
            </div>
            <span className="text-xs font-black uppercase tracking-[0.4em] text-indigo-400">Knapsack</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-[5.5rem] font-black tracking-[-0.06em] leading-[0.85] mb-6">
              Paranı<br/>Kontrol<br/>Et.
            </h1>
            <p className="text-white/40 text-lg font-medium leading-relaxed max-w-xs">
              Varlıklarını, harcamalarını ve sabit giderlerini tek bir yerde yönet.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map(f => (
              <div key={f.title} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">{f.icon}</div>
                <div>
                  <p className="text-sm font-black">{f.title}</p>
                  <p className="text-xs text-white/40">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs font-black uppercase tracking-widest relative z-10">
          Knapsack v1.0 — Local First
        </p>
      </div>

      {/* RIGHT — Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <Wallet size={28} className="text-indigo-400"/>
            <span className="text-2xl font-black tracking-tighter">Knapsack.</span>
          </div>

          <div className="mb-8">
            <h2 className="text-4xl font-black tracking-tighter mb-2">
              {mode === 'login' ? 'Hoş geldin.' : 'Hesap oluştur.'}
            </h2>
            <p className="text-white/40 text-sm">
              {mode === 'login' ? 'Mail ve şifrenle giriş yap.' : 'İsim, soyisim, mail ve şifreni gir.'}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex gap-1 p-1 rounded-2xl bg-white/5 border border-white/5 mb-8">
            {[['login','Giriş Yap'], ['register','Kayıt Ol']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m as 'login' | 'register'); setLocalError(''); setInfoMessage(''); }}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode===m ? 'bg-indigo-600 text-white' : 'text-white/30 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
                  <div className="space-y-4 overflow-hidden">
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"/>
                      <input type="text" placeholder="İsim" value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm font-medium outline-none focus:border-indigo-500/50 transition-all"/>
                    </div>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"/>
                      <input type="text" placeholder="Soyisim" value={surname}
                        onChange={e => setSurname(e.target.value)}
                        className="w-full pl-10 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm font-medium outline-none focus:border-indigo-500/50 transition-all"/>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"/>
              <input
                type="email"
                placeholder="Email" value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm font-medium outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"/>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Şifre" value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm font-medium outline-none focus:border-indigo-500/50 transition-all"
              />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  className="text-rose-400 text-xs font-black">
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {infoMessage && (
                <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  className="text-emerald-300 text-xs font-black">
                  {infoMessage}
                </motion.p>
              )}
            </AnimatePresence>

            <button type="submit"
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2">
              {mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
              <ArrowRight size={16}/>
            </button>
          </form>

          <div className="relative flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10"/>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">veya</span>
            <div className="flex-1 h-px bg-white/10"/>
          </div>

          <button onClick={handleGoogleSignIn}
            className="w-full py-4 rounded-2xl border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-black text-sm tracking-widest transition-all flex items-center justify-center gap-3 mb-3">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Google ile Giriş Yap
          </button>

          <button onClick={handleDemo}
            className="w-full py-4 rounded-2xl border border-white/10 hover:border-white/20 text-white/60 hover:text-white font-black text-sm uppercase tracking-widest transition-all">
            Demo ile Dene
          </button>

          {mode === 'login' && !hasAccount && (
            <p className="text-center text-xs text-white/20 mt-4">
              Hesabın yok mu?{' '}
              <button onClick={() => setMode('register')} className="text-indigo-400 hover:text-indigo-300">
                Kayıt ol
              </button>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
