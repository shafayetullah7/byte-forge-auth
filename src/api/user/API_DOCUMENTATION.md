# User API Module Documentation

## Base Path
All endpoints in this module are logically scoped to `/v1/user` as their base route.

## Cross-Domain Auth and CSRF
- User session cookies (`sessionId`, `guestToken`) are `HttpOnly`, `Secure`, and `SameSite=None` in production.
- The readable `userXsrfToken` cookie is issued on first API visit and rotated on login/refresh.
- State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) on guarded routes require:
  - `credentials: include` from browser clients
  - `X-XSRF-TOKEN` header matching the `userXsrfToken` cookie
- Public auth routes (`/auth/login`, `/auth/register`, `/password-reset/*`) are CSRF-exempt.
- Configure deploy env:
  - `COOKIE_DOMAIN` — shared parent domain when frontend and API are on related hosts (e.g. `.aponika.com`)
- Allowed browser origins for CORS and CSRF are defined in `src/libs/security/allowed-origins.ts`.

---

## 1. User Authentication
**Controller**: `UserAuthController`  
**Path**: `/v1/user/auth`

### `POST /v1/user/auth/register`
Registers a new user account.
- **Request Body**: `CreateLocalUserDto` (First name, last name, username, email, password)
- **Response**: `{ success: true, message: string, data: object }`

### `POST /v1/user/auth/login`
Authenticates a user and sets HTTP-only session cookies.
- **Authentication**: Handled by `UserLocalAuthGuard` (Expects local login payload like email/password)
- **Response**: `{ success: true, message: string, data: { session, user, verification? } }`
- **Side Effects**:
  - Sets `sessionId` and `userXsrfToken` cookies on response.
  - When the user's email is not verified, provisions an OTP synchronously and returns `verification` in the response. Verification email delivery is dispatched asynchronously via `email.account-verification.send` (does not block the login response).
    - `verification.expiresAt` — active OTP expiry (ISO timestamp)
    - `verification.sent` — `true` if a new email was sent; `false` if an existing active OTP was reused (no duplicate email on repeated login within TTL)
  - Account verification OTPs expire after **5 minutes** (`OTP_EXPIRY_MINUTES`).

### `GET /v1/user/auth/check`
Checks current authentication status and returns user data.
- **Authentication**: Required (`UserAuthGuard`)
- **Response**: `{ success: true, message: string, data: user }`

### `POST /v1/user/auth/verify-email`
Verifies the user's email address using an OTP.
- **Authentication**: Required (`UserAuthGuard`)
- **Request Body**: `VerifyEmailDto` containing the OTP
- **Response**: `{ success: true, message: string }`

### `POST /v1/user/auth/send-verification-email`
Resends the verification email OTP when no active OTP exists.
- **Authentication**: Required (`UserAuthGuard`)
- **Response**: `{ success: true, message: string, data: { expiresAt, sent } }`
- **Behavior**: If an active OTP exists (`expiresAt > now`), returns the existing `expiresAt` with `sent: false` and does **not** send a new email. Otherwise creates a new OTP and sends email (`sent: true`).
- **Note**: OTP expires after **5 minutes**.

### `POST /v1/user/auth/logout`
Logs out the user and clears the session cookie.
- **Authentication**: Required (`UserAuthGuard`)
- **Response**: `{ success: true, message: string }`

---

## 2. Password Reset
**Controller**: `PasswordResetController`  
**Path**: `/v1/user/password-reset`

### `POST /v1/user/password-reset/forgot`
Initiates the password reset process by provisioning an OTP. Email is sent asynchronously via `email.password-reset.send`.
- **Request Body**: `ForgotPasswordDto` (email)
- **Response**: `{ success: true, message: string, data }`

### `POST /v1/user/password-reset/verify`
Verifies the OTP sent for password reset.
- **Request Body**: `VerifyResetOtpDto` (token, otp)
- **Response**: `{ success: true, message: string, data }`

### `POST /v1/user/password-reset/resend`
Resends the password reset OTP when eligible. Email is sent asynchronously via `email.password-reset.send`.
- **Request Body**: `ResendResetOtpDto` (token)
- **Response**: `{ success: true, message: string, data }`

### `POST /v1/user/password-reset/reset`
Completes the password reset by setting a new password.
- **Request Body**: `ResetPasswordDto` (token, password)
- **Response**: `{ success: true, message: string }`

---

## 3. User Profile
**Controller**: `UserController`  
**Path**: `/v1/user/profile`

### `GET /v1/user/profile`
Retrieves the logged-in user's profile information.
- **Authentication**: Required (`UserAuthGuard`)
- **Response**: `{ success: true, message: string, data: userProfile }`

---

## 4. Seller Shops
**Controller**: `ShopController`  
**Path**: `/v1/user/seller/shops`

### `POST /v1/user/seller/shops`
Creates a new shop under the user's business account.
- **Authentication**: Required (`VerifiedUserAuthGuard`)
- **Request Body**: `SetupShopDto`
- **Response**: `{ success: true, message: string, data: Shop }`

### `GET /v1/user/seller/shops`
Retrieves all shops owned by the user.
- **Authentication**: Required (`VerifiedUserAuthGuard`)
- **Response**: `{ success: true, message: string, data: Shop[] }`

---

## 6. Seller Plants
**Controller**: `SellerPlantController`  
**Path**: `/v1/user/seller/plants`

> [!NOTE]
> All below endpoints require `VerifiedUserAuthGuard`.

### `POST /v1/user/seller/plants`
Creates a plant listing.
- **Request Body**: `CreatePlantDto`
- **Response**: The newly created plant.

### `GET /v1/user/seller/plants`
Retrieves all plants the user has listed.
- **Query Parameters**: `PlantFilterDto`
- **Response**: List of plants.

### `GET /v1/user/seller/plants/:id`
Retrieves a specific plant listing by ID.
- **Path Parameters**: `id`

### `PATCH /v1/user/seller/plants/:id`
Updates a specific plant listing.
- **Path Parameters**: `id`
- **Request Body**: `UpdatePlantDto`

### `DELETE /v1/user/seller/plants/:id`
Deletes a specific plant listing.
- **Path Parameters**: `id`
