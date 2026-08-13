# Subscription module

Seller platform billing — subscription plans, coupons, Stripe recurring, entitlement checks.

**Not in this module:** buyer checkout payments (`modules/payment/`), product pricing (`modules/catalog/`).

## Status

Phases 0–14 implemented (Stripe webhooks). See [SUBSCRIPTION_EXECUTION_PLAN.md](../../../docs/SUBSCRIPTION_EXECUTION_PLAN.md).

## Planned layout

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
    providers/       Stripe, coupon, wallet (v2) adapters
```

## Routes (v1)

| Audience | Method | Path |
|----------|--------|------|
| Admin | GET/POST/PATCH | `v1/admin/subscription/plans` |
| Admin | POST | `v1/admin/subscription/plans/:id/sync-stripe` |
| Admin | PATCH | `v1/admin/subscription/plans/:id/retire` |
| Admin | GET/POST/PATCH | `v1/admin/subscription/coupons` |
| Admin | PATCH | `v1/admin/subscription/coupons/:id/deactivate` |
| Admin | GET | `v1/admin/shops/:shopId/subscription` |
| Admin | POST | `v1/admin/shops/:shopId/subscription/extend` |

**Shop writers:** `ShopSubscriptionRepository.acquireShopLock(shopId, tx)` uses `pg_advisory_xact_lock(910001, shopHash)` inside transactions (coupon redeem, admin extend, Stripe checkout/webhooks — see execution plan §3).

## Stripe plan sync

- Requires `STRIPE_SECRET_KEY` in the environment.
- First sync creates a Stripe Product + recurring Price (BDT) and stores IDs on the plan row.
- Re-sync is idempotent when price/interval unchanged.
- If `priceBdt` or `interval` changed, a **new** Stripe Price is created, the old Price ID is appended to `previousStripePriceIds`, and the old Price is deactivated in Stripe (grandfathering existing subscribers).

| Seller | GET | `v1/user/seller/subscription` |
| Seller | POST | `v1/user/seller/subscription/coupon/redeem` |
| Seller | GET | `v1/user/seller/subscription/invoices` |
| Seller | POST | `v1/user/seller/subscription/checkout` |
| Webhook | POST | `v1/webhooks/stripe/subscription` |
| Seller | (Phase 15+) | billing portal |

## Stripe webhooks

- Requires `STRIPE_WEBHOOK_SECRET` and `rawBody: true` (enabled in `main.ts`).
- Endpoint: `POST /api/v1/webhooks/stripe/subscription` with `Stripe-Signature` header.
- Idempotency: `subscription_stripe_webhook_events.stripe_event_id` UNIQUE (run `db:generate` + `db:migrate`).
- Handlers: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`.
- Only events with metadata `domain: 'subscription'` are processed; others return `{ received: true, ignored: true }`.
- Local testing: `stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe/subscription`

## Stripe seller checkout

- Requires `STRIPE_SECRET_KEY` and plan synced via admin (`stripe_price_id` set).
- Creates Checkout Session (`mode: subscription`) with metadata `{ shopId, planId, domain: 'subscription' }`.
- Pending checkout tracked as `PENDING` Stripe invoice (`external_id` = session id); open sessions within 30 minutes are reused on repeat POST.
- Success/cancel redirects: `/app/seller/subscription?checkout=success|cancel` on `FRONTEND_URL`.

## Cross-module export

Other modules import **`CheckSellerSubscriptionQuery`** only (exported from `SubscriptionModule`).

When `SUBSCRIPTION_ENFORCEMENT_ENABLED=false`, `active` is always `true` so existing flows are unchanged until Phase 32.

## Feature flag

`SUBSCRIPTION_ENFORCEMENT_ENABLED=false` by default until Phase 32 QA.
