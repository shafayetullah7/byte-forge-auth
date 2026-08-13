/**
 * v2 wallet gateway contract for seller platform subscription checkout.
 *
 * Expected first implementation: **SSLCommerz** (hosted checkout + IPN callback),
 * followed by direct bKash/Nagad integrations. v1 uses Stripe only — this interface
 * is not wired into seller checkout commands yet.
 */

export type WalletSubscriptionCheckoutInput = {
  shopId: string;
  planId: string;
  /** Plan price in BDT (minor units handled by the gateway adapter). */
  amountBdt: number;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string | null;
};

export type WalletSubscriptionCheckoutResult = {
  /** Redirect URL to the wallet / SSLCommerz hosted checkout page. */
  url: string;
  /** Gateway session reference stored on `subscription_invoices.external_id`. */
  sessionId: string;
};

export type WalletSubscriptionCallbackInput = {
  rawBody: unknown;
  headers: Record<string, string | string[] | undefined>;
};

export type WalletSubscriptionCallbackResult = {
  sessionId: string;
  shopId: string;
  planId: string;
  paid: boolean;
};

export interface IWalletSubscriptionProvider {
  createCheckout(
    input: WalletSubscriptionCheckoutInput,
  ): Promise<WalletSubscriptionCheckoutResult>;

  handleCallback(
    input: WalletSubscriptionCallbackInput,
  ): Promise<WalletSubscriptionCallbackResult>;
}
