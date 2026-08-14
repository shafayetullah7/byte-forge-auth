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
| `NotificationModule` | `UserLocalAuthRepository` |

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

## Admin registration (gatekeeper OTP)

Two-step flow. Full design: `plans/ADMIN_REGISTRATION_OTP_PLAN.md`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `v1/admin/auth/register/request-otp` | Start registration; OTP to `ADMIN_REGISTRATION_OTP_EMAIL` (global 1/min) |
| `POST` | `v1/admin/auth/register` | Complete with OTP; sets `admin_local_auth.verified = true` |

**Required env:** `ADMIN_REGISTRATION_OTP_EMAIL`

### Smoke test (local)

1. Set `ADMIN_REGISTRATION_OTP_EMAIL` and `MAIL_PROVIDER=console` in `.env.development`
2. Run migrations if not applied: `pnpm db:generate` then `pnpm db:migrate`
3. `POST /v1/admin/auth/register/request-otp` — confirm `expiresAt` in response; OTP in server console
4. Within 60s, second request with a **different** email → `429 TOO_MANY_REQUESTS`
5. `POST /v1/admin/auth/register` with same body + OTP → `201` and admin profile
6. `POST /v1/admin/auth/login` with the new credentials → `200`
