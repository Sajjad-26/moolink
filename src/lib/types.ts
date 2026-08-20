export type Profile = {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  theme: string;
  is_pro: boolean;
  dodo_subscription_id: string | null;
  subscription_status: string | null;
  is_affiliate: boolean;
  is_admin: boolean;
  commission_rate: number | null;
  created_at: string;
};

export type Link = {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  icon: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
};

export type ClickEvent = {
  id: string;
  link_id: string;
  profile_id: string;
  country: string | null;
  device_type: string | null;
  created_at: string;
};

export type LinkWithClicks = Link & {
  click_count: number;
};

// ── Affiliate commissions ──────────────────────────────────────────────

export type CommissionPeriod = {
  id: string;
  period: string; // 'YYYY-MM'
  revenue_proceeds: number;
  revenue_gross: number;
  currency: string;
  commission_rate: number;
  total_pool: number;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
};

export type AffiliateEntry = {
  profileId: string;
  username: string;
  displayName: string;
  isSelf: boolean;
  clicks: number;
  commission: number;
  rate: number; // the creator's admin-set rate (0 if unset)
  sales: number; // attributed sales count (true attribution)
  saleRevenue: number; // total proceeds from attributed sales
};

/** A single attributed sale (first-time subscribers only) shown on the creator's
 * transactions list. Currency is the sale's actual currency (e.g. INR / USD). */
export type MyTransaction = {
  id: string;
  event_type: 'INITIAL_PURCHASE' | 'NON_RENEWING_PURCHASE';
  price: number;           // sale price in `currency`
  currency: string;        // e.g. 'INR', 'USD'
  proceeds: number;        // net proceeds (after store tax/fees)
  commission: number;      // creator's cut = proceeds × 30%
  purchased_at: string;    // ISO
  ref: string | null;      // the creator's username that was stamped
};

export type CommissionData = {
  period: string;
  revenue: { proceeds: number; gross: number; currency: string } | null;
  pool: number;
  rate: number;
  myRate: number;
  isPaid: boolean;
  affiliates: AffiliateEntry[];
  myClicks: number;
  myCommission: number;
  isAffiliate: boolean;
  isAdmin: boolean;
  // Attribution mode: 'sales' when true per-sale data exists, 'clicks' (estimate) otherwise
  attributionMode: 'sales' | 'clicks';
};
