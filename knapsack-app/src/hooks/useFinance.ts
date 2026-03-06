import { useState, useEffect, useCallback, useRef } from 'react';
import { customDB, DEFAULT_CATS } from '../utils/constants';
import {
  getActiveUserStorageId,
  getLocalSyncStamp,
  setLocalSyncStamp,
} from '../utils/accountStorage';
import {
  isCloudSyncConfigured,
  pullCloudSnapshot,
  pushCloudSnapshot,
  type FinanceSnapshot,
} from '../utils/cloudSync';

const FALLBACK_RATES = { USD: 33.20, EUR: 35.90, GOLD: 3185 };
const DEFAULT_PREFS = { currency: '₺', themeColor: 'indigo', savingsGoal: 0 };
const CLOUD_PUSH_DEBOUNCE_MS = 1200;

function readLocalFinanceData() {
  const wallets = customDB.get('knapsack_w', []);
  const trans = customDB.get('knapsack_t', []);
  const expenses = customDB.get('knapsack_exp', []);
  const prefs = customDB.get('knapsack_p', DEFAULT_PREFS);
  const cats = customDB.get('knapsack_cats', DEFAULT_CATS);
  return { trans, wallets, cats, expenses, prefs };
}

function hasSnapshotContent(snapshot: FinanceSnapshot | null): boolean {
  if (!snapshot) return false;

  return (
    (Array.isArray(snapshot.wallets) && snapshot.wallets.length > 0) ||
    (Array.isArray(snapshot.trans) && snapshot.trans.length > 0) ||
    (Array.isArray(snapshot.expenses) && snapshot.expenses.length > 0) ||
    (Array.isArray(snapshot.cats) && snapshot.cats.length > 0)
  );
}

