import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { SubscriptionInvoiceStatusEnum } from '@/_db/drizzle/enum/subscription-invoice-status.enum';
import { SubscriptionInvoiceRepository } from '../../repositories/subscription-invoice.repository';
import { ListSellerSubscriptionInvoicesQuery } from './list-seller-subscription-invoices.query';

describe('ListSellerSubscriptionInvoicesQuery', () => {
  const shopId = 'shop-1';
  const now = new Date('2026-06-01T00:00:00.000Z');

  let subscriptionInvoiceRepository: jest.Mocked<
    Pick<SubscriptionInvoiceRepository, 'listByShopIdPaginated'>
  >;
  let query: ListSellerSubscriptionInvoicesQuery;

  beforeEach(() => {
    subscriptionInvoiceRepository = {
      listByShopIdPaginated: jest.fn(),
    };
    query = new ListSellerSubscriptionInvoicesQuery(
      subscriptionInvoiceRepository as unknown as SubscriptionInvoiceRepository,
    );
  });

  it('returns paginated invoice summaries', async () => {
    subscriptionInvoiceRepository.listByShopIdPaginated.mockResolvedValue({
      rows: [
        {
          id: 'invoice-1',
          shopId,
          planId: null,
          amountBdt: '0.00',
          currency: 'BDT',
          provider: SubscriptionBillingProviderEnum.COUPON,
          status: SubscriptionInvoiceStatusEnum.PAID,
          externalId: null,
          receiptUrl: null,
          periodStart: now,
          periodEnd: new Date('2026-07-01T00:00:00.000Z'),
          paidAt: now,
          metadata: { couponCode: 'WELCOME30' },
          createdAt: now,
          updatedAt: now,
        },
      ],
      total: 1,
    });

    const result = await query.execute(shopId, {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: 'invoice-1',
      amountBdt: '0.00',
      provider: SubscriptionBillingProviderEnum.COUPON,
      receiptUrl: null,
    });
    expect(result.meta).toMatchObject({
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('returns empty list for shops with no invoices', async () => {
    subscriptionInvoiceRepository.listByShopIdPaginated.mockResolvedValue({
      rows: [],
      total: 0,
    });

    const result = await query.execute(shopId, {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
  });
});
