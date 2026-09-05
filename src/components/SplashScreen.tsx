import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, CheckCircle2, ChevronRight, Smartphone } from 'lucide-react';
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
      className="fixed inset-0 z-[9999] w-full h-[100dvh] max-h-[100dvh] overflow-hidden select-none bg-gradient-to-b from-[#051814] via-[#07241E] to-[#030E0C] text-white flex flex-col justify-between p-5 sm:p-7"
    >
      {/* Background Soft Glow Accents (Clean & Subdued) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[320px] h-[320px] rounded-full bg-emerald-500/10 blur-3xl -translate-y-10 animate-pulse" />
        <div className="w-[260px] h-[260px] rounded-full bg-amber-400/5 blur-2xl translate-y-16" />
        {/* Subtle grid pattern for clean depth */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }} 
        />
      </div>

      {/* 1 FRAME: Top Header (Instansi & Skip) */}
      <div className="relative z-10 w-full max-w-sm mx-auto flex items-center justify-between shrink-0 pt-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-emerald-400/20 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-bold tracking-wider text-emerald-300 uppercase">
            KEMENSOS RI • SRT 1 KEDIRI
          </span>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="px-3 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.15] active:scale-95 border border-white/10 text-slate-300 hover:text-white text-[11px] font-medium flex items-center gap-1 backdrop-blur-md transition-all cursor-pointer"
          title="Lewati Splash Screen"
        >
          <span>Lewati</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* 1 FRAME: Center Hero Section (Logo + App Title) */}
      <div className="relative z-10 w-full max-w-sm mx-auto flex-1 flex flex-col items-center justify-center text-center my-auto min-h-0 py-4">
        {/* Logo Card with Clean Glow */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 160, damping: 18 }}
          className="relative"
        >
          {/* Ambient Glow */}
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-emerald-500/25 to-amber-400/20 blur-xl opacity-80" />

          {/* Logo Frame */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-1 bg-gradient-to-b from-amber-400/40 via-emerald-500/30 to-slate-900/80 shadow-xl shadow-black/60 border border-emerald-400/30">
            <img 
              src="/logo.svg" 
              alt="Logo Wali Asuh" 
              className="w-full h-full object-contain rounded-[14px] drop-shadow-md" 
            />
          </div>

          {/* Clean Sparkle Badge */}
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400/20 border border-amber-300/40 backdrop-blur-sm flex items-center justify-center text-amber-300 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </div>
        </motion.div>

        {/* Title & Identity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-5 space-y-1.5"
        >
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            WALI <span className="bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-200 bg-clip-text text-transparent">ASUH</span>
          </h1>
          <p className="text-xs sm:text-[13px] text-emerald-200/90 font-medium tracking-wide">
            Sistem Jadwal Shif &amp; Piket 24 Jam
          </p>
          <div className="pt-1">
            <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300">
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
        {/* Sleek Modern Progress Bar */}
        <div className="w-full bg-white/[0.08] rounded-full h-1.5 p-0.5 backdrop-blur-md border border-white/10 overflow-hidden shadow-inner">
          <motion.div 
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
            style={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.15 }}
          />
        </div>

        {/* Status Line & Percentage */}
        <div className="w-full flex items-center justify-between text-[11px] font-medium text-emerald-200/90 px-0.5">
          <span className="truncate max-w-[240px] flex items-center gap-1.5 text-left">
            {isCompleted ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            )}
            <span className="truncate">{statusText}</span>
          </span>
          <span className="font-mono font-bold text-amber-300 shrink-0 ml-2">{progress}%</span>
        </div>

        {/* Android Edition Footer Badge */}
        <div className="pt-1 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
          <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Android Edition • PWA 1-Frame Ready</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
