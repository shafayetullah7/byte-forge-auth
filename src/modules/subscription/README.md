# Subscription module

Seller platform billing — subscription plans, coupons, Stripe recurring, entitlement checks.

**Not in this module:** buyer checkout payments (`modules/payment/`), product pricing (`modules/catalog/`).

## Status

Phases 0–16 complete (v1 backend surface documented). See [SUBSCRIPTION_EXECUTION_PLAN.md](../../../docs/SUBSCRIPTION_EXECUTION_PLAN.md).

## Layout

```
subscription/
  controllers/       seller + admin HTTP + Stripe webhook
  application/
    commands/        mutations (redeem coupon, checkout, sync plan, …)
    queries/         read models + CheckSellerSubscriptionQuery
  domain/            policy, entities, errors (no DB)
  repositories/      subscription_* tables
  mappers/           API response shapes
  infrastructure/
    providers/       Stripe checkout + billing portal; wallet stub (v2)
    stripe/          webhook handlers + context
```

## Routes (v1)

All paths are prefixed with `/api/v1/` in the running app.

### Admin — plans

| Method | Path | Notes |
|--------|------|-------|
| GET | `admin/subscription/plans` | Paginated list |
| GET | `admin/subscription/plans/:id` | Single plan |
| POST | `admin/subscription/plans` | Create |
| PATCH | `admin/subscription/plans/:id` | Update |
| POST | `admin/subscription/plans/:id/sync-stripe` | Create/update Stripe Product + Price |
| PATCH | `admin/subscription/plans/:id/retire` | Retire (grandfather existing subs) |

### Admin — coupons

| Method | Path | Notes |
|--------|------|-------|
| GET | `admin/subscription/coupons` | Paginated list |
| GET | `admin/subscription/coupons/:id` | Single coupon |
| POST | `admin/subscription/coupons` | Create |
| PATCH | `admin/subscription/coupons/:id` | Update |
| PATCH | `admin/subscription/coupons/:id/deactivate` | Deactivate |

### Admin — shop subscription

| Method | Path | Notes |
|--------|------|-------|
| GET | `admin/shops/:shopId/subscription` | Status, plan, invoices summary |
| POST | `admin/shops/:shopId/subscription/extend` | Manual period extension (shop lock) |

### Seller

| Method | Path | Notes |
|--------|------|-------|
| GET | `user/seller/subscription` | Real status (ignores enforcement bypass) |
| GET | `user/seller/subscription/invoices` | Paginated invoice history |
| POST | `user/seller/subscription/coupon/redeem` | Extend period via coupon (shop lock) |
| POST | `user/seller/subscription/checkout` | Stripe Checkout → `{ url, sessionId }` |
| POST | `user/seller/subscription/billing-portal` | Stripe Customer Portal → `{ url }` |

### Webhook

| Method | Path | Notes |
|--------|------|-------|
| POST | `webhooks/stripe/subscription` | Stripe-signed; idempotent by `stripe_event_id` |

## Public exports (`SubscriptionModule`)

| Export | Kind | Use |
|--------|------|-----|
| `CheckSellerSubscriptionQuery` | Query | Entitlement gate in catalog/order (Phases 26–30) |
| `ListAvailableSubscriptionPlansQuery` | Query | Seller UI plan picker (Phase 20+) |

Repositories, commands, and webhook handlers are module-private. Do not import them from catalog or order.

## Cross-module import guide (catalog / order)

When `SUBSCRIPTION_ENFORCEMENT_ENABLED=true` (Phase 32+), gate seller mutations with `CheckSellerSubscriptionQuery`:

```typescript
// catalog.module.ts or order.module.ts
import { SubscriptionModule } from '@/modules/subscription/subscription.module';

@Module({
  imports: [SubscriptionModule],
  // ...
})
export class CatalogModule {}
```

```typescript
// e.g. PublishProductCommand
constructor(
  private readonly checkSellerSubscription: CheckSellerSubscriptionQuery,
) {}

async execute(shopId: string) {
  const entitlement = await this.checkSellerSubscription.execute(shopId);
  if (!entitlement.active) {
    throw new SubscriptionRequiredError(); // define in consumer or shared errors
  }
  // ...
}
```

**Return shape** (`SellerSubscriptionEntitlement`):

| Field | Meaning |
|-------|---------|
| `active` | `true` when commercial actions allowed (respects enforcement flag) |
| `status` | `NONE` \| `ACTIVE` \| `EXPIRED` |
| `currentPeriodEnd` | Period end or `null` |
| `billingProvider` | `NONE` \| `COUPON` \| `STRIPE` \| `ADMIN` \| `WALLET` (v2) |

**Flag off (default):** `active` is always `true` so existing catalog/order flows are unchanged until QA enables enforcement.

**Seller HTTP API** uses `GetSellerSubscriptionQuery`, which always reflects real subscription state for the subscription page and nag UI.

## Feature flag

| Variable | Default | Effect |
|----------|---------|--------|
| `SUBSCRIPTION_ENFORCEMENT_ENABLED` | `false` | When `false`, `CheckSellerSubscriptionQuery.active` is always `true` |

Buyer COD checkout is unaffected regardless of this flag.

### Staging enable (Phase 32)

1. Copy [`.env.staging.example`](../../.env.staging.example) → `.env.staging` on the staging host (or equivalent secret manager vars).
2. Set `SUBSCRIPTION_ENFORCEMENT_ENABLED=true` **on staging only** — production stays `false` until product sign-off.
3. Restart API; run entitlement sections of [phase-subscription-qa-checklist.md](../../../docs/phase-subscription-qa-checklist.md).
4. Automated gate smoke (local/CI): `pnpm test:subscription-gates`.