export function useFinance() {
  const [data, setData] = useState(() => {
    try {
      // Initialize data synchronously on first render
      return readLocalFinanceData();
    } catch (err) {
      console.error('useFinance initialization error:', err);
      return { trans: [], wallets: [], cats: DEFAULT_CATS, expenses: [], prefs: DEFAULT_PREFS };
    }
  });
  const [liveRates, setLiveRates] = useState(FALLBACK_RATES);
  const [loading, setLoading] = useState(false); // Start as false since data is already loaded
  const ratesRef = useRef(FALLBACK_RATES);
  const applyingCloudRef = useRef(false);
  const pushTimerRef = useRef<number | null>(null);
  const activeAccountRef = useRef('');

  const refresh = useCallback(() => {
    setData(readLocalFinanceData());
    setLoading(false);
  }, []);

  const buildLocalSnapshot = useCallback((updatedAt?: number): FinanceSnapshot => {
    const local = readLocalFinanceData();
    return {
      wallets: Array.isArray(local.wallets) ? local.wallets : [],
      trans: Array.isArray(local.trans) ? local.trans : [],
      expenses: Array.isArray(local.expenses) ? local.expenses : [],
      prefs: local.prefs && typeof local.prefs === 'object' ? local.prefs : DEFAULT_PREFS,
      cats: Array.isArray(local.cats) ? local.cats : [],
      updatedAt: updatedAt || Date.now(),
    };
  }, []);

  const queueCloudPush = useCallback((accountId: string, stamp?: number) => {
    if (!accountId || !isCloudSyncConfigured() || applyingCloudRef.current) {
      return;
    }

    if (pushTimerRef.current) {
      window.clearTimeout(pushTimerRef.current);
    }

    pushTimerRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          if (applyingCloudRef.current) {
            return;
          }

          const currentAccountId = getActiveUserStorageId();
          if (!currentAccountId || currentAccountId !== accountId) {
            return;
          }

          const syncStamp = stamp || getLocalSyncStamp(currentAccountId) || Date.now();
          const snapshot = buildLocalSnapshot(syncStamp);

          if (!hasSnapshotContent(snapshot)) {
            return;
          }

          await pushCloudSnapshot(currentAccountId, snapshot);
        } catch (err) {
          console.error('Cloud push sync failed:', err);
        }
      })();
    }, CLOUD_PUSH_DEBOUNCE_MS);
  }, [buildLocalSnapshot]);

  const markLocalChange = useCallback(() => {
    const accountId = getActiveUserStorageId();
    if (!accountId || applyingCloudRef.current) {
      return;
    }

    const stamp = Date.now();
    setLocalSyncStamp(accountId, stamp);
    queueCloudPush(accountId, stamp);
  }, [queueCloudPush]);

  const applyCloudSnapshot = useCallback((accountId: string, snapshot: FinanceSnapshot) => {
    if (!accountId) {
      return;
    }

    applyingCloudRef.current = true;
    try {
      customDB.set('knapsack_w', Array.isArray(snapshot.wallets) ? snapshot.wallets : []);
      customDB.set('knapsack_t', Array.isArray(snapshot.trans) ? snapshot.trans : []);
      customDB.set('knapsack_exp', Array.isArray(snapshot.expenses) ? snapshot.expenses : []);
      customDB.set('knapsack_p', snapshot.prefs && typeof snapshot.prefs === 'object' ? snapshot.prefs : DEFAULT_PREFS);
      customDB.set('knapsack_cats', Array.isArray(snapshot.cats) && snapshot.cats.length ? snapshot.cats : DEFAULT_CATS);
    } finally {
      applyingCloudRef.current = false;
    }

    const syncStamp = Number.isFinite(snapshot.updatedAt) && snapshot.updatedAt > 0
      ? snapshot.updatedAt
      : Date.now();
    setLocalSyncStamp(accountId, syncStamp);
    refresh();
  }, [refresh]);

  const activeAccountId = getActiveUserStorageId();

  useEffect(() => {
    activeAccountRef.current = activeAccountId;

    if (!activeAccountId || !isCloudSyncConfigured()) {
      return;
    }

    let cancelled = false;

    const reconcileCloud = async () => {
      try {
        const localStamp = getLocalSyncStamp(activeAccountId);
        const localSnapshot = buildLocalSnapshot(localStamp || Date.now());
        const localHasData = hasSnapshotContent(localSnapshot);

        const cloudSnapshot = await pullCloudSnapshot(activeAccountId);
        if (cancelled || activeAccountRef.current !== activeAccountId) {
          return;
        }

        const cloudHasData = hasSnapshotContent(cloudSnapshot);

        if (cloudSnapshot && (cloudSnapshot.updatedAt > localStamp || (!localHasData && cloudHasData))) {
          applyCloudSnapshot(activeAccountId, cloudSnapshot);
          return;
        }

        if (localHasData && (!cloudSnapshot || localStamp > cloudSnapshot.updatedAt || !cloudHasData)) {
          const nextStamp = localStamp > 0 ? localStamp : Date.now();
          setLocalSyncStamp(activeAccountId, nextStamp);
          queueCloudPush(activeAccountId, nextStamp);
        }
      } catch (err) {
        console.error('Cloud reconcile sync failed:', err);
      }
    };

    void reconcileCloud();

    return () => {
      cancelled = true;
    };
  }, [activeAccountId, applyCloudSnapshot, buildLocalSnapshot, queueCloudPush]);

  useEffect(() => {
    return () => {
      if (pushTimerRef.current) {
        window.clearTimeout(pushTimerRef.current);
      }
    };
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
    markLocalChange();
    refresh();
    return true;
  }, [markLocalChange, refresh]);

  const addExpense = useCallback((expense) => {
    const prev = customDB.get('knapsack_exp', []);
    const item = { ...expense, id: Date.now().toString(), paidMonths: [] };
    customDB.set('knapsack_exp', [...prev, item]);
    markLocalChange();
    refresh();
  }, [markLocalChange, refresh]);

  const removeExpense = useCallback((id) => {
    const prev = customDB.get('knapsack_exp', []);
    customDB.set('knapsack_exp', prev.filter(e => e.id !== id));
    markLocalChange();
    refresh();
  }, [markLocalChange, refresh]);

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
    markLocalChange();
    refresh();
  }, [markLocalChange, refresh]);

  const savePrefs = useCallback((prefs) => {
    customDB.set('knapsack_p', prefs);
    markLocalChange();
    refresh();
  }, [markLocalChange, refresh]);

  const saveCats = useCallback((cats) => {
    customDB.set('knapsack_cats', cats);
    markLocalChange();
    refresh();
  }, [markLocalChange, refresh]);

  const updateTransaction = useCallback((id, patch) => {
    const prev = customDB.get('knapsack_t', []);
    const rates = ratesRef.current;
    let tlAmt = parseFloat(patch.amount || 0);
    if (patch.currency === 'USD') tlAmt *= rates.USD;
    if (patch.currency === 'EUR') tlAmt *= rates.EUR;
    customDB.set('knapsack_t', prev.map(t => t.id === id ? { ...t, ...patch, amount: tlAmt } : t));
    markLocalChange();
    refresh();
  }, [markLocalChange, refresh]);

  const updateExpense = useCallback((id, patch) => {
    const prev = customDB.get('knapsack_exp', []);
    customDB.set('knapsack_exp', prev.map(e => e.id === id ? { ...e, ...patch } : e));
    markLocalChange();
    refresh();
  }, [markLocalChange, refresh]);

  return {
    data, liveRates,
    addTransaction, updateTransaction, addExpense, removeExpense,
    toggleExpensePaid, updateExpense,
    savePrefs, saveCats, refresh, loading,
  };
}
