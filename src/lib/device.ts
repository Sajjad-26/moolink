export function detectOS(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) return 'iOS';
  if (/android/.test(ua)) return 'Android';
  if (/macintosh|mac os x/.test(ua)) return 'macOS';
  if (/windows nt|win(dows)?/.test(ua)) return 'Windows';
  if (/linux/.test(ua) && !/android/.test(ua)) return 'Linux';
  if (/cros/.test(ua)) return 'ChromeOS';

  return 'Other';
}
