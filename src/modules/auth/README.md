# Auth module (user)

User registration, login, session cookies, email verification, password reset, and JWT refresh (v2).

## HTTP

| Routes | Controller |
|--------|------------|
| `v1/user/auth/*` | `UserAuthController` |
| `v1/user/password-reset/*` | `PasswordResetController` |

## Cross-module access

| Consumer | API |
|----------|-----|
| `UserAuthGuard`, `CartAccessGuard`, `UserAuthJWtGuard` | `UserSessionRepository`, `SessionRepository`, `UserAuthV2Service` |
| Admin session (until Phase 46) | `SessionRepository` |
| Notifications | `UserLocalAuthRepository` |

Exports repositories and `UserAuthV2Service` only (no repository export to external modules long-term — guards import `AuthModule`).
