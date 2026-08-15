# LearnCode AI — Business Model & Monetisation Architecture

Reference specification for the platform's commercial layer. Everything in the
billing, entitlement, marketplace and payout code should match this document;
where they disagree, this document is the intent and the code is the bug.

**Model:** two-sided marketplace with a subscription overlay.
Learners pay for access (subscription) or for individual courses (one-off).
Creators publish courses and earn a revenue share. The platform takes a cut of
every sale and funds a revenue pool for subscription-included content.

---

## 1. Roles

| Role | Can | Panel |
|---|---|---|
| `user` | Learn, buy, subscribe, post in forum | Profile |
| `creator` | Everything a user can, plus author/submit/sell courses, view sales and earnings, request payouts | **Creator Studio** |
| `admin` | Everything, plus approve creators, review courses, approve payouts, view platform revenue | Admin Portal |

A `creator` is a `user` with an approved `CreatorProfile`. The role is additive,
never a replacement — creators remain learners and keep their own subscription.

**Becoming a creator:** apply → admin reviews → approved/rejected with reason.
Applications capture expertise, sample work, and payout country.

---

## 2. Learner plans

Prices in USD. Stripe operates in **test mode** for this project.

| | **Free** | **Pro** | **Lifetime** |
|---|---|---|---|
| Price | $0 | **$9/mo** or **$79/yr** (save 27%) | **$249** once |
| Tutorials | Foundations (beginner) only | All difficulties | All difficulties |
| Platform courses | Preview only | All included | All included |
| Marketplace courses | Purchase individually | Purchase individually¹ | Purchase individually¹ |
| **AI credits** | **50 / month** | **2,000 / month** | **2,000 / month** |
| Code executions | 30 / day | Unlimited² | Unlimited² |
| Verified AI generation | ✗ | ✓ | ✓ |
| Certificates | ✗ | ✓ verifiable | ✓ verifiable |
| Quiz attempts | 3 per quiz | Unlimited | Unlimited |
| Saved snippets | 10 | Unlimited | Unlimited |
| Discussion forum | Read + post | Read + post + priority tag | Same as Pro |
| Support | Community | Email | Email |

¹ Except courses the creator has opted into the Pro catalogue — those are
included in Pro (see §5).
² Fair-use ceiling of 500/day to protect the sandbox; effectively unlimited.

**Why credits rather than "unlimited":** every AI call costs real money. An
unadvertised unlimited tier is how AI products lose money on their best users.
Credits make the cost visible, make upgrades meaningful, and give a clean
metric for the evaluation chapter.

### AI credit costs

| Action | Credits |
|---|---|
| Assistant chat message | 1 |
| Code explanation / debug hint | 2 |
| Quiz generation | 5 |
| **Verified tutorial generation** | 10 |

Verified generation costs most because it runs the closed-loop pipeline:
retrieval, generation, sandbox execution per snippet, and up to N repair calls.

Credits reset monthly on the billing anniversary (Free: calendar month).
Unused credits do not roll over. Exhausted credits return `402` with an upgrade
hint, never a silent failure.

---

## 3. Marketplace economics

**Split: 70% creator / 30% platform** on every course sale.

Industry comparison: Apple/Google take 30%, Udemy takes 37–63%, Gumroad 10%
plus payment fees. 30% is defensible and standard.

```
Course listed at $40
  ├─ Stripe fee      ~$1.46   (2.9% + $0.30, deducted first)
  ├─ Platform (30%)  $12.00   → application_fee_amount
  └─ Creator (70%)   $28.00   → creator's connected account
```

Stripe fees are borne by the platform out of its 30%, so creators receive a
clean 70% of list price. This is simpler to explain and to reconcile.

**Price bounds:** $0 (free course) or $5–$200. Creators set their own price
within that band. Price changes never affect existing purchases.

### Payout rails — Stripe Connect Express

Creators onboard to a Stripe Express account. Stripe handles identity
verification, tax forms and bank payouts. At checkout the platform uses
`payment_intent_data.application_fee_amount` with `transfer_data.destination`,
so the split happens atomically — the platform never holds creator funds.

A creator cannot publish a paid course until `payouts_enabled` is true on their
connected account. Free courses may be published without onboarding.

---

## 4. Course lifecycle

```
draft ──submit──> pending_review ──approve──> approved ──publish──> published
                        │                                              │
                        └──reject──> rejected ──edit──> draft          └──unpublish──> approved
```

- **draft** — creator editing; invisible to learners
- **pending_review** — submitted; locked from editing; in the admin queue
- **approved** — passed review; creator chooses when to publish
- **rejected** — admin supplied a reason; returns to draft on edit
- **published** — live in the catalogue and purchasable
- **suspended** — admin removed it post-publication (policy breach); existing
  buyers keep access

