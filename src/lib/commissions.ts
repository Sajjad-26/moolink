// Pure commission math — no I/O so it stays easy to reason about and test.

export const DEFAULT_COMMISSION_RATE = 0.3;
export const MAX_COMMISSION_RATE = 0.3;

export type CommissionRow = {
  profileId: string;
  clicks: number;
  commission: number; // rounded to 2 decimals
  rate: number; // the creator's rate used for this share
};

export type CommissionResult = {
  rows: CommissionRow[];
  totalCommission: number;
};

/**
 * Compute each affiliate's commission as:
 *
 *   share_i = rate_i * proceeds * (clicks_i / totalClicks)
 *
 * where rate_i is the admin-set per-creator rate (0–0.35). Affiliates with no
 * clicks or rate 0 are excluded. Each share is rounded independently, so the
 * total is at most the sum of the rates' share of proceeds — payouts can never
 * exceed 35% of proceeds.
 */
export function computeCommissionByRate(
  proceeds: number,
  clicksByProfile: Record<string, number>,
  rateByProfile: Record<string, number>
): CommissionResult {
  const entries = Object.entries(clicksByProfile).filter(([, clicks]) => clicks > 0);
  const totalClicks = entries.reduce((sum, [, clicks]) => sum + clicks, 0);

  if (totalClicks === 0 || proceeds <= 0) {
    return {
      rows: entries.map(([profileId, clicks]) => ({
        profileId,
        clicks,
        commission: 0,
        rate: rateByProfile[profileId] ?? 0,
      })),
      totalCommission: 0,
    };
  }

  const rows: CommissionRow[] = entries
    .map(([profileId, clicks]) => {
      const rate = rateByProfile[profileId] ?? 0;
      const commission = rate > 0 ? round2(rate * proceeds * (clicks / totalClicks)) : 0;
      return { profileId, clicks, commission, rate };
    })
    .filter(r => r.commission > 0);

  return {
    rows,
    totalCommission: round2(rows.reduce((acc, r) => acc + r.commission, 0)),
  };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** UTC bounds of a 'YYYY-MM' month, as ISO strings. */
export function getMonthBounds(period: string): { startIso: string; endIso: string } {
  const [year, month] = period.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

/** The previous month as 'YYYY-MM' (UTC). */
export function previousMonth(now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Current month as 'YYYY-MM' (UTC). */
export function currentMonth(now: Date = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Last N months (including the current one) as 'YYYY-MM', oldest first. */
export function lastNMonths(n: number, now: Date = new Date()): string[] {
  const months: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

export function formatMoney(n: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

/** Format a rate (0.35) as a percentage string ('35%'). */
export function formatPercent(rate: number | null | undefined): string {
  if (rate == null) return '—';
  return `${Math.round(rate * 100)}%`;
}
