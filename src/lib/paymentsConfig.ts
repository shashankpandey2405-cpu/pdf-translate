function strip(v: string | undefined): string {
  return (v ?? "").trim();
}

function parseEnvTrue(v: string | undefined): boolean {
  const s = strip(v).toLowerCase();
  return s === "true" || s === "1";
}

export function paymentsKeysConfigured(): boolean {
  if (parseEnvTrue(strip(import.meta.env.VITE_PAYMENTS_ENABLED))) return true;
  const paypalClient = strip(import.meta.env.VITE_PAYPAL_CLIENT_ID);
  return paypalClient.length > 0;
}

export function isLocalPaymentsDevMode(): boolean {
  return Boolean(import.meta.env.DEV) && !paymentsKeysConfigured();
}

let devModeLogged = false;

export function logPaymentsDevModeOnce(): void {
  if (!import.meta.env.DEV || paymentsKeysConfigured()) return;
  if (devModeLogged) return;
  devModeLogged = true;
  console.info("PayPal not configured for client — checkout uses server session API");
}

export function mockPremiumEnabled(): boolean {
  return Boolean(import.meta.env.DEV) && strip(import.meta.env.VITE_MOCK_PREMIUM) === "true";
}
