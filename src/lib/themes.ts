export type ThemeId =
  | 'pure-white'
  | 'classic-moo'
  | 'sunset-glow'
  | 'forest-green'
  | 'ocean-breeze'
  | 'blush-pink'
  | 'golden-hour'
  | 'lavender-haze'
  | 'amoled'
  | 'crimson'
  | 'emerald'
  | 'sapphire'
  | 'violet'
  | 'amber'
  | 'rose'
  | 'teal'
  | 'indigo'
  | 'midnight'
  | 'nature-forest'
  | 'nature-alps'
  | 'nature-sunset'
  | 'nature-aurora'
  | 'nature-tropic'
  | 'nature-jungle'
  | 'nature-dunes'
  | 'nature-waves';

export type Theme = {
  id: ThemeId;
  name: string;
  bg: string;
  card: string;
  cardBg?: string;
  backdropFilter?: string;
  text: string;
  sub: string;
  accent: string;
  accentText: string;
  border: string;
  shadow?: string;
  photoBy?: string;
  platform?: string;
  photoUrl?: string;
};

export const THEMES: Record<ThemeId, Theme> = {
  // ── LIGHT & SOFT GRADIENTS (8) ──
  'pure-white': {
    id: 'pure-white',
    name: 'Pure White',
    bg: '#FFFFFF',
    card: '#FFFFFF',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    text: '#0F172A',
    sub: '#64748B',
    accent: '#0F172A',
    accentText: '#FFFFFF',
    border: 'rgba(226, 232, 240, 0.8)',
    shadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
  },
  'classic-moo': {
    id: 'classic-moo',
    name: 'Classic Moo',
    bg: 'linear-gradient(135deg, #FFFDF7 0%, #F5EFE6 100%)',
    card: '#FFFFFF',
    cardBg: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(8px)',
    text: '#2D2A26',
    sub: '#7A756D',
    accent: '#D97706',
    accentText: '#FFFFFF',
    border: 'rgba(229, 224, 213, 0.8)',
    shadow: '0 4px 20px -2px rgba(139, 105, 20, 0.08)',
  },
  'sunset-glow': {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    bg: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 50%, #FED7AA 100%)',
    card: '#FFFFFF',
    cardBg: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(8px)',
    text: '#431407',
    sub: '#9A3412',
    accent: '#EA580C',
    accentText: '#FFFFFF',
    border: 'rgba(254, 215, 170, 0.8)',
    shadow: '0 4px 20px -2px rgba(234, 88, 12, 0.1)',
  },
  'forest-green': {
    id: 'forest-green',
    name: 'Forest',
    bg: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #BBF7D0 100%)',
    card: '#FFFFFF',
    cardBg: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(8px)',
    text: '#052E16',
    sub: '#166534',
    accent: '#15803D',
    accentText: '#FFFFFF',
    border: 'rgba(187, 247, 208, 0.8)',
    shadow: '0 4px 20px -2px rgba(22, 163, 74, 0.1)',
  },
  'ocean-breeze': {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    bg: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 50%, #BAE6FD 100%)',
    card: '#FFFFFF',
    cardBg: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(8px)',
    text: '#0C4A6E',
    sub: '#0369A1',
    accent: '#0284C7',
    accentText: '#FFFFFF',
    border: 'rgba(186, 230, 253, 0.8)',
    shadow: '0 4px 20px -2px rgba(14, 165, 233, 0.1)',
  },
  'blush-pink': {
    id: 'blush-pink',
    name: 'Blush Pink',
    bg: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 50%, #FECDD3 100%)',
    card: '#FFFFFF',
    cardBg: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(8px)',
    text: '#4C0519',
    sub: '#BE123C',
    accent: '#E11D48',
    accentText: '#FFFFFF',
    border: 'rgba(254, 205, 211, 0.8)',
    shadow: '0 4px 20px -2px rgba(225, 29, 72, 0.1)',
  },
  'golden-hour': {
    id: 'golden-hour',
    name: 'Golden Hour',
    bg: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)',
    card: '#FFFFFF',
    cardBg: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(8px)',
    text: '#451A03',
    sub: '#92400E',
    accent: '#D97706',
    accentText: '#FFFFFF',
    border: 'rgba(253, 230, 138, 0.8)',
    shadow: '0 4px 20px -2px rgba(217, 119, 6, 0.1)',
  },
  'lavender-haze': {
    id: 'lavender-haze',
    name: 'Lavender',
    bg: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 50%, #E9D5FF 100%)',
    card: '#FFFFFF',
    cardBg: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(8px)',
    text: '#3B0764',
    sub: '#7E22CE',
    accent: '#9333EA',
    accentText: '#FFFFFF',
    border: 'rgba(233, 213, 255, 0.8)',
    shadow: '0 4px 20px -2px rgba(147, 51, 234, 0.1)',
  },

  // ── DARK & GLASS CYBER THEMES (10) ──
  amoled: {
    id: 'amoled',
    name: 'Amoled Black',
    bg: '#000000',
    card: '#121212',
    cardBg: '#121212',
    text: '#FFFFFF',
    sub: '#A1A1AA',
    accent: '#27272A',
    accentText: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.12)',
    shadow: '0 4px 25px rgba(0, 0, 0, 0.8)',
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Luxe',
    bg: 'linear-gradient(135deg, #1F0707 0%, #3B0A0A 50%, #1A0505 100%)',
    card: 'rgba(239, 68, 68, 0.08)',
    cardBg: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(12px)',
    text: '#FEE2E2',
    sub: '#FCA5A5',
    accent: '#EF4444',
    accentText: '#FFFFFF',
    border: 'rgba(239, 68, 68, 0.25)',
    shadow: '0 8px 32px 0 rgba(239, 68, 68, 0.15)',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Glass',
    bg: 'linear-gradient(135deg, #021C15 0%, #064E3B 50%, #022C22 100%)',
    card: 'rgba(52, 211, 153, 0.08)',
    cardBg: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(12px)',
    text: '#ECFDF5',
    sub: '#6EE7B7',
    accent: '#10B981',
    accentText: '#FFFFFF',
    border: 'rgba(52, 211, 153, 0.25)',
    shadow: '0 8px 32px 0 rgba(16, 185, 129, 0.15)',
  },
  sapphire: {
    id: 'sapphire',
    name: 'Sapphire Night',
    bg: 'linear-gradient(135deg, #0A1128 0%, #101F42 50%, #080D1E 100%)',
    card: 'rgba(59, 130, 246, 0.08)',
    cardBg: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(12px)',
    text: '#EFF6FF',
    sub: '#93C5FD',
    accent: '#3B82F6',
    accentText: '#FFFFFF',
    border: 'rgba(59, 130, 246, 0.25)',
    shadow: '0 8px 32px 0 rgba(59, 130, 246, 0.15)',
  },
  violet: {
    id: 'violet',
    name: 'Cyber Violet',
    bg: 'linear-gradient(135deg, #17092C 0%, #3B0764 50%, #1E0A38 100%)',
    card: 'rgba(168, 85, 247, 0.08)',
    cardBg: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(12px)',
    text: '#F3E8FF',
    sub: '#C4B5FD',
    accent: '#A855F7',
    accentText: '#FFFFFF',
    border: 'rgba(168, 85, 247, 0.25)',
    shadow: '0 8px 32px 0 rgba(168, 85, 247, 0.2)',
  },
  amber: {
    id: 'amber',
    name: 'Neon Cyber',
    bg: 'linear-gradient(135deg, #080E1A 0%, #0F172A 50%, #040812 100%)',
    card: 'rgba(6, 182, 212, 0.08)',
    cardBg: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(12px)',
    text: '#ECFEFF',
    sub: '#67E8F9',
    accent: '#06B6D4',
    accentText: '#FFFFFF',
    border: 'rgba(6, 182, 212, 0.25)',
    shadow: '0 8px 32px 0 rgba(6, 182, 212, 0.2)',
  },
  rose: {
    id: 'rose',
    name: 'Sky Blue',
    bg: 'linear-gradient(135deg, #031B2E 0%, #07365D 50%, #021220 100%)',
    card: 'rgba(14, 165, 233, 0.08)',
    cardBg: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(12px)',
    text: '#E0F2FE',
    sub: '#7DD3FC',
    accent: '#0EA5E9',
    accentText: '#FFFFFF',
    border: 'rgba(14, 165, 233, 0.25)',
    shadow: '0 8px 32px 0 rgba(14, 165, 233, 0.18)',
  },
  teal: {
    id: 'teal',
    name: 'Nordic Teal',
    bg: 'linear-gradient(135deg, #021E1E 0%, #042F2E 50%, #022323 100%)',
    card: 'rgba(20, 184, 166, 0.08)',
    cardBg: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(12px)',
    text: '#CCFBF1',
    sub: '#5EEAD4',
    accent: '#14B8A6',
    accentText: '#FFFFFF',
    border: 'rgba(20, 184, 166, 0.25)',
    shadow: '0 8px 32px 0 rgba(20, 184, 166, 0.15)',
  },
  indigo: {
    id: 'indigo',
    name: 'Deep Indigo',
    bg: 'linear-gradient(135deg, #0F0E26 0%, #1E1B4B 50%, #131133 100%)',
    card: 'rgba(99, 102, 241, 0.08)',
    cardBg: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(12px)',
    text: '#E0E7FF',
    sub: '#A5B4FC',
    accent: '#6366F1',
    accentText: '#FFFFFF',
    border: 'rgba(99, 102, 241, 0.25)',
    shadow: '0 8px 32px 0 rgba(99, 102, 241, 0.18)',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Slate',
    bg: 'linear-gradient(135deg, #0B0F19 0%, #1E293B 50%, #0F172A 100%)',
    card: 'rgba(255, 255, 255, 0.04)',
    cardBg: 'rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(12px)',
    text: '#F8FAFC',
    sub: '#94A3B8',
    accent: '#38BDF8',
    accentText: '#0F172A',
    border: 'rgba(255, 255, 255, 0.1)',
    shadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  },

  // ── 🌲 UNSPLASH HD NATURE WALLPAPERS (8) ──
  'nature-forest': {
    id: 'nature-forest',
    name: '🌲 Misty Forest',
    bg: 'url("https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1080&q=80")',
    card: 'rgba(0, 0, 0, 0.45)',
    cardBg: 'rgba(0, 0, 0, 0.55)',
    backdropFilter: 'blur(14px)',
    text: '#FFFFFF',
    sub: '#E2E8F0',
    accent: '#10B981',
    accentText: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.2)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  },
  'nature-alps': {
    id: 'nature-alps',
    name: '🏔️ Swiss Alps',
    bg: 'url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=80")',
    card: 'rgba(15, 23, 42, 0.45)',
    cardBg: 'rgba(15, 23, 42, 0.55)',
    backdropFilter: 'blur(14px)',
    text: '#FFFFFF',
    sub: '#CBD5E1',
    accent: '#38BDF8',
    accentText: '#0F172A',
    border: 'rgba(255, 255, 255, 0.22)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    photoBy: 'Kalvis Alberts',
    platform: 'Unsplash',
    photoUrl: 'https://unsplash.com/photos/1464822759023-fed622ff2c3b',
  },
  'nature-sunset': {
    id: 'nature-sunset',
    name: '🌅 Ocean Sunset',
    bg: 'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80")',
    card: 'rgba(30, 15, 5, 0.45)',
    cardBg: 'rgba(30, 15, 5, 0.55)',
    backdropFilter: 'blur(14px)',
    text: '#FFFFFF',
    sub: '#FDE68A',
    accent: '#F59E0B',
    accentText: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.25)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    photoBy: 'Sean Oulashin',
    platform: 'Unsplash',
    photoUrl: 'https://unsplash.com/photos/1507525428034-b723cf961d3e',
  },
  'nature-aurora': {
    id: 'nature-aurora',
    name: '🌌 Northern Lights',
    bg: 'url("https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1080&q=80")',
    card: 'rgba(5, 20, 20, 0.5)',
    cardBg: 'rgba(5, 20, 20, 0.6)',
    backdropFilter: 'blur(16px)',
    text: '#FFFFFF',
    sub: '#A7F3D0',
    accent: '#34D399',
    accentText: '#064E3B',
    border: 'rgba(52, 211, 153, 0.3)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
    photoBy: 'Vincent Guth',
    platform: 'Unsplash',
    photoUrl: 'https://unsplash.com/photos/1531366936337-7c912a4589a7',
  },
  'nature-tropic': {
    id: 'nature-tropic',
    name: '🏝️ Tropical Beach',
    bg: 'url("https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1080&q=80")',
    card: 'rgba(0, 25, 40, 0.45)',
    cardBg: 'rgba(0, 25, 40, 0.55)',
    backdropFilter: 'blur(14px)',
    text: '#FFFFFF',
    sub: '#BAE6FD',
    accent: '#0EA5E9',
    accentText: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.25)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
    photoBy: 'Margaux Bellott',
    platform: 'Unsplash',
    photoUrl: 'https://unsplash.com/photos/1506929562872-bb421503ef21',
  },
  'nature-jungle': {
    id: 'nature-jungle',
    name: '🌧️ Deep Jungle',
    bg: 'url("https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1080&q=80")',
    card: 'rgba(10, 25, 15, 0.5)',
    cardBg: 'rgba(10, 25, 15, 0.6)',
    backdropFilter: 'blur(14px)',
    text: '#FFFFFF',
    sub: '#BBF7D0',
    accent: '#22C55E',
    accentText: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.2)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.55)',
    photoBy: 'Sebastian Unrau',
    platform: 'Unsplash',
    photoUrl: 'https://unsplash.com/photos/1448375240586-882707db888b',
  },
  'nature-dunes': {
    id: 'nature-dunes',
    name: '🏜️ Desert Dunes',
    bg: 'url("https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1080&q=80")',
    card: 'rgba(40, 20, 5, 0.45)',
    cardBg: 'rgba(40, 20, 5, 0.55)',
    backdropFilter: 'blur(14px)',
    text: '#FFFFFF',
    sub: '#FED7AA',
    accent: '#D97706',
    accentText: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.25)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
    photoBy: 'Keith Hardy',
    platform: 'Unsplash',
    photoUrl: 'https://unsplash.com/photos/1509316975850-ff9c5deb0cd9',
  },
  'nature-waves': {
    id: 'nature-waves',
    name: '🌊 Pacific Waves',
    bg: 'url("https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1080&q=80")',
    card: 'rgba(10, 20, 35, 0.5)',
    cardBg: 'rgba(10, 20, 35, 0.6)',
    backdropFilter: 'blur(14px)',
    text: '#FFFFFF',
    sub: '#93C5FD',
    accent: '#2563EB',
    accentText: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.22)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    photoBy: 'Christoffer Engström',
    platform: 'Unsplash',
    photoUrl: 'https://unsplash.com/photos/1505118380757-91f5f5632de0',
  },
};

