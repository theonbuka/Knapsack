import { useState, useEffect, useCallback, useRef } from 'react';
import { customDB, DEFAULT_CATS } from '../utils/constants';

const FALLBACK_RATES = { USD: 33.20, EUR: 35.90, GOLD: 3185 };

export function useFinance() {
  const [data, setData] = useState(() => {
    try {
      // Initialize data synchronously on first render
      const wallets = customDB.get('knapsack_w', []);
      const trans = customDB.get('knapsack_t', []);
      const expenses = customDB.get('knapsack_exp', []);
      const prefs = customDB.get('knapsack_p', { currency: '₺', themeColor: 'indigo', savingsGoal: 0 });
      const cats = customDB.get('knapsack_cats', DEFAULT_CATS);
      return { trans, wallets, cats, expenses, prefs };
    } catch (err) {
      console.error('useFinance initialization error:', err);
      return { trans: [], wallets: [], cats: DEFAULT_CATS, expenses: [], prefs: { currency: '₺', themeColor: 'indigo', savingsGoal: 0 } };
    }
  });
  const [liveRates, setLiveRates] = useState(FALLBACK_RATES);
  const [loading, setLoading] = useState(false); // Start as false since data is already loaded
  const ratesRef = useRef(FALLBACK_RATES);

  const refresh = useCallback(() => {
    const wallets = customDB.get('knapsack_w', []);
    const trans = customDB.get('knapsack_t', []);
    const expenses = customDB.get('knapsack_exp', []);
    const prefs = customDB.get('knapsack_p', { currency: '₺', themeColor: 'indigo', savingsGoal: 0 });
    const cats = customDB.get('knapsack_cats', DEFAULT_CATS);
    setData({ trans, wallets, cats, expenses, prefs });
    setLoading(false);
  }, []);

  useEffect(() => {
    // Only fetch exchange rates on mount
    fetch('https://open.er-api.com/v6/latest/TRY')
      .then(r => r.json())
      .then(api => {
        if (api.rates) {
          const updated = { ...ratesRef.current, USD: 1 / api.rates.USD, EUR: 1 / api.rates.EUR };
          ratesRef.current = updated;
          setLiveRates(updated);
        }
      })
      .catch(() => {});
  }, []);

  const addTransaction = useCallback((form) => {
    // Basic validation
    if (!form.amount || parseFloat(form.amount) <= 0) {
      throw new Error('Geçerli bir miktar giriniz');
    }
    if (!form.title || form.title.trim().length === 0) {
      throw new Error('İşlem başlığı gerekli');
    }
    if (!form.categoryId) {
      throw new Error('Kategori seçimi gerekli');
    }

    const rates = ratesRef.current;
    let tlAmt = parseFloat(form.amount || 0);
    if (form.currency === 'USD') tlAmt *= rates.USD;
    if (form.currency === 'EUR') tlAmt *= rates.EUR;
    const newTx = {
      ...form,
      id: Date.now().toString(),
      amount: tlAmt,
      created: new Date().toISOString(),
    };
    const prev = customDB.get('knapsack_t', []);
    customDB.set('knapsack_t', [newTx, ...prev]);
    refresh();
    return true;
  }, [refresh]);

  const addExpense = useCallback((expense) => {
    const prev = customDB.get('knapsack_exp', []);
    const item = { ...expense, id: Date.now().toString(), paidMonths: [] };
    customDB.set('knapsack_exp', [...prev, item]);
    refresh();
  }, [refresh]);

  const removeExpense = useCallback((id) => {
    const prev = customDB.get('knapsack_exp', []);
    customDB.set('knapsack_exp', prev.filter(e => e.id !== id));
    refresh();
  }, [refresh]);

  const toggleExpensePaid = useCallback((id) => {
    const key = new Date().toISOString().slice(0, 7);
    const prev = customDB.get('knapsack_exp', []);
    const updated = prev.map(e => {
      if (e.id !== id) return e;
      const paid = e.paidMonths || [];
      const next = paid.includes(key) ? paid.filter(m => m !== key) : [...paid, key];
      return { ...e, paidMonths: next };
    });
    customDB.set('knapsack_exp', updated);
    refresh();
  }, [refresh]);

  const savePrefs = useCallback((prefs) => {
    customDB.set('knapsack_p', prefs);
    refresh();
  }, [refresh]);

  const saveCats = useCallback((cats) => {
    customDB.set('knapsack_cats', cats);
    refresh();
  }, [refresh]);

  const updateTransaction = useCallback((id, patch) => {
    const prev = customDB.get('knapsack_t', []);
    const rates = ratesRef.current;
    let tlAmt = parseFloat(patch.amount || 0);
    if (patch.currency === 'USD') tlAmt *= rates.USD;
    if (patch.currency === 'EUR') tlAmt *= rates.EUR;
    customDB.set('knapsack_t', prev.map(t => t.id === id ? { ...t, ...patch, amount: tlAmt } : t));
    refresh();
  }, [refresh]);

  const updateExpense = useCallback((id, patch) => {
    const prev = customDB.get('knapsack_exp', []);
    customDB.set('knapsack_exp', prev.map(e => e.id === id ? { ...e, ...patch } : e));
    refresh();
  }, [refresh]);

  return {
    data, liveRates,
    addTransaction, updateTransaction, addExpense, removeExpense,
    toggleExpensePaid, updateExpense,
    savePrefs, saveCats, refresh, loading,
  };
}
