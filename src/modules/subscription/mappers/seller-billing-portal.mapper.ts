export type SellerBillingPortalResponse = {
  url: string;
};

export function toSellerBillingPortalResponse(url: string): SellerBillingPortalResponse {
  return { url };
}
