export type SellerSubscriptionCheckoutResponse = {
  url: string;
  sessionId: string;
};

export function toSellerSubscriptionCheckoutResponse(input: {
  url: string;
  sessionId: string;
}): SellerSubscriptionCheckoutResponse {
  return {
    url: input.url,
    sessionId: input.sessionId,
  };
}
