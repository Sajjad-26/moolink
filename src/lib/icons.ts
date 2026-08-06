import { SOCIAL_ICONS } from './social-icons';

const ICON_MAP: Record<string, string> = {
  link: '🔗',
  github: '🐙',
  twitter: '🐦',
  youtube: '▶️',
  instagram: '📸',
  linkedin: '💼',
  tikok: '🎵',
  tiktok: '🎵',
  email: '📧',
  website: '🌐',
  discord: '💬',
  twitch: '🎮',
  spotify: '🎵',
  playstore: '🎮',
  appstore: '🍎',
  telegram: '✈️',
  whatsapp: '💬',
  facebook: '👍',
  reddit: '🤖',
  threads: '🧵',
  patreon: '🅿️',
  substack: '📰',
  podcast: '🎙️',
  newsletter: '📰',
  store: '🛒',
  other: '📍',
};

export function getIcon(key: string): string {
  return ICON_MAP[key] || ICON_MAP.link;
}

export function getIconKeys(): string[] {
  return Object.keys(ICON_MAP);
}

export function getSocialIcon(key: string): string | null {
  return SOCIAL_ICONS[key]?.svg || null;
}

export function getSocialConfig(key: string) {
  return SOCIAL_ICONS[key] || null;
}
