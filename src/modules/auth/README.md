# Auth module

User and admin registration, login, session cookies, email verification, password reset, and JWT refresh.

## HTTP

| Routes | Controller |
|--------|------------|
| `v1/user/auth/*` | `UserAuthController` |
| `v1/user/password-reset/*` | `PasswordResetController` |
| `v1/admin/auth/*` | `AdminAuthController` |
| `v1/admin/session` | `AdminSessionController` (placeholder) |

## Cross-module access

| Consumer | API |
|----------|-----|
| `UserAuthGuard`, `CartAccessGuard`, `UserAuthJWtGuard` | `UserSessionRepository`, `SessionRepository`, `UserAuthV2Service` |
| `AdminAuthGuard` | `AdminAuthService`, `AdminSessionService`, `SessionRepository` |
| Notifications | `UserLocalAuthRepository` |

Exports repositories and `UserAuthV2Service` / `AdminAuthService` / `AdminSessionService` (guards import `AuthModule` via guard modules).
