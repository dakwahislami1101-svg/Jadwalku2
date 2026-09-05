import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  Volume2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  Play, 
  Sliders,
  Check
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { notificationService } from '../utils/notification';
import { SHIFT_TASKS_TEMPLATE } from '../data/initialSchedule';

interface NotificationSettingsProps {
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  onShowSplash?: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  soundEnabled,
  setSoundEnabled,
  onShowSplash,
}) => {
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [selectedSound, setSelectedSound] = useState<'bell' | 'chime' | 'digital' | 'gong'>('bell');
  const [shiftStartOffset, setShiftStartOffset] = useState<number>(30); // 30 minutes before
  const [handoverReminder, setHandoverReminder] = useState<boolean>(true);
  const [taskAlarmsEnabled, setTaskAlarmsEnabled] = useState<boolean>(true);
  const [testSentToast, setTestSentToast] = useState<boolean>(false);

  useEffect(() => {
    setPermissionStatus(notificationService.getPermissionStatus());
  }, []);

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setPermissionStatus(notificationService.getPermissionStatus());
    if (granted) {
      soundManager.playChime();
      notificationService.triggerNotification('Notifikasi Aktif!', {
        body: 'Sistem pengingat tugas & shif wali asuh kini dapat mengirimkan alarm tepat waktu.',
        sound: selectedSound,
      });
    }
  };

  const handlePreviewSound = (sound: 'bell' | 'chime' | 'digital' | 'gong') => {
    setSelectedSound(sound);
    soundManager.playSound(sound);
  };

  const handleTestNotification = () => {
    notificationService.triggerNotification('⏰ Pengingat Tugas Wali Asuh', {
      body: 'Waktu pelaksanaan: 15 menit lagi menuju Shif Jaga & Apel Koordinasi. Siapkan log buku jaga.',
      sound: selectedSound,
    });
    setTestSentToast(true);
    setTimeout(() => setTestSentToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Pusat Notifikasi & Pengingat Tugas Wali Asuh
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atur alarm suara dan pemberitahuan berkala untuk setiap pergantian shif dan tugas harian
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleTestNotification}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all shrink-0"
        >
          <Bell className="w-4 h-4" />
          <span>Kirim Notifikasi Uji Coba</span>
        </button>
      </div>

      {testSentToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Notifikasi uji coba dan nada dering berhasil dibunyikan!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Browser Notification & Sound Setting */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Izin Notifikasi Web & Desktop
              </h3>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                permissionStatus === 'granted'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {permissionStatus === 'granted' ? 'Izin Aktif' : 'Perlu Izin'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Dengan mengaktifkan izin notifikasi peramban (browser), Anda akan menerima pemberitahuan otomatis di layar perangkat sebelum shif dimulai dan saat waktu tugas tiba.
            </p>

            {permissionStatus !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                <span>Aktifkan Izin Notifikasi Browser Sekarang</span>
              </button>
            )}

            {/* Sound Selector */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-indigo-600" />
                  <span>Pilihan Nada Alarm / Chime:</span>
                </label>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold"
                >
                  {soundEnabled ? 'Matikan Suara' : 'Hidupkan Suara'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'bell', label: 'Harmonic Bell', desc: 'Lonceng melodi' },
                  { id: 'chime', label: 'Gentle Chime', desc: 'Arpeggio lembut' },
                  { id: 'digital', label: 'Digital Beep', desc: 'Nada bip modern' },
                  { id: 'gong', label: 'Warm Gong', desc: 'Gong tenang' },
                ].map((s) => {
                  const isSelected = selectedSound === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handlePreviewSound(s.id as any)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/50 ring-2 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-900/50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{s.label}</div>
                        <div className="text-[10px] text-slate-500">{s.desc}</div>
                      </div>
                      <Play className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Module 2: Offset Waktu & Konfigurasi Tugas */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Waktu Pengingat Shif & Tugas
              </h3>
            </div>
            <Sliders className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4 text-xs">
            {/* Shift Start Offset */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Ingatkan Sebelum Shif Dimulai:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      setShiftStartOffset(mins);
                      soundManager.playChime();
                    }}
                    className={`py-2 px-1 rounded-xl border text-center font-bold transition-all ${
                      shiftStartOffset === mins
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {mins} Menit
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Pengingat Serah Terima (Handover)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Notifikasi 15 menit sebelum pergantian shif untuk menyiapkan buku jaga
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={handoverReminder}
                  onChange={(e) => setHandoverReminder(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Pengingat Tugas Harian (Checklist Alarms)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Membunyikan alarm saat waktu agenda tiba (Apel, Sholat, Makan, Belajar)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={taskAlarmsEnabled}
                  onChange={(e) => setTaskAlarmsEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
            </div>

            {/* List of preset alarms */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[11px] space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Jadwal Alarm Rutin yang Terdaftar:
              </div>
              <div>• 06:30 WIB - Pengingat Masuk Shif Pagi & Apel</div>
              <div>• 11:45 WIB - Pengingat Sholat Dzuhur & Makan Siang</div>
              <div>• 14:30 WIB - Pengingat Handover Shif Sore (15:00)</div>
              <div>• 17:30 WIB - Pengingat Sholat Maghrib & Makan Malam</div>
              <div>• 19:30 WIB - Pengingat Jam Belajar Mandiri Siswa</div>
              <div>• 21:45 WIB - Pengingat Patroli Penguncian Barak & Shif Malam</div>
              <div>• 04:00 WIB - Pengingat Membangunkan Sholat Subuh</div>
            </div>

            {/* Android APK Splash Screen & Icon Showcase */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src="/logo.svg" 
                  alt="Logo Sekolah Rakyat" 
                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white object-contain p-0.5 shadow-xs" 
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Splash Screen &amp; Logo APK
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Animasi pembuka aplikasi resmi Wali Asuh
                  </div>
                </div>
              </div>
              {onShowSplash && (
                <button
                  type="button"
                  onClick={onShowSplash}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Uji Splash Screen</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
