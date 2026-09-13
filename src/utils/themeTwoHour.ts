/**
 * Palet Warna Gradasi Cerah Dinamis (Rotasi Otomatis Setiap 10 Menit Sekali).
 * 
 * Menghadirkan 18 variasi palet warna cerah, modern, dan memikat (Orange, Ungu,
 * Pink/Fuchsia, Turquoise/Cyan, Amber Emas, Coral, Emerald, dsb.)
 * dengan tingkat saturasi dan kontras optik yang tinggi (WCAG AA/AAA compliant)
 * sehingga tulisan putih tetap super tajam, tegas, dan sangat nyaman dibaca.
 */

export interface TwoHourTheme {
  timeSlot: string;
  name: string;
  gradientClass: string;
  borderClass: string;
  titleColor: string;
  subtitleColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconColor: string;
  accentGlow: string;
}

export type VibrantTheme = TwoHourTheme;

export const VIBRANT_THEMES: Omit<TwoHourTheme, 'timeSlot'>[] = [
  // 0. Sunset Orange (Jingga Senja Menyala & Amber Keemasan)
  {
    name: 'Sunset Orange',
    gradientClass: 'from-orange-600 via-amber-600 to-rose-700',
    borderClass: 'border-orange-400/50 shadow-orange-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-orange-100/90',
    badgeBg: 'bg-black/25 backdrop-blur-sm',
    badgeText: 'text-white',
    badgeBorder: 'border-white/25',
    iconColor: 'text-amber-200',
    accentGlow: 'from-orange-400/20 via-amber-300/15 to-transparent',
  },
  // 1. Royal Purple (Ungu Elektrik & Violet Mewah)
  {
    name: 'Royal Purple',
    gradientClass: 'from-purple-700 via-violet-600 to-indigo-800',
    borderClass: 'border-purple-400/50 shadow-purple-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-purple-100/90',
    badgeBg: 'bg-black/25 backdrop-blur-sm',
    badgeText: 'text-white',
    badgeBorder: 'border-white/25',
    iconColor: 'text-purple-200',
    accentGlow: 'from-purple-400/20 via-violet-300/15 to-transparent',
  },
  // 2. Berry Pink (Pink Cerah & Fusia Segar)
  {
    name: 'Berry Pink',
    gradientClass: 'from-pink-600 via-rose-600 to-fuchsia-700',
    borderClass: 'border-pink-400/50 shadow-pink-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-pink-100/90',
    badgeBg: 'bg-black/25 backdrop-blur-sm',
    badgeText: 'text-white',
    badgeBorder: 'border-white/25',
    iconColor: 'text-pink-200',
    accentGlow: 'from-pink-400/20 via-rose-300/15 to-transparent',
  },
  // 3. Tropical Turquoise (Toska Samudra & Cyan Segar)
  {
    name: 'Tropical Turquoise',
    gradientClass: 'from-cyan-700 via-teal-600 to-emerald-700',
    borderClass: 'border-cyan-400/50 shadow-cyan-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-cyan-100/90',
    badgeBg: 'bg-black/25 backdrop-blur-sm',
    badgeText: 'text-white',
    badgeBorder: 'border-white/25',
    iconColor: 'text-cyan-200',
    accentGlow: 'from-cyan-400/20 via-teal-300/15 to-transparent',
  },
  // 4. Golden Apricot (Kuning Emas & Jingga Hangat)
  {
    name: 'Golden Apricot',
    gradientClass: 'from-amber-600 via-orange-600 to-yellow-700',
    borderClass: 'border-amber-400/50 shadow-amber-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-amber-100/90',
    badgeBg: 'bg-black/25 backdrop-blur-sm',
    badgeText: 'text-white',
    badgeBorder: 'border-white/25',
    iconColor: 'text-yellow-200',
    accentGlow: 'from-amber-300/20 via-yellow-300/15 to-transparent',
  },
  // 5. Neon Magenta (Fusia Cerah & Lilac Dinamis)
  {
    name: 'Neon Magenta',
    gradientClass: 'from-fuchsia-700 via-pink-600 to-purple-800',
    borderClass: 'border-fuchsia-400/50 shadow-fuchsia-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-fuchsia-100/90',
    badgeBg: 'bg-black/25 backdrop-blur-sm',
    badgeText: 'text-white',
    badgeBorder: 'border-white/25',
    iconColor: 'text-fuchsia-200',
    accentGlow: 'from-fuchsia-400/20 via-pink-300/15 to-transparent',
  },
  // 6. Sapphire Ocean (Biru Safir & Azure Langit)
  {
    name: 'Sapphire Ocean',
    gradientClass: 'from-blue-700 via-sky-600 to-indigo-800',
    borderClass: 'border-sky-400/50 shadow-blue-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-sky-100/90',
    badgeBg: 'bg-black/25 backdrop-blur-sm',
    badgeText: 'text-white',
    badgeBorder: 'border-white/25',
    iconColor: 'text-sky-200',
    accentGlow: 'from-sky-400/20 via-blue-300/15 to-transparent',
  },
  // 7. Fresh Emerald (Hijau Zamrud & Mint Menyegarkan)
  {
    name: 'Fresh Emerald',
    gradientClass: 'from-emerald-700 via-teal-600 to-green-800',
    borderClass: 'border-emerald-400/50 shadow-emerald-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-emerald-100/90',
    badgeBg: 'bg-black/25 backdrop-blur-sm',
    badgeText: 'text-white',
    badgeBorder: 'border-white/25',
    iconColor: 'text-emerald-200',
    accentGlow: 'from-emerald-400/20 via-teal-300/15 to-transparent',
  },
  // 8. Flamingo Coral (Coral Pink & Oranye Manis)
  {
    name: 'Flamingo Coral',
    gradientClass: 'from-rose-600 via-orange-500 to-pink-700',
    borderClass: 'border-rose-400/50 shadow-rose-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-rose-100/90',
    badgeBg: 'bg-black/25 backdrop-blur-sm',
    badgeText: 'text-white',
    badgeBorder: 'border-white/25',
    iconColor: 'text-orange-200',
    accentGlow: 'from-rose-400/20 via-orange-300/15 to-transparent',
  },
  // 9. Electric Iris (Ungu Iris & Biru Safir Elektrik)
  {
    name: 'Electric Iris',
    gradientClass: 'from-indigo-700 via-purple-600 to-blue-800',
    borderClass: 'border-indigo-400/50 shadow-indigo-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-indigo-100/90',
    badgeBg: 'bg-black/25 backdrop-blur-sm',
    badgeText: 'text-white',
    badgeBorder: 'border-white/25',
    iconColor: 'text-indigo-200',
    accentGlow: 'from-indigo-400/20 via-purple-300/15 to-transparent',
  },
  // 10. Citrus Glow (Jingga Mandarin & Lemon Keemasan)
  {
    name: 'Citrus Glow',
    gradientClass: 'from-orange-600 via-amber-500 to-yellow-600',
    borderClass: 'border-amber-400/50 shadow-orange-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-amber-100/90',
    badgeBg: 'bg-black/25 backdrop-blur-sm',
    badgeText: 'text-white',
    badgeBorder: 'border-white/25',
    iconColor: 'text-yellow-200',
    accentGlow: 'from-amber-400/20 via-yellow-300/15 to-transparent',
  },
  // 11. Velvet Rose (Mawar Merah Cerah & Anggur Delima)
  {
    name: 'Velvet Rose',
    gradientClass: 'from-red-700 via-rose-600 to-pink-800',
    borderClass: 'border-red-400/50 shadow-red-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-red-100/90',
    badgeBg: 'bg-black/25 backdrop-blur-sm',
    badgeText: 'text-white',
    badgeBorder: 'border-white/25',
    iconColor: 'text-rose-200',
    accentGlow: 'from-red-400/20 via-rose-300/15 to-transparent',
  },
  // 12. Aqua Lagoon (Toska Samudra & Biru Laut Cerah)
  {
    name: 'Aqua Lagoon',
    gradientClass: 'from-teal-700 via-cyan-600 to-blue-800',
    borderClass: 'border-teal-400/50 shadow-teal-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-teal-100/90',
    badgeBg: 'bg-black/25 backdrop-blur-sm',
    badgeText: 'text-white',
    badgeBorder: 'border-white/25',
    iconColor: 'text-cyan-200',
    accentGlow: 'from-teal-400/20 via-cyan-300/15 to-transparent',
  },
  // 13. Sunset Aurora (Ungu Senja, Pink Fuchsia & Keemasan)
  {
    name: 'Sunset Aurora',
    gradientClass: 'from-purple-800 via-pink-600 to-amber-600',
    borderClass: 'border-pink-400/50 shadow-purple-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-pink-100/90',
    badgeBg: 'bg-black/25 backdrop-blur-sm',
    badgeText: 'text-white',
    badgeBorder: 'border-white/25',
    iconColor: 'text-amber-200',
    accentGlow: 'from-pink-400/20 via-amber-300/15 to-transparent',
  },
  // 14. Wild Orchid (Anggrek Ungu Cerah & Biru Spektrum)
  {
    name: 'Wild Orchid',
    gradientClass: 'from-violet-700 via-fuchsia-600 to-blue-800',
    borderClass: 'border-violet-400/50 shadow-violet-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-violet-100/90',
    badgeBg: 'bg-black/25 backdrop-blur-sm',
    badgeText: 'text-white',
    badgeBorder: 'border-white/25',
    iconColor: 'text-fuchsia-200',
    accentGlow: 'from-violet-400/20 via-fuchsia-300/15 to-transparent',
  },
  // 15. Deep Coral (Coral Jingga Cerah & Merah Delima)
  {
    name: 'Deep Coral',
    gradientClass: 'from-orange-700 via-rose-600 to-red-700',
    borderClass: 'border-orange-400/50 shadow-orange-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-orange-100/90',
    badgeBg: 'bg-black/25 backdrop-blur-sm',
    badgeText: 'text-white',
    badgeBorder: 'border-white/25',
    iconColor: 'text-orange-200',
    accentGlow: 'from-orange-400/20 via-rose-300/15 to-transparent',
  },
  // 16. Pacific Azure (Biru Pasifik Cerah & Toska Tropis)
  {
    name: 'Pacific Azure',
    gradientClass: 'from-sky-700 via-teal-600 to-indigo-800',
    borderClass: 'border-sky-400/50 shadow-sky-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-sky-100/90',
    badgeBg: 'bg-black/25 backdrop-blur-sm',
    badgeText: 'text-white',
    badgeBorder: 'border-white/25',
    iconColor: 'text-teal-200',
    accentGlow: 'from-sky-400/20 via-teal-300/15 to-transparent',
  },
  // 17. Mulberry Violet (Ungu Mulberry & Fusia Hangat)
  {
    name: 'Mulberry Violet',
    gradientClass: 'from-purple-800 via-pink-700 to-indigo-900',
    borderClass: 'border-purple-400/50 shadow-purple-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-purple-100/90',
    badgeBg: 'bg-black/25 backdrop-blur-sm',
    badgeText: 'text-white',
    badgeBorder: 'border-white/25',
    iconColor: 'text-pink-200',
    accentGlow: 'from-purple-400/20 via-pink-300/15 to-transparent',
  },
];

