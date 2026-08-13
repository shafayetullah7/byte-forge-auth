# Subscription module

Seller platform billing — subscription plans, coupons, Stripe recurring, entitlement checks.

**Not in this module:** buyer checkout payments (`modules/payment/`), product pricing (`modules/catalog/`).

## Status

Phases 0–11 implemented (seller coupon redeem). See [SUBSCRIPTION_EXECUTION_PLAN.md](../../../docs/SUBSCRIPTION_EXECUTION_PLAN.md).

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
| Seller | (Phase 12+) | invoices list, checkout, … |
| Webhook | (Phase 14+) | `v1/webhooks/stripe/subscription` |

## Cross-module export

Other modules import **`CheckSellerSubscriptionQuery`** only (exported from `SubscriptionModule`).

When `SUBSCRIPTION_ENFORCEMENT_ENABLED=false`, `active` is always `true` so existing flows are unchanged until Phase 32.

## Feature flag

`SUBSCRIPTION_ENFORCEMENT_ENABLED=false` by default until Phase 32 QA.
