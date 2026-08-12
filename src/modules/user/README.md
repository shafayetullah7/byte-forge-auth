# User module

Profile, buyer addresses, and cross-module user reads.

## HTTP

| Routes | Controller |
|--------|------------|
| `v1/user/profile` | `UserProfileController` |
| `v1/user/buyer/addresses/*` | `BuyerAddressesController` |
| `v1/admin/users/*` | `AdminUsersController` |

## Cross-module access

| Consumer | API |
|----------|-----|
| `AuthModule` (registration) | `CreateUserCommand`, `UserQueryService.findByUserName` |
| `OrderIntegrationsModule` (checkout) | `UserQueryService.getAddressById` |
| `OrderModule` (admin orders) | `UserQueryService.getUserSummaries` |

Exports `UserQueryService` and `CreateUserCommand` only.

## Guards

Do **not** import `*GuardModule` here. All guards are `@Global()` via `AppModule`; use `@UseGuards(...)` on controllers only.
