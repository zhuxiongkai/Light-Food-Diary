# Email Verification Register Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional verified email binding to registration.

**Architecture:** Keep registration username/password compatible. Add a verification-code table and service; enforce code validation only when an email is provided. Use SMTP when configured and development logging otherwise.

**Tech Stack:** Vue 3, Vant 4, Express 5, TypeScript, Drizzle ORM, MySQL, Node test runner.

---

### Task 1: Verification Core

**Files:**
- Create: `server/src/utils/emailVerification.ts`
- Test: `tests/emailVerification.test.ts`

- [ ] Write tests for email normalization, email format validation, code hashing, expiry, and attempt limits.
- [ ] Run `node --import tsx --test tests/emailVerification.test.ts` and confirm the test fails because the module does not exist.
- [ ] Implement the verification utility.
- [ ] Run the same test and confirm it passes.

### Task 2: Database And Services

**Files:**
- Modify: `server/src/db/schema.ts`
- Create: `server/drizzle/0004_email_verification_codes.sql`
- Modify: `server/drizzle/meta/_journal.json`
- Modify: `server/src/config.ts`
- Create: `server/src/services/mailService.ts`
- Create: `server/src/services/emailVerificationService.ts`
- Modify: `server/src/services/authService.ts`
- Modify: `server/src/routes/auth.ts`
- Modify: `server/.env.example`
- Modify: `server/package.json`
- Modify: `server/package-lock.json`

- [ ] Add nullable unique email index and `email_verification_codes`.
- [ ] Add SMTP config and mail sender.
- [ ] Add send-code and verify-code service methods.
- [ ] Enforce email verification in registration.
- [ ] Add `POST /api/auth/send-email-code`.

### Task 3: Frontend Registration

**Files:**
- Modify: `src/stores/authStore.ts`
- Modify: `src/views/Register.vue`

- [ ] Add `sendEmailCode` store action.
- [ ] Add email validation, code input, send button, resend countdown, and submit payload.
- [ ] Keep registration without email working.

### Task 4: Verification

- [ ] Run `node --import tsx --test tests/emailVerification.test.ts`.
- [ ] Run `npx vue-tsc -p tsconfig.test.json`.
- [ ] Run `npm run build`.
- [ ] Run `cd server; npm run build`.
