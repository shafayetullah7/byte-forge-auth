export class SubscriptionDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubscriptionDomainError';
  }
}
