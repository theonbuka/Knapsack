import React, { ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Error caught:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDark = localStorage.getItem('knapsack_theme') === 'true';

      return (
        <div
          className={`min-h-screen flex items-center justify-center p-4 ${
            isDark ? 'bg-[#06060a]' : 'bg-[#f2f1ed]'
          }`}
        >
          <div
            className={`rounded-2xl p-8 max-w-md w-full ${
              isDark
                ? 'bg-white/[0.03] border border-white/10'
                : 'bg-white border border-slate-200'
            }`}
          >
            <div className="flex justify-center mb-6">
              <div
                className={`p-3 rounded-full ${
                  isDark ? 'bg-red-500/10' : 'bg-red-50'
                }`}
              >
                <AlertCircle className="text-red-500" size={32} />
              </div>
            </div>

            <h1
              className={`text-2xl font-bold text-center mb-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Oops! Bir hata oluştu
            </h1>

            <p
              className={`text-center mb-6 ${
                isDark ? 'text-white/60' : 'text-slate-600'
              }`}
            >
              Uygulamada beklenmeyen bir hata meydana geldi. Lütfen aşağıdaki
              seçeneklerden birini deneyin.
            </p>

            {this.state.error && (
              <div
                className={`mb-6 p-3 rounded-lg text-sm overflow-auto max-h-32 ${
                  isDark
                    ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                <p className="font-mono break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  isDark
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <RefreshCw size={18} />
                Yenile
              </button>

              <button
                onClick={this.handleReset}
                className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                }`}
              >
                <Home size={18} />
                Anasayfa
              </button>
            </div>

            <p
              className={`text-center text-xs mt-4 ${
                isDark ? 'text-white/40' : 'text-slate-500'
              }`}
            >
              Sorun devam ederse, lütfen iletişime geçin
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
