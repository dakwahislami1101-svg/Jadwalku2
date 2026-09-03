import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface SplashScreenProps {
  onFinish?: () => void;
  minDuration?: number; // in milliseconds, default 2200ms
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onFinish,
  minDuration = 2400 
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Menginisialisasi sistem...');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    const startTime = Date.now();
    const intervalTime = 30;
    const totalSteps = minDuration / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(Math.round((currentStep / totalSteps) * 100), 100);
      setProgress(currentProgress);

      if (currentProgress < 30) {
        setStatusText('Menyiapkan modul piket asrama...');
      } else if (currentProgress < 65) {
        setStatusText('Memuat jadwal shif & rotasi 24 jam...');
      } else if (currentProgress < 90) {
        setStatusText('Menghubungkan sinkronisasi Cloud Firestore...');
      } else {
        setStatusText('Sistem siap. Selamat bertugas!');
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsCompleted(true);
        try {
          soundManager.playChime();
        } catch {}
        setTimeout(() => {
          if (onFinish) onFinish();
        }, 400);
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
      exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-radial from-[#092922] via-[#051a16] to-[#020c0a] text-white select-none overflow-hidden p-6"
    >
      {/* Background Ambience & Sacred Pattern Watermark */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Soft Glowing Orbs */}
        <div className="w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-3xl animate-pulse" />
        <div className="w-[300px] h-[300px] rounded-full bg-amber-500/10 blur-2xl -translate-y-12" />

        {/* Subtle geometric ring */}
        <div className="absolute w-[440px] h-[440px] rounded-full border border-emerald-500/10 opacity-40 animate-[spin_60s_linear_infinite]" />
        <div className="absolute w-[520px] h-[520px] rounded-full border border-dashed border-amber-500/10 opacity-30 animate-[spin_90s_linear_infinite_reverse]" />
      </div>

      {/* Top Header / Instansi & Skip Button */}
      <div className="relative z-10 w-full flex items-center justify-between pt-2 px-1 sm:px-4">
        <div className="w-16 hidden sm:block" /> {/* Spacer for symmetry */}

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col items-center text-center mx-auto"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-emerald-500/20 backdrop-blur-md shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-emerald-300 uppercase">
              Kementerian Sosial Republik Indonesia
            </span>
          </div>
          <p className="text-[11px] sm:text-[12px] text-slate-300 font-medium tracking-wide mt-1.5 opacity-90">
            SRT 1 Kab Kediri
          </p>
        </motion.div>

        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-slate-300 hover:text-white text-[10px] sm:text-[11px] font-medium flex items-center gap-0.5 backdrop-blur-md transition-all cursor-pointer shadow-xs shrink-0"
          title="Lewati Splash Screen"
        >
          <span>Lewati</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Center Logo Showcase */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto">
        {/* Logo Aura Glow */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.8, 
            type: 'spring', 
            stiffness: 120, 
            damping: 14 
          }}
          className="relative group"
        >
          {/* Outer Breathing Halo */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-emerald-500/30 to-amber-500/25 blur-xl opacity-75 group-hover:opacity-100 transition duration-1000" />
          
          {/* Logo Frame */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl p-1 bg-gradient-to-b from-amber-400/40 via-emerald-500/30 to-slate-900/60 shadow-2xl shadow-emerald-950/80">
            <img 
              src="/logo.svg" 
              alt="Logo Resmi Wali Asuh" 
              className="w-full h-full object-contain rounded-[22px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]" 
            />
          </div>

          {/* Shimmer Sparkle Accent */}
          <motion.div
            animate={{ 
              rotate: [0, 15, -15, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 3, 
              ease: "easeInOut" 
            }}
            className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-400/20 border border-amber-300/40 backdrop-blur-sm flex items-center justify-center text-amber-300 shadow-md shadow-amber-500/20"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
          </motion.div>
        </motion.div>

        {/* Application Title */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 flex flex-col items-center"
        >
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <span>SISTEM INFORMASI</span>
            <span className="bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
              WALI ASUH
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 font-medium tracking-wider uppercase mt-1">
            Penjadwalan Shif &amp; Monitoring Piket 24 Jam
          </p>
        </motion.div>
      </div>

      {/* Bottom Loading Progress & Footer */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center text-center pb-3"
      >
        {/* Progress Bar Container */}
        <div className="w-full bg-white/10 rounded-full h-2 p-0.5 backdrop-blur-md border border-white/15 overflow-hidden shadow-inner">
          <motion.div 
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
            style={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.2 }}
          />
        </div>

        {/* Status text & Percentage */}
        <div className="w-full flex items-center justify-between text-[11px] font-medium text-emerald-300/90 mt-2 px-1">
          <span className="truncate max-w-[260px] flex items-center gap-1.5">
            {isCompleted ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            )}
            {statusText}
          </span>
          <span className="font-mono font-bold text-amber-300">{progress}%</span>
        </div>

        {/* Badge Versi & APK Edition */}
        <div className="mt-5 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>SRT 1 KAB KEDIRI • APK MOBILE READY</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
