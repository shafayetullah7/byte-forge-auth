# Cross-Module Transactions

> **Scope:** `byte-forge-auth` modular monolith.  
> **Policy:** Single-database ACID for coupled writes (checkout, cancel, ship). Optional transaction parameter on repositories and command services.

---

## 1. The problem

Use cases like **place order** touch multiple domains:

- Cart (remove items)
- Order (create group + orders + items)
- Inventory (reserve stock)
- Payment (record method / status)

In a modular monolith with **one PostgreSQL database**, we keep **one transaction** for correctness.  
In a future microservice split, this becomes a **saga** — but not until extraction.

---

## 2. Rules

| Rule | Detail |
|------|--------|
| **Command owns the transaction** | Application command calls `drizzleService.transaction(async (tx) => { ... })` |
| **Only repositories run SQL** | Commands never call `db.client` directly |
| **Pass `tx` down** | Same `tx` object passed to all repos/commands in the use case |
| **Optional `tx` on repos** | Methods work standalone (auto-commit) or enlisted (when `tx` provided) |
| **No nested transactions** | Do not call `transaction()` inside an already-open `tx` |
| **Locks use same `tx`** | `for('update')` reads must use the transaction executor |

---

## 3. Types (canonical)

```typescript
import type { DrizzleTx, TLockTransaction } from '@/libs/db/types';
```

Use `TLockTransaction` from `@/libs/db/types`.

Repositories use `DrizzleService.getExecutor(tx)` pattern:

```typescript
const executor = this.db.getExecutor(options?.tx);
return executor.query.ordersTable.findFirst({ ... });
```

---

## 4. Repository pattern

```typescript
@Injectable()
export class OrderRepository {
  constructor(private readonly db: DrizzleService) {}

  async createOrder(
    data: NewOrderRow,
    options?: { tx?: DrizzleTx },
  ): Promise<Order> {
    const executor = this.db.getExecutor(options?.tx);
    const [row] = await executor
      .insert(ordersTable)
      .values(data)
      .returning();
    return this.toEntity(row);
  }

  async findByIdForUpdate(
    id: string,
    options: { tx: DrizzleTx },
  ): Promise<Order | null> {
    const executor = this.db.getExecutor(options.tx);
    const row = await executor.query.ordersTable.findFirst({
      where: eq(ordersTable.id, id),
      // use lock: 'update' via select().for('update') where needed
    });
    return row ? this.toEntity(row) : null;
  }
}
```

**Without `tx`:** each repository method uses the pool connection (implicit single-statement transaction).  
**With `tx`:** method participates in the caller's transaction.

---

## 5. Cross-module command pattern

Other modules expose **command services** that accept `tx`:

```typescript
// modules/inventory/application/commands/inventory.command.ts
@Injectable()
export class InventoryCommandService {
  constructor(private readonly inventoryRepo: InventoryRepository) {}

  async reserveForOrder(
    items: OrderInventoryItem[],
    orderId: string,
    userId: string,
    tx: DrizzleTx, // required when called from place-order
  ): Promise<void> {
    for (const item of items) {
      await this.inventoryRepo.reserve(item, orderId, userId, { tx });
    }
  }
}
```

**Do not export `InventoryRepository`** to Order module.

---

## 6. Place order flow (target)

```typescript
// modules/order/application/commands/place-order.command.ts
@Injectable()
export class PlaceOrderCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly orderRepo: OrderRepository,
    private readonly cartCommands: CartCommandService,
    private readonly inventoryCommands: InventoryCommandService,
    private readonly orderRepoHelpers: OrderRepository, // generateOrderNumber inside repo
  ) {}

  async execute(input: PlaceOrderInput): Promise<PlaceOrderResult> {
    // ... pre-transaction validation (address, cart, stock pre-check) ...

    const result = await this.db.transaction(async (tx) => {
      const orderGroup = await this.orderRepo.createOrderGroup({ ... }, { tx });

      for (const shopBatch of shopGroups) {
        const orderNumber = await this.orderRepo.nextOrderNumber({ tx });
        const order = await this.orderRepo.createOrder({ orderNumber, ... }, { tx });

        await this.inventoryCommands.reserveForOrder(
          shopBatch.items,
          order.id,
          input.userId,
          tx,
        );

        await this.orderRepo.createOrderItems(shopBatch.items, order.id, { tx });
      }

      await this.cartCommands.removeOrderedItems(input.cartId, input.itemIds, tx);

      return { orderGroupId: orderGroup.id, ... };
    });

    // Emit OrderPlaced after successful commit
    this.events.emit(...);

    return result;
  }
}
```

