# Auth module

User OIDC login (Aponika IdP) and admin local email/password auth.

## User auth (OIDC-only)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `v1/user/auth/oidc/login` | Redirect to Aponika authorize (`UserOidcController`) |
| `GET` | `v1/user/auth/oidc/callback` | Code exchange; sets `bfAccessToken` / `bfRefreshToken` cookies |
| `POST` | `v1/user/auth/oidc/refresh` | Refresh OIDC tokens |
| `GET` | `v1/user/auth/oidc-check` | Resolve local user from access token |
| `POST` | `v1/user/auth/logout` | Local logout — clear OIDC cookies on this app |
| `GET` | `v1/user/auth/oidc/logout` | Federated logout — redirect to Aponika `end_session` |

**Services:** `OidcAuthService`, `OidcIdentityProvisionerService`

**Guards (global):** `UserAuthGuard` (OIDC JWT/cookies), `CartAccessGuard` (OIDC + guest token), `VerifiedUserAuthGuard`

User email lives on `users.email`. Aponika `sub` maps via `user_identities`.

## Admin auth (local)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `v1/admin/auth/login` | Email/password login |
| `POST` | `v1/admin/auth/register/request-otp` | Gatekeeper OTP flow |
| `POST` | `v1/admin/auth/register` | Complete admin registration |
| `POST` | `v1/admin/auth/logout` | End admin session |

**Services:** `AdminAuthService`, `AdminLocalAuthService`, `AdminSessionService`, `AdminRegistrationService`

**Guard:** `AdminAuthGuard` (session cookie)

## Cross-module access

| Consumer | API |
|----------|-----|
| `UserAuthGuard`, `CartAccessGuard` | `OidcIdentityProvisionerService`, `JwtResourceGuard` |
| `AdminAuthGuard` | `AdminAuthService`, `AdminSessionService`, `SessionRepository` |
| `UserModule` | `CreateUserCommand`, `UserQueryService` (via `UserModule` import) |
| `NotificationModule` | `UserQueryService` (buyer/owner email from `users.email`) |

## Repositories

| Repository | Location | Notes |
|------------|----------|-------|
| `UserIdentityRepository` | `repositories/user-identity.repository.ts` | Aponika `sub` → `users.id` |
| `SessionRepository` | `repositories/session.repository.ts` | Shared `sessions` table (admin) |
| `AdminSessionRepository` | `repositories/admin-session.repository.ts` | Admin session links |
| `AdminLocalAuthRepository` | `repositories/admin-local-auth.repository.ts` | Admin credentials |

## Admin registration (gatekeeper OTP)

Two-step flow. Full design: `plans/ADMIN_REGISTRATION_OTP_PLAN.md`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `v1/admin/auth/register/request-otp` | OTP to `ADMIN_REGISTRATION_OTP_EMAIL` (global 1/min) |
| `POST` | `v1/admin/auth/register` | Complete with OTP |

**Required env:** `ADMIN_REGISTRATION_OTP_EMAIL`

### Smoke test (local)

1. Set `ADMIN_REGISTRATION_OTP_EMAIL` and `MAIL_PROVIDER=console` in `.env.development`
2. `POST /v1/admin/auth/register/request-otp` — OTP in server console
3. `POST /v1/admin/auth/register` with OTP → `201`
4. `POST /v1/admin/auth/login` with new credentials → `200`

## Future work

**BF-MIG-7:** Admin OIDC client (`byte-forge-admin`) — same IdP, separate cookie namespace from marketplace web.
