# 09 · Licensing & Payments

---

## License tiers

| Tier | Price mult | Who | Use | Attribution | Exclusive | Resale |
|---|---|---|---|---|---|---|
| **Personal** | 1× | Individuals | Social posts, school projects, personal portfolio | Required (`@creator`) | No | Forbidden |
| **Commercial** | 1.8× | Brands, marketers | Ads, client work, paid YouTube videos, websites | Optional | No | Forbidden |
| **Extended** | 3.5× | Agencies, broadcasters | TV, film, merchandise, re-distribution in products | Optional | No | Allowed within own products |
| **Exclusive** | 12–25× | Enterprise | Exclusive-use contract; video removed from marketplace | Optional | **Yes** | Allowed |

Prices computed from creator-set base price × tier multiplier.

### Exclusive tier mechanics

- Buyer pays a flat price negotiated with creator (floor = 12× personal price)
- Video is removed from public listings for the term (1/3/5/perpetual)
- Existing licenses remain valid
- Creator keeps rights to re-license non-identical footage shot at same time/location

---

## License lifecycle

```
1. Buyer checks out → Stripe payment succeeds
2. Webhook fires → `orders.status = paid`
3. For each order_item:
   - Create `licenses` row with unique LIC number
   - Generate PDF certificate (reusable template + order data)
   - Upload to S3, store key on license
   - Issue first signed download URL
4. Email buyer: "Your licenses are ready" + in-app notification
5. 70% of subtotal credited to creator_balance (pending, 30-day hold)
6. After 30 days with no chargeback → funds become available for payout
```

### PDF certificate

A single-page document:
- Icarus logo, LIC-XXXX-NNNN number, issue date
- Buyer legal name (collected at checkout) + entity type
- Video title, creator handle, duration, resolution, checksum
- Tier, grant of rights (full legalese from legal template)
- Creator signature block (digital, auto-populated)
- Icarus authorized signature

Generate via `@react-pdf/renderer` or a Headless Chrome → PDF service. Store signed in `s3://di-certificates/`.

---

## Stripe integration

### Payment intents

```ts
// Create at checkout
const intent = await stripe.paymentIntents.create({
  amount: totalCents,
  currency: 'usd',
  metadata: { order_id: orderId, buyer_id: userId },
  automatic_payment_methods: { enabled: true },  // Apple Pay, Google Pay, card
});

return { client_secret: intent.client_secret };
```

Client confirms via Stripe Elements. Done.

### Webhook endpoints

```
POST /webhooks/stripe

Events subscribed:
  payment_intent.succeeded         → finalize order
  payment_intent.payment_failed    → mark order failed, notify buyer
  charge.refunded                  → revoke license, debit creator
  charge.dispute.created           → flag order, freeze pending creator credit
  charge.dispute.closed            → resolve flag based on outcome
  account.updated                  → creator Connect onboarding status
  transfer.paid                    → creator payout confirmed
  payout.failed                    → alert ops
```

Verify signatures via `stripe.webhooks.constructEvent`. Idempotency by `event.id`.

---

## Creator payouts (Stripe Connect Express)

### Onboarding

1. Creator completes pilot verification (see `10-auth-roles.md`)
2. Creator clicks "Set up payouts" → redirect to Stripe Connect Express hosted flow
3. They provide: legal name, DOB, address, tax ID (SSN/EIN/equivalent), bank account
4. Stripe returns us an `account_id` on callback → stored on user
5. User is now payout-eligible

### Payout schedule

- **Pending balance:** all paid orders, 30-day hold for chargebacks
- **Available balance:** past 30-day hold, not yet paid out
- **Automatic payouts:** weekly (Monday) if available ≥ $50
- **Manual request:** any time if available ≥ $100 (fee may apply)

### Tax

- US creators: issue 1099-NEC at year-end via Stripe tax automation if > $600/yr
- International: creator responsible; we collect W-8BEN at onboarding for non-US
- Prices are tax-exclusive shown to buyer; tax added at checkout based on buyer billing address

---

## Refunds

**Buyer-initiated within 7 days** of purchase, **if no download has occurred**:
- Full refund via Stripe
- License revoked immediately
- Creator balance debited (only pending, not yet available)
- Original file access revoked

**After 7 days or after first download:**
- Case-by-case, ops decides
- Dispute flow (chargeback) handled through Stripe

**Creator-initiated (removing video):**
- Existing licenses NOT revoked — perpetual grant
- Video pulled from marketplace for new sales only
- Pilot keeps earned revenue

---

## Fraud & abuse

- **Stolen card / chargeback:** auto-freeze the creator's pending balance tied to that order; debit available if needed. Three+ chargebacks → creator review.
- **Credential reuse:** Stripe Radar ML handles; we tune rules per-account if patterns emerge.
- **License resale:** watermark commercial+ downloads with invisible buyer ID; reverse-lookup on takedowns.
- **Duplicate account abuse:** phone verification required for any account earning > $500.

---

## Pricing sanity rails

Creator-set prices bounded:

| Tier | Min | Max |
|---|---|---|
| Personal | $0.99 | $29.99 |
| Commercial | 1.5× personal | $199 |
| Extended | 2× commercial | $999 |
| Exclusive | 10× personal | no cap (manual review above $5k) |

Prevents `$0.01` race-to-bottom and `$999,999` abuse-listings.

---

## Revenue share

- Standard: **70% creator / 30% Icarus**
- Top-tier verified (> $10k lifetime sales): **80 / 20** as loyalty tier
- Exclusive licenses: **85 / 15** (creator takes the risk of lockout)

Stripe processing fee (2.9% + $0.30) deducted from Icarus's share, not creator's.
