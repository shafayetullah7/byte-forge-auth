export class ReviewDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReviewDomainError';
  }
}
