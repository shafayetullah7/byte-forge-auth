# User module

Profile, buyer addresses, and cross-module user reads.

## HTTP

| Routes | Controller |
|--------|------------|
| `v1/user/profile` | `UserProfileController` |
| `v1/user/buyer/addresses/*` | `BuyerAddressesController` |

## Cross-module access

| Consumer | API |
|----------|-----|
| `AuthModule` (registration) | `CreateUserCommand`, `UserQueryService.findByUserName` |
| `OrderIntegrationsModule` (checkout) | `UserQueryService.getAddressById` |
| `OrderModule` (admin lists, Phase 49+) | `UserQueryService.getUserSummaries` |

Exports `UserQueryService` and `CreateUserCommand` only.
