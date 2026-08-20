interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RESEND_API_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
}

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  is_pro: boolean;
  subscription_status: string | null;
  created_at: string;
}

interface AuthUser {
  id: string;
  email: string;
}

async function sendEmail(to: string, subject: string, html: string, env: Env) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'MooLink <hello@moolink.xyz>',
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error: ${res.status} ${err}`);
  }
  return res.json();
}

function trialExpiringEmail(displayName: string, username: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#FFF8F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;margin-bottom:8px;">🐮</div>
      <div style="font-size:24px;font-weight:800;color:#92400E;">MooLink</div>
    </div>

    <div style="background:white;border-radius:16px;padding:32px;border:1px solid #FDE68A;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1C1917;">Your Pro Trial Ends Tomorrow</h1>
      <p style="margin:0 0 20px;font-size:15px;color:#78716C;line-height:1.6;">
        Hey ${displayName || 'there'}! Your 7-day MooLink Pro trial expires tomorrow. You've been enjoying:
      </p>

      <div style="background:#FFFBEB;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #FDE68A;">
        <div style="font-size:14px;font-weight:600;color:#92400E;margin-bottom:12px;">Your Pro features:</div>
        <div style="font-size:13px;color:#78716C;line-height:2;">
          ✅ Unlimited links<br>
          ✅ Full analytics (countries, devices, referrers)<br>
          ✅ Premium HD Nature themes<br>
          ✅ Custom wallpapers<br>
          ✅ Remove MooLink branding
        </div>
      </div>

      <a href="${appUrl}/dashboard" style="display:block;background:#92400E;color:white;text-align:center;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;margin-bottom:16px;">
        Keep Pro — Only $2.99/mo
      </a>

      <p style="margin:0;font-size:13px;color:#A8A29E;text-align:center;line-height:1.5;">
        Cancel anytime. No surprise charges.
      </p>
    </div>

    <div style="text-align:center;margin-top:24px;">
      <p style="font-size:12px;color:#A8A29E;margin:0;">
        You're receiving this because you signed up for MooLink.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function trialExpiredEmail(displayName: string, username: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#FFF8F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;margin-bottom:8px;">🐮</div>
      <div style="font-size:24px;font-weight:800;color:#92400E;">MooLink</div>
    </div>

    <div style="background:white;border-radius:16px;padding:32px;border:1px solid #E7E5E4;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1C1917;">Your Pro Trial Has Ended</h1>
      <p style="margin:0 0 20px;font-size:15px;color:#78716C;line-height:1.6;">
        Hey ${displayName || 'there'}, your 7-day Pro trial has ended. Your account is now on the Free plan (up to 3 links).
      </p>

      <div style="background:#FEF2F2;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #FECACA;">
        <div style="font-size:14px;font-weight:600;color:#991B1B;margin-bottom:12px;">You've lost access to:</div>
        <div style="font-size:13px;color:#78716C;line-height:2;">
          ❌ Unlimited links (now limited to 3)<br>
          ❌ Full analytics suite<br>
          ❌ Premium themes & wallpapers<br>
          ❌ Branding removal
        </div>
      </div>

      <a href="${appUrl}/dashboard" style="display:block;background:#92400E;color:white;text-align:center;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;margin-bottom:16px;">
        Upgrade to Pro — $2.99/mo
      </a>

      <p style="margin:0;font-size:13px;color:#A8A29E;text-align:center;line-height:1.5;">
        Get all your Pro features back instantly.
      </p>
    </div>

    <div style="text-align:center;margin-top:24px;">
      <p style="font-size:12px;color:#A8A29E;margin:0;">
        You're receiving this because your MooLink Pro trial ended.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const supabaseUrl = env.SUPABASE_URL;
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey || !env.RESEND_API_KEY) {
      console.error('Missing required env vars');
      return;
    }

    const now = new Date();

    // Find profiles where:
    // - is_pro = false (not paid)
    // - subscription_status is null or 'inactive' (haven't paid before)
    // - created_at is ~6 days ago (trial expiring tomorrow) or ~7 days ago (trial just expired)
    const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();

    // Get profiles with trial expiring tomorrow (6-7 days old, not paid)
    const expiringRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?is_pro=eq.false&subscription_status=is.null&created_at=gte.${sixDaysAgo}&created_at=lt.${sevenDaysAgo}&select=id,user_id,username,display_name,created_at`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );

    // Get profiles with trial expired today (7-8 days old, not paid)
    const expiredRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?is_pro=eq.false&subscription_status=is.null&created_at=gte.${sevenDaysAgo}&created_at=lt.${eightDaysAgo}&select=id,user_id,username,display_name,created_at`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
      }
    );

    const expiring: Profile[] = await expiringRes.json();
    const expired: Profile[] = await expiredRes.json();

    console.log(`Found ${expiring.length} expiring trials, ${expired.length} expired trials`);

    // Get auth users for emails
    const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
    });
    const authData = await authRes.json();
    const users: AuthUser[] = authData?.users || [];
    const emailMap = new Map(users.map(u => [u.id, u.email]));

    // Send "trial expiring" emails
    for (const profile of expiring) {
      const email = emailMap.get(profile.user_id);
      if (!email) continue;
      try {
        await sendEmail(
          email,
          'Your MooLink Pro Trial Ends Tomorrow 🐮',
          trialExpiringEmail(profile.display_name, profile.username, env.NEXT_PUBLIC_APP_URL),
          env
        );
        // Mark as email sent
        await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${profile.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subscription_status: 'trial_expiring_notified' }),
        });
        console.log(`Sent expiring email to ${email}`);
      } catch (err) {
        console.error(`Failed to send expiring email to ${email}:`, err);
      }
    }

    // Send "trial expired" emails
    for (const profile of expired) {
      const email = emailMap.get(profile.user_id);
      if (!email) continue;
      try {
        await sendEmail(
          email,
          'Your MooLink Pro Trial Has Ended',
          trialExpiredEmail(profile.display_name, profile.username, env.NEXT_PUBLIC_APP_URL),
          env
        );
        // Mark as email sent
        await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${profile.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subscription_status: 'trial_expired_notified' }),
        });
        console.log(`Sent expired email to ${email}`);
      } catch (err) {
        console.error(`Failed to send expired email to ${email}:`, err);
      }
    }
  },
};
