export const themeColors = {
  indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-500/20' },
  rose: { bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-500/20' }
};

export const customDB = {
  get: (k, def) => {
    try {
      const x = localStorage.getItem(k);
      return x ? JSON.parse(x) : def;
    } catch (e) { return def; }
  },
  set: (k, val) => localStorage.setItem(k, JSON.stringify(val))
};