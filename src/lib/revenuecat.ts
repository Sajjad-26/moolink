// RevenueCat v2 API client — used server-side only (secret key must never reach the client).

const REVENUECAT_API_BASE = 'https://api.revenuecat.com/v2';

export type RevenueCatRevenue = {
  proceeds: number; // net of taxes and store commission — what the developer keeps
  gross: number; // total charged to customers before fees/taxes
  currency: string;
};

function lastDayOfMonth(period: string): number {
  const [year, month] = period.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Fetch gross revenue and proceeds (net of taxes + store commission) for a
 * calendar month, e.g. period = '2026-07'.
 * Returns null on any failure so callers can degrade gracefully.
 */
export async function fetchMonthlyRevenue(period: string): Promise<RevenueCatRevenue | null> {
  const apiKey = process.env.REVENUECAT_API_KEY;
  const projectId = process.env.REVENUECAT_PROJECT_ID;
  if (!apiKey || !projectId) return null;

  const startDate = `${period}-01`;
  const endDate = `${period}-${String(lastDayOfMonth(period)).padStart(2, '0')}`;
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });

  try {
    const [proceedsRes, grossRes] = await Promise.all([
      fetch(`${REVENUECAT_API_BASE}/projects/${projectId}/metrics/revenue?${params}&revenue_type=proceeds`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
      }),
      fetch(`${REVENUECAT_API_BASE}/projects/${projectId}/metrics/revenue?${params}&revenue_type=revenue`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
      }),
    ]);

    if (!proceedsRes.ok || !grossRes.ok) return null;

    const proceedsJson = await proceedsRes.json();
    const grossJson = await grossRes.json();

    return {
      proceeds: typeof proceedsJson.value === 'number' ? proceedsJson.value : 0,
      gross: typeof grossJson.value === 'number' ? grossJson.value : 0,
      currency: proceedsJson.currency || grossJson.currency || 'USD',
    };
  } catch {
    return null;
  }
}
