/**
 * Palet warna gradien 2 jam sekali (12 slot waktu per 24 jam).
 * Menyesuaikan waktu lokal dan berganti otomatis setiap 2 jam sekali dengan
 * transisi halus, tipografi kontras tinggi, dan efek visual yang indah.
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

export const TWO_HOUR_THEMES: TwoHourTheme[] = [
  // Slot 0: 00:00 - 01:59 (Tengah Malam - Deep Cosmic Indigo)
  {
    timeSlot: '00:00 - 02:00',
    name: 'Cosmic Midnight',
    gradientClass: 'from-slate-950 via-indigo-950 to-slate-900',
    borderClass: 'border-indigo-800/60 shadow-indigo-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-indigo-200/80',
    badgeBg: 'bg-indigo-900/80',
    badgeText: 'text-indigo-200',
    badgeBorder: 'border-indigo-700/60',
    iconColor: 'text-indigo-300',
    accentGlow: 'from-indigo-500/10 via-purple-500/10 to-transparent',
  },
  // Slot 1: 02:00 - 03:59 (Dini Hari - Deep Violet & Sapphire)
  {
    timeSlot: '02:00 - 04:00',
    name: 'Mystic Night',
    gradientClass: 'from-slate-950 via-purple-950 to-slate-900',
    borderClass: 'border-purple-800/60 shadow-purple-950/40',
    titleColor: 'text-white',
    subtitleColor: 'text-purple-200/80',
    badgeBg: 'bg-purple-900/80',
    badgeText: 'text-purple-200',
    badgeBorder: 'border-purple-700/60',
    iconColor: 'text-purple-300',
    accentGlow: 'from-purple-500/10 via-fuchsia-500/10 to-transparent',
  },
  // Slot 2: 04:00 - 05:59 (Subuh / Fajar - Dawn Rose & Amber)
  {
    timeSlot: '04:00 - 06:00',
    name: 'Golden Dawn',
    gradientClass: 'from-indigo-950 via-slate-900 to-rose-950',
    borderClass: 'border-rose-800/50 shadow-rose-950/30',
    titleColor: 'text-white',
    subtitleColor: 'text-rose-200/80',
    badgeBg: 'bg-rose-900/70',
    badgeText: 'text-rose-200',
    badgeBorder: 'border-rose-700/60',
    iconColor: 'text-amber-300',
    accentGlow: 'from-rose-500/15 via-amber-500/10 to-transparent',
  },
  // Slot 3: 06:00 - 07:59 (Pagi Awal - Fresh Emerald & Teal Sunrise)
  {
    timeSlot: '06:00 - 08:00',
    name: 'Fresh Morning',
    gradientClass: 'from-emerald-950 via-teal-950 to-slate-900',
    borderClass: 'border-emerald-800/60 shadow-emerald-950/30',
    titleColor: 'text-white',
    subtitleColor: 'text-emerald-200/80',
    badgeBg: 'bg-emerald-900/80',
    badgeText: 'text-emerald-200',
    badgeBorder: 'border-emerald-700/60',
    iconColor: 'text-emerald-300',
    accentGlow: 'from-emerald-500/15 via-teal-500/10 to-transparent',
  },
  // Slot 4: 08:00 - 09:59 (Pagi Cerah - Vibrant Azure & Cyan)
  {
    timeSlot: '08:00 - 10:00',
    name: 'Sky Azure',
    gradientClass: 'from-blue-950 via-sky-950 to-slate-900',
    borderClass: 'border-sky-800/60 shadow-sky-950/30',
    titleColor: 'text-white',
    subtitleColor: 'text-sky-200/80',
    badgeBg: 'bg-sky-900/80',
    badgeText: 'text-sky-200',
    badgeBorder: 'border-sky-700/60',
    iconColor: 'text-sky-300',
    accentGlow: 'from-sky-500/15 via-blue-500/10 to-transparent',
  },
  // Slot 5: 10:00 - 11:59 (Menjelang Siang - Ocean Cobalt & Sapphire)
  {
    timeSlot: '10:00 - 12:00',
    name: 'Ocean Cobalt',
    gradientClass: 'from-cyan-950 via-blue-950 to-slate-900',
    borderClass: 'border-blue-800/60 shadow-blue-950/30',
    titleColor: 'text-white',
    subtitleColor: 'text-cyan-200/80',
    badgeBg: 'bg-blue-900/80',
    badgeText: 'text-cyan-200',
    badgeBorder: 'border-cyan-700/60',
    iconColor: 'text-cyan-300',
    accentGlow: 'from-cyan-500/15 via-blue-500/10 to-transparent',
  },
  // Slot 6: 12:00 - 13:59 (Siang Terik - Solar Amber & Radiant Gold)
  {
    timeSlot: '12:00 - 14:00',
    name: 'Solar Amber',
    gradientClass: 'from-amber-950 via-slate-900 to-yellow-950',
    borderClass: 'border-amber-700/60 shadow-amber-950/30',
    titleColor: 'text-white',
    subtitleColor: 'text-amber-200/80',
    badgeBg: 'bg-amber-900/80',
    badgeText: 'text-amber-200',
    badgeBorder: 'border-amber-600/60',
    iconColor: 'text-amber-300',
    accentGlow: 'from-amber-500/15 via-yellow-500/10 to-transparent',
  },
  // Slot 7: 14:00 - 15:59 (Siang Menuju Sore - Copper Coral & Tangerine)
  {
    timeSlot: '14:00 - 16:00',
    name: 'Coral Sunset',
    gradientClass: 'from-orange-950 via-slate-900 to-amber-950',
    borderClass: 'border-orange-800/60 shadow-orange-950/30',
    titleColor: 'text-white',
    subtitleColor: 'text-orange-200/80',
    badgeBg: 'bg-orange-900/80',
    badgeText: 'text-orange-200',
    badgeBorder: 'border-orange-700/60',
    iconColor: 'text-orange-300',
    accentGlow: 'from-orange-500/15 via-amber-500/10 to-transparent',
  },
  // Slot 8: 16:00 - 17:59 (Sore Senja - Crimson Rose & Sunset Glow)
  {
    timeSlot: '16:00 - 18:00',
    name: 'Crimson Twilight',
    gradientClass: 'from-rose-950 via-slate-900 to-purple-950',
    borderClass: 'border-rose-800/60 shadow-rose-950/30',
    titleColor: 'text-white',
    subtitleColor: 'text-rose-200/80',
    badgeBg: 'bg-rose-900/80',
    badgeText: 'text-rose-200',
    badgeBorder: 'border-rose-700/60',
    iconColor: 'text-rose-300',
    accentGlow: 'from-rose-500/15 via-pink-500/10 to-transparent',
  },
  // Slot 9: 18:00 - 19:59 (Maghrib / Awal Malam - Magenta Twilight)
  {
    timeSlot: '18:00 - 20:00',
    name: 'Magenta Dusk',
    gradientClass: 'from-fuchsia-950 via-purple-950 to-slate-950',
    borderClass: 'border-fuchsia-800/60 shadow-fuchsia-950/30',
    titleColor: 'text-white',
    subtitleColor: 'text-fuchsia-200/80',
    badgeBg: 'bg-fuchsia-900/80',
    badgeText: 'text-fuchsia-200',
    badgeBorder: 'border-fuchsia-700/60',
    iconColor: 'text-fuchsia-300',
    accentGlow: 'from-fuchsia-500/15 via-purple-500/10 to-transparent',
  },
  // Slot 10: 20:00 - 21:59 (Malam Isya - Velvet Royal Purple)
  {
    timeSlot: '20:00 - 22:00',
    name: 'Velvet Royal',
    gradientClass: 'from-violet-950 via-indigo-950 to-slate-950',
    borderClass: 'border-violet-800/60 shadow-violet-950/30',
    titleColor: 'text-white',
    subtitleColor: 'text-violet-200/80',
    badgeBg: 'bg-violet-900/80',
    badgeText: 'text-violet-200',
    badgeBorder: 'border-violet-700/60',
    iconColor: 'text-violet-300',
    accentGlow: 'from-violet-500/15 via-indigo-500/10 to-transparent',
  },
  // Slot 11: 22:00 - 23:59 (Malam Larut Menjelang Tengah Malam - Deep Obsidian & Emerald Teal)
  {
    timeSlot: '22:00 - 24:00',
    name: 'Obsidian Night',
    gradientClass: 'from-slate-950 via-teal-950 to-slate-900',
    borderClass: 'border-teal-800/60 shadow-teal-950/30',
    titleColor: 'text-white',
    subtitleColor: 'text-teal-200/80',
    badgeBg: 'bg-teal-900/80',
    badgeText: 'text-teal-200',
    badgeBorder: 'border-teal-700/60',
    iconColor: 'text-teal-300',
    accentGlow: 'from-teal-500/15 via-emerald-500/10 to-transparent',
  },
];

/**
 * Mendapatkan indeks tema berdasarkan jam sekarang (berganti setiap 2 jam sekali)
 */
export function getTwoHourThemeIndex(date = new Date()): number {
  const hour = date.getHours();
  return Math.floor(hour / 2) % 12;
}

/**
 * Mendapatkan tema gradien aktif saat ini
 */
export function getCurrentTwoHourTheme(date = new Date()): TwoHourTheme {
  const idx = getTwoHourThemeIndex(date);
  return TWO_HOUR_THEMES[idx] || TWO_HOUR_THEMES[0];
}
