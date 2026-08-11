# Shop module

Seller shop lifecycle, verification, storefront, follow, and public discovery.

## Phase 19 (current)

Domain foundation only — no HTTP or repositories yet.

```
domain/
  shop.entity.ts              Shop aggregate (status, verification flags)
  shop-status.ts              Lifecycle status enum
  shop-verification-status.ts Verification workflow enum
  shop-policy.ts              Transitions, publish rules, resubmit guards
  shop.errors.ts              Domain errors
```

## Lifecycle rules (encoded in domain)

| Action | Shop status | `isVerified` |
|--------|-------------|--------------|
| Seller submit for review | → `PENDING_VERIFICATION` | unchanged |
| Seller resubmit docs (after reject) | → `PENDING_VERIFICATION` | unchanged |
| Admin approve | → `ACTIVE` | `true` |
| Admin reject | → `REJECTED` | `false` |
| Admin suspend (from ACTIVE) | → `SUSPENDED` | `false` |
| Admin deactivate | → `INACTIVE` | `false` |
| Admin reactivate | → `ACTIVE` | unchanged |

Public visibility (`GET /shops`, shop detail): **ACTIVE** only.

## Upcoming phases

| Phase | Scope |
|-------|--------|
| 20 | Core `ShopRepository` |
| 21–23 | Seller profile, setup, verification commands |
| 24–28 | Storefront, follow, admin, public cutover |

Legacy traffic still served from `src/api/user/seller/shop/`, `admin-shop/`, `public/shops/`.
