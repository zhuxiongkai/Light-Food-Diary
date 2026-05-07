# Email Verification Register Design

## Goal

Add optional email verification during registration. Users may still register with only username and password, but if they provide an email address it must be valid, unique, and verified by a registration code before the account is created.

## Behavior

- `email` remains optional on registration.
- If `email` is omitted, registration keeps the current username/password flow.
- If `email` is provided, the client must first call `POST /api/auth/send-email-code`.
- `POST /api/auth/register` accepts optional `emailCode`; when `email` is present, `emailCode` is required and must match an unused, unexpired registration code for that email.
- `users.email` is unique while remaining nullable, so multiple accounts may omit email but no two accounts may bind the same email.
- Verification codes expire after 10 minutes, cannot be resent more often than once per 60 seconds for the same email, and fail after 5 incorrect verification attempts.

## Architecture

- Add `email_verification_codes` to store hashed codes, purpose, expiry, use state, and attempt count.
- Add a small verification utility for email normalization, format validation, code hashing, and code state checks.
- Add an SMTP-backed mail service. In development, when SMTP is not configured, the service logs the code so local testing is possible.
- Extend `authService.register` so email verification is enforced inside the same transaction that creates the user.
- Extend `Register.vue` with email code input, send button, and resend countdown.

## Error Handling

- Invalid email returns `400` with `邮箱格式不正确`.
- Duplicate email returns `409` with `邮箱已被注册`.
- Resending within 60 seconds returns `429` with `验证码发送太频繁，请稍后再试`.
- Missing or invalid registration code returns `400` with a Chinese user-facing message.

## Testing

- Node tests cover email normalization, format checks, code hashing, expiration checks, and attempt-limit checks.
- TypeScript build verifies backend and frontend integration.