**Rollback:** set `SUBSCRIPTION_ENFORCEMENT_ENABLED=false` and restart — gates become permissive immediately; seller subscription UI still shows real status.

## Environment variables

| Variable | Required for | Notes |
|----------|--------------|-------|
| `SUBSCRIPTION_ENFORCEMENT_ENABLED` | Entitlement gating | `true` / `false`; default `false` |
| `STRIPE_SECRET_KEY` | Plan sync, checkout, portal, webhooks | Server-side Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Webhook endpoint | From Stripe Dashboard or `stripe listen` |
| `STRIPE_PUBLISHABLE_KEY` | Seller/admin UI (Phase 20+) | Not used by backend v1 handlers |
| `FRONTEND_URL` | Checkout + portal return URLs | e.g. `http://localhost:5173` |

## Database tables

Schema under `src/_db/drizzle/schema/subscription/`:

| Table | Purpose |
|-------|---------|
| `subscription_plans` | Plan catalog + Stripe product/price IDs |
| `shop_subscriptions` | One row per shop — period, provider, Stripe IDs |
| `subscription_coupons` | Coupon definitions |
| `subscription_coupon_redemptions` | Per-shop redemption audit |
| `subscription_invoices` | Checkout, renewals, admin extensions |
| `subscription_stripe_webhook_events` | Webhook idempotency (`stripe_event_id` UNIQUE) |

After schema changes, run `npm run db:generate` and `npm run db:migrate` locally.

## Concurrency

Mutating writers acquire a per-shop advisory lock inside transactions:

`ShopSubscriptionRepository.acquireShopLock(shopId, tx)` → `pg_advisory_xact_lock(910001, shopHash)`

Used by: coupon redeem, admin extend, Stripe checkout, webhook handlers. See execution plan §3.

## Stripe setup (local / staging)

1. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `FRONTEND_URL` in `.env`.
2. Admin: create a plan → **Sync to Stripe** (`POST …/plans/:id/sync-stripe`).
3. Forward webhooks locally:

   ```bash
   stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe/subscription
   ```

   Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

4. Seller: `POST user/seller/subscription/checkout` with `{ planId }` → redirect to returned `url`.
5. After payment, webhooks update `shop_subscriptions` and invoices. Billing changes: `POST …/billing-portal`.

### Plan sync

- First sync creates a Stripe Product + recurring Price (BDT) and stores IDs on the plan row.
- Re-sync is idempotent when price/interval unchanged.
- If `priceBdt` or `interval` changed, a **new** Stripe Price is created; the old Price ID is appended to `previousStripePriceIds` and deactivated in Stripe (grandfathering).

### Seller checkout

- Requires plan with `stripe_price_id` set.
- Checkout Session `mode: subscription` with metadata `{ shopId, planId, domain: 'subscription' }`.
- Pending checkout tracked as `PENDING` invoice (`external_id` = session id); open sessions within 30 minutes are reused on repeat POST.
- Redirects: `/app/seller/subscription?checkout=success|cancel` on `FRONTEND_URL`.

### Billing portal

- Requires `stripe_customer_id` on the shop subscription row.
- Coupon-only or admin-managed shops receive **400** with a clear message.
- Return URL: `/app/seller/subscription` on `FRONTEND_URL`.

### Webhooks

- Requires `rawBody: true` in `main.ts` for signature verification.
- Header: `Stripe-Signature`.
- Handlers: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`.
- Only events with metadata `domain: 'subscription'` are processed; others return `{ received: true, ignored: true }`.
- Duplicate delivery (same `stripe_event_id`) is ignored after the first successful handling.

## v2 wallet integration guide (not implemented)

v1 seller checkout uses **Stripe** and **coupons** only. Wallet gateways are deferred; the plug-in point exists for a future phase.

### Interface

`infrastructure/providers/wallet-subscription.provider.interface.ts` defines `IWalletSubscriptionProvider`:

| Method | Purpose |
|--------|---------|
| `createCheckout(input)` | Start hosted checkout → `{ url, sessionId }` |
| `handleCallback(input)` | Verify IPN/webhook → `{ sessionId, shopId, planId, paid }` |

### Stub (v1)

`WalletSubscriptionProvider` is registered in `SubscriptionModule` but **throws `NotImplementedException`** on both methods. No v1 route or command calls it.

`SubscriptionProviderFactory` registers Stripe + wallet adapters. v1 commands inject `StripeSubscriptionProvider` directly; v2 will route `billingProvider: WALLET` through the factory.

### Expected first implementation: SSLCommerz

1. Add `SslCommerzWalletSubscriptionProvider implements IWalletSubscriptionProvider` in `infrastructure/providers/` (or `infrastructure/wallet/sslcommerz/`).
2. Replace the stub binding in `subscription.module.ts` when ready (or use a feature flag).
3. Add seller route e.g. `POST user/seller/subscription/wallet/checkout` mirroring Stripe checkout command:
   - Shop advisory lock
   - Insert `PENDING` invoice with `provider: WALLET`, `external_id: sessionId`
   - Return redirect URL
4. Add callback controller e.g. `POST webhooks/wallet/subscription` (IPN validation per SSLCommerz docs).
5. On paid callback: upsert `shop_subscriptions` with `billingProvider: WALLET`, extend `current_period_end` using the same domain formula as coupons (`max(current_period_end, now) + duration`).
6. **Stripe → wallet handoff (v2):** prepaid wallet period extends **after** existing Stripe `current_period_end` — do not cancel Stripe early.

### Later: bKash / Nagad

Direct wallet APIs can implement the same `IWalletSubscriptionProvider` interface. Keep gateway-specific code in `infrastructure/providers/` or `libs/gateways/` — business rules stay in subscription commands.

