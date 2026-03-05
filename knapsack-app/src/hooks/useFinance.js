import { useState, useEffect } from 'react';
import { customDB } from '../utils/constants';

export function useFinance() {
  const [data, setData] = useState({ 
    trans: [], 
    wallets: [], 
    prefs: { currency: '₺', themeColor: 'indigo' } 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const wall = customDB.get('knapsack_w', []);
    const trans = customDB.get('knapsack_t', []);
    const prefs = customDB.get('knapsack_p', { currency: '₺', themeColor: 'indigo' });
    setData({ trans, wallets: wall, prefs });
    setLoading(false);
  }, []);

  return { 
    data, 
    loading, 
    liveRates: { USD: 33.10, EUR: 35.80, GOLD: 3180 } 
  };
}