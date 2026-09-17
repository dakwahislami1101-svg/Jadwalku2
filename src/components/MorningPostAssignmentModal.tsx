import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Check, 
  X, 
  Sparkles, 
  Edit3, 
  Trash2,
  ChevronDown,
  ShieldCheck,
  MapPin
} from 'lucide-react';
import { Staff, MorningPostCustomOption, MorningPostAssignment } from '../types';
import { 
  getLocalMorningPostOptions, 
  subscribeToMorningPostOptions, 
  saveMorningPostAssignmentToFirestore, 
  deleteMorningPostAssignment,
  getLocalMorningPostAssignments
} from '../utils/morningPostService';
import { soundManager } from '../utils/audio';

interface MorningPostAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff;
  day: number;
  month: number;
  year: number;
  monthName: string;
  shiftCode: 'P1' | 'P2';
  userRole: 'admin' | 'staff';
  onSaved?: (assignment: MorningPostAssignment | null) => void;
}

export const MorningPostAssignmentModal: React.FC<MorningPostAssignmentModalProps> = ({
  isOpen,
  onClose,
  staff,
  day,
  month,
  year,
  monthName,
  shiftCode,
  userRole,
  onSaved,
}) => {
  const [options, setOptions] = useState<MorningPostCustomOption[]>(() => getLocalMorningPostOptions());
  const [selectedPost, setSelectedPost] = useState<string>('UKS SMP');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customText, setCustomText] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeToMorningPostOptions((opts) => setOptions(opts));
    return () => unsub();
  }, []);

  // Load existing assignment if any
  useEffect(() => {
    if (isOpen) {
      const all = getLocalMorningPostAssignments(year, month);
      const existing = all[`${day}_${staff.id}`];
      if (existing) {
        const found = options.find((opt) => opt.label === existing.postTitle);
        if (found) {
          setSelectedPost(existing.postTitle);
          setIsCustomMode(false);
          setCustomText('');
        } else {
          setIsCustomMode(true);
          setCustomText(existing.postTitle);
          setSelectedPost('__CUSTOM__');
        }
      } else {
        // default based on shift
        const defaultPost = options[0]?.label || 'UKS SD';
        setSelectedPost(defaultPost);
        setIsCustomMode(false);
        setCustomText('');
      }
    }
  }, [isOpen, day, staff.id, year, month, options]);

  if (!isOpen) return null;

  const handleSelectOption = (label: string) => {
    if (userRole !== 'admin') return;
    if (label === '__CUSTOM__') {
      setIsCustomMode(true);
      setSelectedPost('__CUSTOM__');
    } else {
      setIsCustomMode(false);
      setSelectedPost(label);
    }
    soundManager.playClick();
  };

  const handleSave = async () => {
    if (userRole !== 'admin') return;
    let finalTitle = isCustomMode ? customText.trim() : selectedPost;
    if (!finalTitle) {
      finalTitle = options[0]?.label || 'UKS SMP';
    }

    const assignment: MorningPostAssignment = {
      staffId: staff.id,
      day,
      month,
      year,
      shiftCode,
      postTitle: finalTitle,
      customDetail: isCustomMode ? customText.trim() : undefined,
      updatedBy: 'Admin',
    };

    setIsSaving(true);
    await saveMorningPostAssignmentToFirestore(assignment);
    setIsSaving(false);
    soundManager.playChime();
    if (onSaved) onSaved(assignment);
    onClose();
  };

  const handleClear = async () => {
    if (userRole !== 'admin') return;
    setIsSaving(true);
    await deleteMorningPostAssignment(year, month, day, staff.id);
    setIsSaving(false);
    soundManager.playClick();
    if (onSaved) onSaved(null);
    onClose();
  };

  const isP1 = shiftCode === 'P1';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full border border-sky-300 dark:border-sky-700/70 shadow-2xl overflow-hidden flex flex-col transition-all select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-4 py-3 bg-gradient-to-r ${isP1 ? 'from-sky-700 to-blue-800' : 'from-teal-700 to-emerald-800'} text-white flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <MapPin className="w-4 h-4 text-sky-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm leading-tight">
                  Penugasan Pos Shif {shiftCode}
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-white/20 text-white border border-white/30">
                  {isP1 ? '07:00-15:00' : '08:00-16:00'}
                </span>
              </div>
              <p className="text-[11px] text-white/80 leading-none mt-0.5">
                Tanggal {day} {monthName} {year}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Petugas Info */}
        <div className="p-3 bg-sky-50/50 dark:bg-sky-950/30 border-b border-sky-100 dark:border-sky-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-sky-200 dark:bg-sky-800 text-sky-900 dark:text-sky-100 flex items-center justify-center font-black text-xs">
              {staff.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {staff.name}
              </div>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
                Wali Asuh • Kode Shif: <strong className="text-sky-700 dark:text-sky-300 font-extrabold">{shiftCode}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Khusus Admin</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 space-y-3">
          {userRole !== 'admin' ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Hanya Administrator yang berwenang menentukan atau mengubah penugasan pos tugas UKS / Mobile ini.</span>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Pilih Pos Penugasan:
                </label>
                <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {options.map((opt) => {
                    const isSelected = !isCustomMode && selectedPost === opt.label;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(opt.label)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-600 text-white border-sky-700 shadow-xs ring-1 ring-sky-300 dark:ring-sky-400'
                            : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-sky-600 dark:text-sky-400'}`} />
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}

                  {/* Option Custom */}
                  <button
                    type="button"
                    onClick={() => handleSelectOption('__CUSTOM__')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                      isCustomMode
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs ring-1 ring-amber-300'
                        : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Edit3 className={`w-3.5 h-3.5 ${isCustomMode ? 'text-white' : 'text-amber-600'}`} />
                      <span>Kustom (Ketik Penugasan Khusus)</span>
                    </div>
                    {isCustomMode && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                </div>
              </div>

              {/* Custom Input */}
              {isCustomMode && (
                <div className="space-y-1 pt-1 animate-in fade-in">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Ketik Pos / Penugasan Khusus:
                  </label>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Misal: UKS Asrama Putra / Lab Komputer"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-600 bg-amber-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Pos ini akan otomatis tampil di baris nama, dashboard, dan pop-up tugas.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          {userRole === 'admin' ? (
            <>
              <button
                type="button"
                onClick={handleClear}
                disabled={isSaving}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Hapus penugasan kustom dan kembalikan ke default"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                <span>Reset</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Menyimpan...' : 'Terapkan Pos'}</span>
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