### Pre-transaction vs in-transaction

| Step | Where | Why |
|------|-------|-----|
| Validate address ownership | Before `transaction` | Fail fast; no lock held |
| Load cart snapshot | Before `transaction` | Read-only |
| Soft stock pre-check | Before `transaction` | Better UX error messages |
| Reserve inventory | **Inside** `transaction` | Race-safe with `for update` |
| Create orders | **Inside** `transaction` | Atomic with reservation |
| Clear cart items | **Inside** `transaction` | Atomic with order creation |
| Send email | **After** commit | Side effect |

---

## 7. Cancel / ship flows

Same pattern as place order:

```typescript
await this.db.transaction(async (tx) => {
  const order = await this.orderRepo.findByIdForUpdate(orderId, { tx });
  order.cancel(); // domain entity enforces rules
  await this.orderRepo.save(order, { tx });
  await this.inventoryCommands.releaseOrderReservation(items, orderId, userId, tx);
  await this.orderRepo.insertStatusHistory(..., { tx });
});
```

Preserve existing:
- `OrderStatusTransitionService` rules → move to `Order` entity
- Optimistic concurrency (`assertOrderNotStale`) → keep in repository or command
- Status history rows → order repository

---

## 8. When a method needs optional `tx`

Use optional `tx` when the same repository method is called:

1. **Standalone** — simple CRUD endpoint, no multi-step coupling
2. **Enlisted** — inside a command's `transaction` block

```typescript
async updateStatus(
  id: string,
  status: OrderStatus,
  options?: { tx?: DrizzleTx },
): Promise<Order> {
  const executor = this.db.getExecutor(options?.tx);
  // ...
}
```

Cross-module **command** methods called only from transactional contexts may require `tx: DrizzleTx` (non-optional) to make misuse a compile-time smell.

---

## 9. Query services and transactions

**Query services do not open transactions** for normal reads.  
Use read-only queries without `tx`, or pass `tx` only when reading within a transaction for consistency (same snapshot) — rare.

List endpoints compose data **after** separate batched reads — no multi-module write transaction needed.

---

## 10. Anti-patterns

| Anti-pattern | Problem |
|--------------|---------|
| `place-order.command` calls `this.db.client.insert(...)` | Bypasses repository boundary |
| Order command injects `InventoryRepository` | Couples persistence across modules |
| Nested `db.transaction()` inside `tx` callback | Undefined / broken behavior |
| Inventory reserve **outside** tx, order create **inside** | Race: oversell |
| Order number query uses `db.client` while rest uses `tx` | Not in same transaction snapshot |
| Long-running HTTP call inside `transaction` | Holds DB locks |

### Known legacy issue to fix in Order refactor

`place-order.service.ts` runs `this.db.client.select(...)` for order numbers **inside** `transaction()` but **without** passing `tx`. Move to `orderRepo.nextOrderNumber({ tx })` using the transaction executor.

---

## 11. Events and transactions

| Approach | When |
|----------|------|
| Emit after `transaction()` resolves | Default — listener failures don't roll back order |
| Emit inside transaction | Only if listener failure must rollback (avoid for email) |
| Outbox pattern | Future — for guaranteed delivery at scale |

Current codebase uses `EventEmitter2` after writes — preserve that unless explicitly changing.

---

## 12. Future: microservice extraction

When Inventory becomes a separate service:

```typescript
// Before (monolith)
await this.inventoryCommands.reserveForOrder(items, orderId, userId, tx);

// After (distributed)
await this.inventoryClient.reserveForOrder({ items, orderId, userId });
// Saga: compensate with release if order creation fails
```

Command orchestration code structure stays; implementation swaps from in-process + `tx` to RPC + saga.

---

## 13. Quick reference

```
PlaceOrderCommand
  └─ db.transaction(tx)
       ├─ OrderRepository.*({ tx })
       ├─ InventoryCommandService.reserveForOrder(..., tx)
       ├─ CartCommandService.removeOrderedItems(..., tx)
       └─ commit
  └─ emit OrderPlaced
```

**Services initiate. Repositories execute. Commands coordinate. One `tx` to rule them all.**
