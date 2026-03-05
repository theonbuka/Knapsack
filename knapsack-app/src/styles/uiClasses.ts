export const uiClasses = {
  // Text colors
  text: {
    primary: (isDark: boolean) => (isDark ? 'text-white' : 'text-slate-900'),
    secondary: (isDark: boolean) => (isDark ? 'text-white/60' : 'text-slate-600'),
    muted: (isDark: boolean) => (isDark ? 'text-white/40' : 'text-slate-400'),
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-rose-500',
    info: 'text-sky-500',
  },

  // Card styles
  card: {
    dark: 'bg-white/[0.035] border-white/[0.08] backdrop-blur-xl border rounded-[2.5rem]',
    light: 'bg-white border-slate-200 shadow-lg border rounded-[2.5rem]',
    base: (isDark: boolean) =>
      isDark
        ? 'bg-white/[0.035] border-white/[0.08] backdrop-blur-xl border rounded-[2.5rem]'
        : 'bg-white border-slate-200 shadow-lg border rounded-[2.5rem]',
  },

  // Input styles
  input: {
    dark: 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500/40',
    light: 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400',
    base: (isDark: boolean) =>
      isDark
        ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500/40'
        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400',
  },

  // Button styles
  button: {
    primary: (isDark: boolean, colorBg: string = 'bg-indigo-600') =>
      `${colorBg} text-white border-transparent hover:opacity-90 transition-all`,
    secondary: (isDark: boolean) =>
      isDark
        ? 'bg-white/5 border-white/10 text-white hover:opacity-80 transition-all'
        : 'bg-slate-50 border-slate-200 text-slate-900 hover:opacity-80 transition-all',
    ghost: (isDark: boolean) =>
      isDark ? 'text-white/40 hover:text-white/60 transition-all' : 'text-slate-400 hover:text-slate-600 transition-all',
  },

  // Background gradients
  gradient: {
    darkOverlay: 'bg-gradient-to-b from-transparent via-transparent to-black/20',
    lightOverlay: 'bg-gradient-to-b from-transparent via-transparent to-black/5',
  },

  // Spacing helpers
  spacing: {
    sectionX: 'px-4 sm:px-6',
    sectionY: 'py-20 pb-44',
    cardPadding: 'p-5 sm:p-6',
    modalPadding: 'p-6 sm:p-8',
  },

  // Border radius presets
  rounded: {
    logo: 'rounded-[2.5rem]',
    large: 'rounded-[2rem]',
    medium: 'rounded-xl',
    small: 'rounded-lg',
  },

  // Max widths
  maxWidth: {
    dashboard: 'max-w-5xl',
    section: 'max-w-4xl',
    form: 'max-w-md',
    full: 'w-full',
  },
};

export default uiClasses;
