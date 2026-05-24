const STRIPE_API = "https://api.stripe.com/v1";

function headers() {
  return {
    Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

export async function getOrCreateCustomer(
  email: string,
  userId: string,
  existingCustomerId?: string | null
): Promise<string> {
  if (existingCustomerId) return existingCustomerId;

  const res = await fetch(`${STRIPE_API}/customers`, {
    method: "POST",
    headers: headers(),
    body: new URLSearchParams({ email, "metadata[user_id]": userId }),
  });
  const customer = await res.json();
  return customer.id;
}

export async function createCheckoutSession(
  customerId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: "POST",
    headers: headers(),
    body: new URLSearchParams({
      customer: customerId,
      "line_items[0][price]": process.env.STRIPE_PRICE_ID!,
      "line_items[0][quantity]": "1",
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  });
  const session = await res.json();
  return session.url;
}

export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const res = await fetch(`${STRIPE_API}/billing_portal/sessions`, {
    method: "POST",
    headers: headers(),
    body: new URLSearchParams({ customer: customerId, return_url: returnUrl }),
  });
  const session = await res.json();
  return session.url;
}

export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const parts = signature.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const v1 = parts.find((p) => p.startsWith("v1="))?.slice(3);
  if (!timestamp || !v1) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`)
  );
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expected === v1;
}
