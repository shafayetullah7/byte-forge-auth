export class InventoryDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InventoryDomainError';
  }
}
