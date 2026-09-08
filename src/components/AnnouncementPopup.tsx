import React, { useState, useEffect, useRef } from 'react';
import { Megaphone, X, BellRing, Sparkles, ChevronRight, Volume2 } from 'lucide-react';
import { AnnouncementData } from '../types';

// Reappear interval: 3 hours in milliseconds
const REAPPEAR_INTERVAL_MS = 3 * 60 * 60 * 1000;

interface AnnouncementPopupProps {
  announcement: AnnouncementData;
  onOpenManagement?: () => void;
  userRole?: 'admin' | 'staff';
  forceOpen?: boolean;
  onCloseForceOpen?: () => void;
}

export const AnnouncementPopup: React.FC<AnnouncementPopupProps> = ({
  announcement,
  onOpenManagement,
  userRole = 'staff',
  forceOpen,
  onCloseForceOpen,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  
  // Touch / Swipe state tracking
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchCurrentY = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Sync forceOpen prop (for example when clicking ticker/detail)
  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setIsDismissing(false);
      setDragOffset({ x: 0, y: 0 });
    }
  }, [forceOpen]);

  // Check if this announcement should show on this device (new or >= 3 hours since last seen)
  useEffect(() => {
    if (!announcement || !announcement.enabled || !announcement.text?.trim()) {
      setIsOpen(false);
      return;
    }

    try {
      // Unique key per announcement text
      const lastDismissedKey = `announcement_seen_${encodeURIComponent(announcement.text.trim())}`;
      const lastSeenVal = localStorage.getItem(lastDismissedKey);

      let shouldShow = false;

      if (!lastSeenVal) {
        // First time seeing this announcement on this device
        shouldShow = true;
      } else {
        // Parse stored timestamp (supports either ISO string or epoch millis)
        const lastSeenTime = !isNaN(Number(lastSeenVal))
          ? Number(lastSeenVal)
          : new Date(lastSeenVal).getTime();

        const elapsedMs = Date.now() - lastSeenTime;

        // If 3 hours (or invalid date) have passed since user last dismissed on this device
        if (isNaN(lastSeenTime) || elapsedMs >= REAPPEAR_INTERVAL_MS) {
          shouldShow = true;
        }
      }

      if (shouldShow) {
        // Slight delay for pleasant entrance after dashboard mount
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    } catch {
      // Fallback
      setIsOpen(true);
    }
  }, [announcement?.text, announcement?.enabled]);

  // Handle dismiss and mark timestamp for this device (reappears after 3 hours)
  const handleDismiss = () => {
    setIsDismissing(true);
    try {
      if (announcement?.text) {
        const lastDismissedKey = `announcement_seen_${encodeURIComponent(announcement.text.trim())}`;
        localStorage.setItem(lastDismissedKey, Date.now().toString());
      }
    } catch {
      // Ignore localStorage error
    }

    setTimeout(() => {
      setIsOpen(false);
      setIsDismissing(false);
      setDragOffset({ x: 0, y: 0 });
      if (onCloseForceOpen) {
        onCloseForceOpen();
      }
    }, 250);
  };

  // Touch event handlers for swipe gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    touchStartX.current = touch.clientX;
    touchCurrentY.current = touch.clientY;
    touchCurrentX.current = touch.clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    const touch = e.touches[0];
    touchCurrentY.current = touch.clientY;
    touchCurrentX.current = touch.clientX;

    const diffY = touch.clientY - touchStartY.current;
    const diffX = touch.clientX - touchStartX.current;

    // Dampen drag
    setDragOffset({
      x: diffX * 0.8,
      y: diffY * 0.8,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (touchStartY.current !== null && touchCurrentY.current !== null) {
      const diffY = touchCurrentY.current - touchStartY.current;
      const diffX = (touchCurrentX.current || 0) - (touchStartX.current || 0);

      // If swiped up/down or left/right by more than 70px -> Dismiss!
      if (Math.abs(diffY) > 70 || Math.abs(diffX) > 80) {
        handleDismiss();
        return;
      }
    }

    // Reset position if not enough swipe distance
    setDragOffset({ x: 0, y: 0 });
    touchStartY.current = null;
    touchStartX.current = null;
    touchCurrentY.current = null;
    touchCurrentX.current = null;
  };

  if (!isOpen || !announcement?.enabled || !announcement?.text?.trim()) {
    return null;
  }

  // Calculate drag opacity and transform
  const dragDistance = Math.hypot(dragOffset.x, dragOffset.y);
  const dragOpacity = Math.max(0.2, 1 - dragDistance / 240);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-title"
      // Click anywhere on backdrop to dismiss!
      onClick={handleDismiss}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 select-none cursor-pointer ${
        isDismissing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Pop-up Card - stops propagation if clicked inside, or dismisses if user clicks button */}
      <div
        onClick={(e) => {
          // If clicked specifically on the card container, allow user to read or dismiss
          e.stopPropagation();
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) scale(${
            isDismissing ? 0.92 : 1
          })`,
          opacity: isDismissing ? 0 : dragOpacity,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
        }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-500/80 rounded-2xl shadow-2xl overflow-hidden cursor-default transition-all animate-in fade-in zoom-in-95 duration-300"
      >
        {/* Top Header Strip */}
        <div className="relative bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 px-4 py-3 text-white">
          {/* Swipe indicator pill on mobile */}
          <div className="w-10 h-1 rounded-full bg-white/40 mx-auto -mt-1 mb-2 sm:hidden" />

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                <Megaphone className="w-4 h-4 text-white animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-900/40 text-amber-100 px-2 py-0.5 rounded-full border border-white/20">
                    Pengumuman Baru
                  </span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                </div>
                <h3 id="announcement-title" className="text-sm font-extrabold tracking-tight mt-0.5 text-white">
                  Informasi Penting Wali Asuh
                </h3>
              </div>
            </div>

            {/* Quick Close Button */}
            <button
              type="button"
              onClick={handleDismiss}
              title="Tutup (Bisa juga ketuk di luar atau usap layar)"
              className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Message Bubble */}
          <div className="p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs">
            <p className="text-xs sm:text-sm font-medium text-amber-950 dark:text-amber-100 leading-relaxed whitespace-pre-wrap">
              {announcement.text}
            </p>
          </div>

          {/* Author & Timestamp Info */}
          <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 px-1">
            <span className="font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {announcement.updatedBy ? `Diterbitkan oleh: ${announcement.updatedBy}` : 'Dinas Wali Asuh SRT 1'}
            </span>
            {announcement.updatedAt && (
              <span className="font-mono text-[10px]">
                {new Date(announcement.updatedAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>

          {/* Touch Gesture Hint & Periodic reminder notice */}
          <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-slate-400 dark:text-slate-500 py-1 border-t border-slate-100 dark:border-slate-800 text-center">
            <span>💡</span>
            <span>Ketuk di mana saja / usap untuk menutup • Pengingat otomatis tiap 3 jam</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {userRole === 'admin' && onOpenManagement && (
              <button
                type="button"
                onClick={() => {
                  handleDismiss();
                  onOpenManagement();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                <span>Ubah Teks</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer"
            >
              <span>Saya Mengerti</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
