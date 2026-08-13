import {
  bdtDecimalToStripeUnitAmount,
  stripeUnitAmountToBdtDecimal,
} from './stripe-amount.util';

describe('stripe-amount.util', () => {
  it('converts BDT decimal to Stripe unit amount', () => {
    expect(bdtDecimalToStripeUnitAmount('499')).toBe(49900);
    expect(bdtDecimalToStripeUnitAmount('499.5')).toBe(49950);
    expect(bdtDecimalToStripeUnitAmount('499.99')).toBe(49999);
  });

  it('converts Stripe unit amount back to BDT decimal', () => {
    expect(stripeUnitAmountToBdtDecimal(49900)).toBe('499.00');
  });
});