// Fallback compatibility alias
export const TWO_HOUR_THEMES: TwoHourTheme[] = VIBRANT_THEMES.map((t, idx) => ({
  ...t,
  timeSlot: `${String(idx * 2).padStart(2, '0')}:00 - ${String((idx * 2 + 2) % 24).padStart(2, '0')}:00`,
}));

/**
 * Menghitung indeks slot 10 menit saat ini dalam 24 jam (0 s.d 143)
 */
export function getTenMinuteSlotIndex(date = new Date()): number {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return Math.floor((hours * 60 + minutes) / 10);
}

/**
 * Format string rentang 10 menit (misal: "14:00 - 14:10", "14:10 - 14:20")
 */
export function formatTenMinuteSlot(date = new Date()): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const startMin = Math.floor(minutes / 10) * 10;
  const startH = hours;
  let endMin = startMin + 10;
  let endH = startH;
  if (endMin === 60) {
    endMin = 0;
    endH = (startH + 1) % 24;
  }
  const sH = String(startH).padStart(2, '0');
  const sM = String(startMin).padStart(2, '0');
  const eH = String(endH).padStart(2, '0');
  const eM = String(endMin).padStart(2, '0');
  return `${sH}:${sM} - ${eH}:${eM}`;
}

/**
 * Mendapatkan indeks tema berdasarkan rotasi 10 menit sekali
 */
export function getTwoHourThemeIndex(date = new Date()): number {
  const slot = getTenMinuteSlotIndex(date);
  return slot % VIBRANT_THEMES.length;
}

/**
 * Mendapatkan tema gradien cerah aktif saat ini (berganti otomatis setiap 10 menit)
 */
export function getCurrentTwoHourTheme(date = new Date()): TwoHourTheme {
  const idx = getTwoHourThemeIndex(date);
  const base = VIBRANT_THEMES[idx] || VIBRANT_THEMES[0];
  return {
    ...base,
    timeSlot: formatTenMinuteSlot(date),
  };
}
