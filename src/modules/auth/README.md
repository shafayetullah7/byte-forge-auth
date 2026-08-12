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
| `UserModule` (registration) | `CreateUserCommand`, `UserQueryService` (via `UserModule` import) |
| Notifications | `UserLocalAuthRepository` |

Exports repositories and `UserAuthV2Service` / `AdminAuthService` / `AdminSessionService` (guards import `AuthModule` via guard modules).

## Repositories

| Repository | Location | Notes |
|------------|----------|-------|
| `UserSessionRepository` | `modules/auth/repositories/user-session.repository.ts` | Canonical — join queries for guards and login |
| `SessionRepository` | `modules/auth/repositories/session.repository.ts` | Shared by user + admin sessions |
| `UserLocalAuthRepository` | `modules/auth/repositories/user-local-auth.repository.ts` | |
| `AdminSessionRepository`, `AdminLocalAuthRepository` | `modules/auth/repositories/` | Scaffolded; admin services still use Drizzle directly today |

Legacy `_repositories/user/user.session.repository/` was removed in Phase 47 (duplicate orphan).

## Future work — dual user auth (session + JWT v2)

**Out of scope for the structural refactor.** Do not migrate behavior during Phases 45–47.

Today two paths coexist:

| Path | Guard / service | Cookie / token | Used by |
|------|-----------------|----------------|---------|
| **Session (primary)** | `UserAuthGuard` | `sessionId` cookie | Login, logout, check, verify-email, most buyer routes |
| **JWT v2 (partial)** | `UserAuthJWtGuard` | `userAccessToken` + `userRefreshToken` | `POST /user/auth/refresh` only; guard registered globally but not wired to routes yet |

`UserAuthService` owns registration, credential validation, session creation, and email verification. `UserAuthV2Service` owns JWT sign/verify and refresh-token rotation (session ID rotation on refresh).

**Cutover plan (later):** see `plans/USER_V2_JWT_AUTH_IMPLEMENTATION_PLAN.md` — login should issue JWT cookies, guards should converge on `UserAuthJWtGuard`, then retire session-cookie-only paths when clients are ready.