Review checks content completeness, that code examples run, pricing sanity, and
originality. **The verified-generation sandbox is reused here**: a course cannot
be approved while any of its code examples fail to execute.

---

## 5. Pro catalogue revenue pool

Creators may opt a course into the Pro catalogue (`includedInPro: true`). Pro
subscribers then read it at no extra cost, and the creator earns from a monthly
pool instead of a per-sale split.

```
Monthly pool = 20% of net Pro subscription revenue

Creator share = pool × (their qualified minutes / all qualified minutes)
```

A "qualified minute" is lesson time by a Pro subscriber, capped per user per
course per month to blunt farming. This mirrors how Spotify and Udemy's
subscription pool distribute.

Opting in is per-course and reversible with 30 days' notice, so a creator
cannot withdraw content mid-period after accruing pool credit.

---

## 6. Data model

New collections:

| Collection | Purpose |
|---|---|
| `CreatorProfile` | Application, approval state, Stripe Connect account, payout status, aggregate stats |
| `Order` | One row per purchase: amounts, split, Stripe ids, refund state. The financial audit trail. |
| `Entitlement` | What a user may access and why (`purchase` / `subscription` / `grant`). Replaces the raw `purchasedCourses[]` array. |
| `LedgerEntry` | Double-entry-style record of every credit/debit against a creator's balance |
| `Payout` | Payout batch: amount, period, Stripe transfer id, status |
| `AiUsage` | Per-user monthly credit consumption, with per-action breakdown |
| `RevenuePoolPeriod` | Monthly pool: total, participating courses, computed distribution |

Changes to existing collections:

- `User.role` gains `creator`
- `User.purchasedCourses` deprecated in favour of `Entitlement` (kept and
  backfilled for one release, then removed)
- `Course` gains `price`, `currency`, `status`, `includedInPro`,
  `reviewNotes`, `publishedAt`, `salesCount`, `revenueTotal`

**Why `Entitlement` rather than an array on the user:** an array cannot express
*why* access was granted, cannot expire, cannot be revoked on refund, and
cannot be audited. Entitlements can, and a refund becomes a state change rather
than an array splice.

---

## 7. Access resolution

A single service answers "can this user do X" — no other module decides.

```
resolveAccess(user, resource) →
  1. admin?                        → allow
  2. is the creator of it?         → allow
  3. active Entitlement?           → allow
  4. Pro/Lifetime AND
     (platform-owned OR includedInPro)? → allow
  5. free-tier allowance covers it? → allow
  otherwise → 402 PAYMENT_REQUIRED + upgrade hint
```

Every paywall returns `402` with a machine-readable `code` and an `upgradeUrl`,
so the frontend can render the right prompt rather than guessing.

---

## 8. Money integrity rules

Non-negotiable, and each is covered by a test:

1. **Webhooks are the source of truth.** Access is granted on
   `checkout.session.completed`, never on the browser returning to a success URL.
2. **Idempotency.** Every webhook carries an event id; replaying it must not
   double-grant or double-credit. Orders are keyed on the Stripe session id.
3. **Refunds revoke.** `charge.refunded` deactivates the entitlement and posts a
   reversing ledger entry.
4. **Money is integer minor units.** All amounts are stored in cents. Never floats.
5. **Split is computed server-side.** The client never sends a price or a
   percentage; both come from the Course document and the platform config.
6. **Payouts need a positive available balance.** Balance = credits − debits −
   pending payouts, and the check runs inside the payout transaction.

---

## 9. What ships in which phase

| Phase | Deliverable |
|---|---|
| 1 | Data model: roles, CreatorProfile, Order, Entitlement, Payout, course pricing |
| 2 | Plan catalogue + entitlement service |
| 3 | AI credit metering (closes the "advertised but unenforced" gap) |
| 4 | Creator application → approval |
| 5 | Course review workflow |
| 6 | Stripe Connect onboarding |
| 7 | Marketplace checkout with split payments |
| 8 | Earnings ledger, revenue pool, payouts |
| 9 | Creator Studio UI |
| 10 | Admin: applications, review queue, payouts, revenue analytics |
| 11 | Pricing page + paywall UX |
| 12 | Tests across entitlements, credits, split maths, webhook idempotency |

---

## 10. Open items requiring a decision

- **Tax/VAT.** Stripe Tax handles this but costs extra. Out of scope for the
  project; note as production work.
- **Currency.** USD only for now. Multi-currency needs per-currency Stripe
  prices.
- **Refund window.** Proposed 14 days, self-service, automatic entitlement
  revocation. Needs confirmation.
- **Minimum payout.** Proposed $50, monthly, to keep transfer fees proportionate.
