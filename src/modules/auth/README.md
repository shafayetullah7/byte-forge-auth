# Auth module

User OIDC login (Aponika IdP) and admin local email/password auth.

## User auth (OIDC-only)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `v1/user/auth/oidc/login` | Redirect to Aponika authorize (`UserOidcController`) |
| `GET` | `v1/user/auth/oidc/callback` | Code exchange, **provision identity**, then set `bfAccessToken` / `bfRefreshToken` cookies |
| `POST` | `v1/user/auth/oidc/refresh` | Refresh OIDC tokens (no identity provisioning). CSRF required. |
| `GET` | `v1/user/auth/oidc-check` | Resolve linked local user from access token (read-only) |
| `POST` | `v1/user/auth/logout` | Local logout — clear OIDC cookies on this app. CSRF required. |
| `POST` | `v1/user/auth/oidc/logout` | Federated logout — HTML auto-submit to Aponika `end_session`. CSRF required. `GET` returns 405. |

**Services:** `OidcAuthService`, `OidcIdentityProvisionerService`

**Guards (global):** `UserAuthGuard` (OIDC JWT/cookies), `CartAccessGuard` (OIDC + guest token), `VerifiedUserAuthGuard`

User email lives on `users.email`. Aponika `sub` maps via `user_identities`.

### Email linking contract (`email_verified`)

Linking a new Aponika `sub` to a Byte Forge user **requires** IdP `email_verified === true`. Unverified emails never create a `user_identities` row and never match an existing `users.email`. Treat Aponika `email_verified` as a security boundary: if the IdP ever asserts it without proof, that is account takeover.

On later logins, if the access token email is **verified** and differs from `users.email`, the local email is updated so order/notification mail follows the IdP. If that address already belongs to another user, provision fails (`oidc_error=provision_failed`). Unverified token emails never overwrite `users.email`.

### OIDC identity linking

| Step | `provisionFromToken` (write) | `resolveFromToken` (read) |
|------|------------------------------|---------------------------|
| OIDC callback | Yes — sole link point; runs **before** cookies are set | No |
| `oidc-check` | No | Yes — 401 if not linked |
| `UserAuthGuard`, `CartAccessGuard` | No | Yes — 401 if not linked |
| `oidc/refresh` | No | No — token rotation only |

Unlinked users (e.g. pre-deploy cookies) get 401 until they complete OIDC login again. Callback provision failure redirects to `/login?oidc_error=provision_failed` without setting session cookies. IdP `error` values are mapped to a closed set (`access_denied`, `login_required`, `temporarily_unavailable`, `provision_failed`, `token_exchange_failed`, `failed`). Token exchange failures redirect to `oidc_error=token_exchange_failed` instead of JSON.

Federated logout does not send `id_token_hint` (no JWT in the query string). `client_id` + `post_logout_redirect_uri` plus the IdP session cookie are enough.

Authorize `nonce` is stored in an httpOnly cookie and checked against the `id_token` after code exchange (JWKS, `aud` = client id, optional `at_hash` / `azp`). IdP HTTP calls use `OIDC_HTTP_TIMEOUT_MS` (default 10s). Production requires explicit `OIDC_*` URLs (no localhost defaults).

`oidc-check` is a custom BFF session probe for SSR + HTTP-only cookies (not OIDC UserInfo).

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
