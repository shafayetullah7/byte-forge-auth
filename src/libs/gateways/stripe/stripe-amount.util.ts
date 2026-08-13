/** BDT uses two decimal places in Stripe (amount in smallest unit). */
export function bdtDecimalToStripeUnitAmount(priceBdt: string): number {
  const normalized = priceBdt.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`Invalid BDT amount: ${priceBdt}`);
  }

  const [whole, fraction = ''] = normalized.split('.');
  const paddedFraction = `${fraction}00`.slice(0, 2);
  return Number(whole) * 100 + Number(paddedFraction);
}

export function stripeUnitAmountToBdtDecimal(unitAmount: number): string {
  return (unitAmount / 100).toFixed(2);
}
