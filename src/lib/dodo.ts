// Dodo Payments Integration Helper Module

const DODO_API_URL = process.env.DODO_PAYMENTS_MODE === 'live'
  ? 'https://live.dodopayments.com'
  : 'https://test.dodopayments.com';

export async function createDodoCheckoutSession({
  email,
  name,
  userId,
  returnUrl,
}: {
  email: string;
  name: string;
  userId: string;
  returnUrl: string;
}) {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  const productId = process.env.DODO_PAYMENTS_PRODUCT_ID || 'p_moo_pro_monthly';

  if (!apiKey) {
    throw new Error('DODO_PAYMENTS_API_KEY environment variable is not configured');
  }

  const response = await fetch(`${DODO_API_URL}/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      quantity: 1,
      payment_link: true,
      billing: {
        city: '',
        country: 'US', // Default to US or generic to pass validation
        state: '',
        street: '',
        zipcode: '',
      },
      customer: {
        email,
        name,
      },
      metadata: {
        user_id: userId,
      },
      return_url: returnUrl,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Failed to create Dodo Payments checkout session');
  }

  return data;
}
