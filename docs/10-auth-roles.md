# 10 · Auth & Roles

---

## Roles

| Role | Can | Cannot |
|---|---|---|
| **viewer** | Watch previews, buy licenses, comment, like, follow, create collections | Upload, receive payouts |
| **pilot** | All viewer + upload, set prices, view analytics, withdraw earnings | Manage other users |
| **studio** | All pilot + team seats (5+), bulk upload, brand page, enterprise invoicing | — |
| **admin** | Moderate content, verify pilots, issue refunds, view all data | — |

Default role on signup: `viewer`. Upgrade paths:
- viewer → pilot: complete pilot onboarding (drone reg + ID)
- viewer/pilot → studio: apply for studio account (human review)

---

## Sign-up flow (3 steps)

1. **Account** — email, password (or OAuth: Google, Apple)
2. **Role** — "I watch / I shoot / I'm a studio" → pre-selects role
3. **Handle** — `@yourname`, checked for uniqueness in real time

Email verification link sent after step 3. User is usable immediately; verification required for purchases and uploads.

---

## Sign-in

- Email + password (Argon2id hashing, cost params calibrated to ~250ms)
- OAuth: Google, Apple (required for App Store parity if mobile app ships)
- Magic link via email (fallback for forgotten passwords)
- MFA: TOTP (Google Authenticator) required for payout actions; optional globally

### Rate limits (auth)

- 5 attempts per IP per 15 min on signin
- 3 password-reset requests per email per hour
- Generic "If that email exists…" response; never leak account existence

---

## Pilot verification

Gate to upload:

1. Government ID (passport or driver's license)
   - Uploaded via Stripe Identity or Persona
   - Stored encrypted; face-match against selfie
2. Drone registration
   - Country + registration number (FAA / KARA / CAA / DGAC / CASA / …)
   - Photo of registration card
3. Tax info (if seeking payouts)
   - W-9 (US) / W-8BEN (non-US) auto-collected via Stripe

Review SLA: 48 hours. Auto-approval for low-risk countries + clean ID pass; manual review otherwise.

### Result states

- `pending` — under review
- `approved` — can upload, payouts enabled after Connect onboarding
- `rejected` — reason emailed, 14-day appeal window
- `restricted` — can upload but downloads gated (used for post-abuse re-entry)

---

## Studio accounts

- Contact form → sales review
- Provision: custom brand page, 5–50 team seats, API access, enterprise billing (NET-30)
- Seats: each has a role within the studio — `owner | admin | uploader | finance`
- All seats share a single payout account

---

## Session management

- **Access token:** JWT, 15 min, signed with rotating key (jwk set, 90-day rotation)
- **Refresh token:** 30 days, stored as httpOnly secure sameSite=strict cookie
- **Revocation:** server-side list keyed by `jti`, checked on every refresh. Sign-out and password change revoke all.
- **Device tracking:** maintain a `sessions` table — user can see + revoke individual sessions in `/settings/security`

---

## Permissions (ABAC)

Simple policy engine:

```ts
can(user, action, resource) -> bool
```

Examples:

```ts
can(user, 'video:update', video) =>
  user.id === video.creator_id || user.role === 'admin';

can(user, 'video:download', video) =>
  hasValidLicense(user, video);

can(user, 'payout:request', account) =>
  user.id === account.user_id && account.mfa_verified;

can(user, 'moderation:approve', video) =>
  user.role === 'admin';
```

No role-only checks beyond admin. Everything else is resource-scoped.

---

## Privacy & data subject rights

- **Export:** `/settings/data-export` → emailed ZIP within 24h (profile JSON, videos list, orders, comments)
- **Delete:** soft-delete account; hard-delete media after 30-day grace; retain payment records 7 years per law
- **Handle reuse:** released handles go into cooldown for 90 days; previous owner's public content already anonymized to `@former-creator-NNNN`

---

## Admin auth

- Separate sign-in page `/admin/signin`
- Requires MFA always
- IP allowlist optional (set per-admin)
- All admin actions audited to `audit_log` table (actor, target, action, diff, timestamp)
- Admin role cannot be self-assigned — super-admin only
