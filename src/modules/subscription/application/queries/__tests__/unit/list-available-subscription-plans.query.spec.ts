import { ListAvailableSubscriptionPlansQuery } from '../../list-available-subscription-plans.query';
import { SubscriptionPlanRepository } from '../../../../repositories/subscription-plan.repository';

describe('ListAvailableSubscriptionPlansQuery', () => {
  it('requests only plans active for new purchases', async () => {
    const repository = {
      findAll: jest.fn().mockResolvedValue([]),
    } as unknown as SubscriptionPlanRepository;

    const query = new ListAvailableSubscriptionPlansQuery(repository);
    await query.execute();

    expect(repository.findAll).toHaveBeenCalledWith({ activeForNewOnly: true });
  });
});
