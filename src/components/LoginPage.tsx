import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, LogIn, AlertCircle, Sparkles, Building, Calendar } from 'lucide-react';
import { INSTITUTION_INFO } from '../data/initialSchedule';

interface LoginPageProps {
  onLoginSuccess: (role: 'admin' | 'staff') => void;
  onShowSplash?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onShowSplash }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    setTimeout(() => {
      // 1. Akun Khusus Admin: user "admin", password "selamanya"
      if (trimmedUser === 'admin' && trimmedPass === 'selamanya') {
        const sessionData = {
          user: 'admin',
          role: 'admin' as const,
          name: 'Administrator SRT 1',
          loggedInAt: new Date().toISOString(),
        };
        if (rememberMe) {
          localStorage.setItem('sr_auth_session', JSON.stringify(sessionData));
        } else {
          sessionStorage.setItem('sr_auth_session', JSON.stringify(sessionData));
        }
        setIsLoading(false);
        onLoginSuccess('admin');
        return;
      }

      // 2. Akun Reguler Wali Asuh: user "waliasuh", password "simalakama"
      if (trimmedUser === 'waliasuh' && trimmedPass === 'simalakama') {
        const sessionData = {
          user: 'waliasuh',
          role: 'staff' as const,
          name: 'Wali Asuh',
          loggedInAt: new Date().toISOString(),
        };
        if (rememberMe) {
          localStorage.setItem('sr_auth_session', JSON.stringify(sessionData));
        } else {
          sessionStorage.setItem('sr_auth_session', JSON.stringify(sessionData));
        }
        setIsLoading(false);
        onLoginSuccess('staff');
        return;
      }

      // Validasi gagal
      setIsLoading(false);
      setErrorMessage('Nama pengguna atau kata sandi tidak cocok. Silakan periksa kembali.');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Kementerian Sosial RI</span>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 pt-1">
            <img 
              src="/logo.svg" 
              alt="Logo Resmi Wali Asuh" 
              onClick={onShowSplash}
              title={onShowSplash ? "Klik untuk melihat animasi Splash Screen" : undefined}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-xl shadow-emerald-950/50 border border-emerald-500/30 object-cover ${onShowSplash ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`} 
            />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Sistem Informasi Wali Asuh
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            {INSTITUTION_INFO.sekolah} • {INSTITUTION_INFO.gedung}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          <div className="mb-6 border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-400" /> Masuk ke Aplikasi
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Masukkan nama pengguna dan kata sandi otorisasi untuk mengakses jadwal dan laporan.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="login-username">
                Nama Pengguna (User)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan nama pengguna..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="login-password">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                />
                <span className="text-xs text-slate-300">Ingat sesi saya di perangkat ini</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Buka Aplikasi</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom helper & Splash Preview */}
          {onShowSplash && (
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-center text-[11px] text-slate-400">
              <button
                type="button"
                onClick={onShowSplash}
                className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline flex items-center gap-1.5 cursor-pointer"
                title="Lihat animasi intro aplikasi"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Lihat Splash Screen
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-400 space-y-1">
          <p>© 2026 SRT 1 Kab Kediri • Sistem Penjadwalan Shif & Notifikasi Pengingat Tugas</p>
        </div>
      </div>
    </div>
  );
};
