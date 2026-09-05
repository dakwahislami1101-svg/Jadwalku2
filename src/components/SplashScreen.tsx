import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, CheckCircle2, ChevronRight, Smartphone, ShieldCheck } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface SplashScreenProps {
  onFinish?: () => void;
  minDuration?: number; // in milliseconds, default 2200ms
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onFinish,
  minDuration = 2200 
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Memulai aplikasi...');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    const intervalTime = 30;
    const totalSteps = minDuration / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(Math.round((currentStep / totalSteps) * 100), 100);
      setProgress(currentProgress);

      if (currentProgress < 30) {
        setStatusText('Menyiapkan modul piket...');
      } else if (currentProgress < 65) {
        setStatusText('Memuat rotasi shif 24 jam...');
      } else if (currentProgress < 90) {
        setStatusText('Sinkronisasi data cloud...');
      } else {
        setStatusText('Sistem siap, selamat bertugas!');
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsCompleted(true);
        try {
          soundManager.playChime();
        } catch {}
        setTimeout(() => {
          if (onFinish) onFinish();
        }, 350);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [minDuration, onFinish]);

  const handleSkip = () => {
    try {
      soundManager.playClick();
    } catch {}
    if (onFinish) onFinish();
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } }}
      className="fixed inset-0 z-[9999] w-full h-[100dvh] max-h-[100dvh] overflow-hidden select-none bg-gradient-to-b from-white via-slate-50 to-emerald-50/30 text-slate-800 flex flex-col justify-between p-5 sm:p-7"
    >
      {/* Background Soft Accents (Clean, Minimalist White Theme) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[360px] h-[360px] rounded-full bg-emerald-500/5 blur-3xl -translate-y-12 animate-pulse" />
        <div className="w-[300px] h-[300px] rounded-full bg-teal-400/5 blur-3xl translate-y-16" />
        {/* Subtle grid pattern for clean depth */}
        <div 
          className="absolute inset-0 opacity-[0.04]" 
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }} 
        />
      </div>

      {/* 1 FRAME: Top Header (Instansi & Skip) */}
      <div className="relative z-10 w-full max-w-sm mx-auto flex items-center justify-between shrink-0 pt-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-emerald-500/25 shadow-xs backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="text-[10.5px] font-bold tracking-wider text-emerald-800 uppercase">
            Kemensos RI • SRT 1 Kediri
          </span>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="px-3 py-1 rounded-full bg-white/90 hover:bg-white active:scale-95 border border-slate-200 shadow-xs text-slate-600 hover:text-slate-900 text-[11px] font-semibold flex items-center gap-1 backdrop-blur-md transition-all cursor-pointer"
          title="Lewati Splash Screen"
        >
          <span>Lewati</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* 1 FRAME: Center Hero Section (Logo + App Title) */}
      <div className="relative z-10 w-full max-w-sm mx-auto flex-1 flex flex-col items-center justify-center text-center my-auto min-h-0 py-4">
        {/* Logo Card with Clean White Aesthetic */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 160, damping: 18 }}
          className="relative"
        >
          {/* Ambient Glow */}
          <div className="absolute -inset-2.5 rounded-3xl bg-gradient-to-tr from-emerald-500/15 via-teal-400/10 to-amber-400/10 blur-xl opacity-90" />

          {/* Logo Frame */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-2 bg-white shadow-xl shadow-slate-200/90 border border-emerald-500/20 flex items-center justify-center">
            <img 
              src="/logo.svg" 
              alt="Logo Wali Asuh" 
              className="w-full h-full object-contain rounded-xl drop-shadow-xs" 
            />
          </div>

          {/* Clean Sparkle Badge */}
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-50 border border-amber-300 shadow-xs flex items-center justify-center text-amber-600">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </motion.div>

        {/* Title & Identity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-5 space-y-1.5"
        >
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            WALI <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">ASUH</span>
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-600 font-semibold tracking-wide">
            Sistem Jadwal Shif &amp; Piket 24 Jam
          </p>
          <div className="pt-1">
            <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10.5px] font-bold text-emerald-800 shadow-2xs">
              Aplikasi Wali Asuh Asrama
            </span>
          </div>
        </motion.div>
      </div>

      {/* 1 FRAME: Bottom Section (Progress Bar & Android Edition Indicator) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center text-center pb-2 shrink-0 space-y-2.5"
      >
        {/* Sleek Modern Progress Bar (Clean White / Emerald Theme) */}
        <div className="w-full bg-slate-200/80 rounded-full h-2 p-0.5 border border-slate-300/70 overflow-hidden shadow-inner">
          <motion.div 
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 shadow-xs"
            style={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.15 }}
          />
        </div>

        {/* Status Line & Percentage */}
        <div className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-600 px-0.5">
          <span className="truncate max-w-[240px] flex items-center gap-1.5 text-left">
            {isCompleted ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            )}
            <span className="truncate text-slate-700">{statusText}</span>
          </span>
          <span className="font-mono font-bold text-emerald-700 shrink-0 ml-2">{progress}%</span>
        </div>

        {/* Android Edition Footer Badge */}
        <div className="pt-1 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
          <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Android Edition • PWA 1-Frame Ready</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
