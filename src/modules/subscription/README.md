# Subscription module

Seller platform billing — subscription plans, coupons, Stripe recurring, entitlement checks.

**Not in this module:** buyer checkout payments (`modules/payment/`), product pricing (`modules/catalog/`).

## Status

Skeleton only (Phase 2). Routes and providers are added in later phases per [SUBSCRIPTION_EXECUTION_PLAN.md](../../../docs/SUBSCRIPTION_EXECUTION_PLAN.md).

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

## Planned routes (v1)

| Audience | Path prefix |
|----------|-------------|
| Seller | `user/seller/subscription` |
| Admin | `admin/subscription/plans`, `admin/subscription/coupons` |
| Webhook | `webhooks/stripe/subscription` |

## Cross-module export

Other modules import **`CheckSellerSubscriptionQuery`** only (exported from `SubscriptionModule`).

When `SUBSCRIPTION_ENFORCEMENT_ENABLED=false`, `active` is always `true` so existing flows are unchanged until Phase 32.

## Feature flag

`SUBSCRIPTION_ENFORCEMENT_ENABLED=false` by default until Phase 32 QA.