export function formatImageUrl(urlStr: string): string {
  if (!urlStr) return '';
  let cleaned = urlStr.trim().replace(/^url\(["']?|["']?\)$/g, '');

  // Convert Unsplash photo web pages to direct image URLs
  // e.g. https://unsplash.com/photos/landscape-photography-of-mountains-WLUHO9A_xik
  // or https://unsplash.com/photos/WLUHO9A_xik
  if (cleaned.includes('unsplash.com/photos/')) {
    const rawPath = cleaned.split('/photos/')[1]?.split('?')[0]?.split('#')[0] || '';
    const slug = rawPath.split('/')[0] || '';
    const photoId = slug.includes('-') ? slug.split('-').pop() : slug;
    if (photoId) {
      return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1080&q=80`;
    }
  }

  // Ensure optimized query parameters for images.unsplash.com
  if (cleaned.includes('images.unsplash.com') && !cleaned.includes('w=')) {
    cleaned += (cleaned.includes('?') ? '&' : '?') + 'auto=format&fit=crop&w=1080&q=80';
  }

  return cleaned;
}

export function getTheme(themeIdOrUrl: string | null | undefined): Theme {
  if (!themeIdOrUrl) return THEMES['classic-moo'];
  if (THEMES[themeIdOrUrl as ThemeId]) return THEMES[themeIdOrUrl as ThemeId];
  
  const formatted = formatImageUrl(themeIdOrUrl);
  if (
    formatted.startsWith('http://') ||
    formatted.startsWith('https://') ||
    formatted.startsWith('url(') ||
    formatted.includes('unsplash.com') ||
    formatted.includes('pexels.com') ||
    /\.(jpg|jpeg|png|webp|avif|gif)/i.test(formatted)
  ) {
    const bgUrl = formatted.startsWith('url(') ? formatted : `url("${formatted}")`;
    return {
      id: 'classic-moo',
      name: 'Custom Wallpaper',
      bg: bgUrl,
      card: 'rgba(0, 0, 0, 0.45)',
      cardBg: 'rgba(0, 0, 0, 0.55)',
      backdropFilter: 'blur(14px)',
      text: '#FFFFFF',
      sub: '#E2E8F0',
      accent: '#D97706',
      accentText: '#FFFFFF',
      border: 'rgba(255, 255, 255, 0.22)',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    };
  }
  return THEMES['classic-moo'];
}

