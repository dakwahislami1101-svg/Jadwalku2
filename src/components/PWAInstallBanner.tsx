import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Share2, PlusSquare, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isDismissed, install, dismiss } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running inside installed standalone PWA or dismissed by user
  if (isInstalled || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      // In browsers where beforeinstallprompt has not fired yet or in desktop preview
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <AnimatePresence>
        <motion.aside
          aria-label="Instal Aplikasi"
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-4 inset-x-0 mx-auto z-50 max-w-sm px-3 pointer-events-auto"
        >
          <div className="bg-slate-900/95 dark:bg-slate-900/95 text-white border border-emerald-500/40 rounded-2xl shadow-2xl backdrop-blur-md p-2.5 flex items-center justify-between gap-2.5">
            {/* Logo App */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0 w-9 h-9 rounded-xl overflow-hidden shadow-inner border border-emerald-400/40 bg-slate-950 flex items-center justify-center">
                <img
                  src="/logo.svg"
                  alt="Wali Asuh"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-100 truncate leading-tight">
                  Instal Aplikasi Wali Asuh
                </p>
                <p className="text-[10px] text-emerald-300 truncate leading-tight">
                  Akses instan di layar HP & offline
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                id="btn-pwa-install-quick"
                type="button"
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all active:scale-95 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 shrink-0 animate-bounce" />
                <span>{isInstalling ? 'Memproses...' : 'Instal'}</span>
              </button>

              <button
                type="button"
                onClick={dismiss}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Tutup banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.aside>
      </AnimatePresence>

      {/* iOS / Fallback Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/logo.svg" alt="App Icon" className="w-8 h-8 rounded-lg" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Instal ke Layar Utama
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <p className="leading-snug">
                  Tekan ikon menu <strong>Share / Bagikan</strong> <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" /> atau tombol titik tiga di browser Anda.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <p className="leading-snug">
                  Pilih menu <strong>Tambahkan ke Layar Utama</strong> (<i>Add to Home Screen</i> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-500" />).
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 pt-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Aplikasi akan otomatis terpasang seperti aplikasi bawaan HP.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
