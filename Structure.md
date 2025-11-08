# Structure.md — StayEasy (Accurate Project Structure & Current Condition)

> **Purpose:** this document explains the project structure, pages, components, database schema, known bugs, and a prioritized, actionable fix plan. It is written so a developer or an AI code-fixing agent can read it and immediately understand the true condition of the codebase and what must be changed.

---

## 1. Project Overview

**Project Name:** StayEasy (single word, all-lowercase brand for UI: `stayeasy`)
**Type:** Web platform for listing and booking hostels / PGs with owner-host workflows, messaging, and manual UPI payments.
**Primary goal of this document:** Replace the inaccurate `Structure.md` created earlier and present a truthful, reproducible snapshot of the repo, problems, and the exact fixes needed.

---

## 2. True Current Condition (high-level)

* Many UI elements are **hardcoded** (explore page properties, ratings, reviews) instead of reading from Supabase.
* Messaging sends a “Message sent successfully” toast but does **not** persist message records in the database.
* Several pages and buttons are non-functional or route to `/#`.
* Owner-only features are accessible to regular users or vice-versa (role checks are inconsistent).
* Clicking **Avatar** currently logs out the user (likely an event handler bug).
* Site name inconsistent: appears as `Stays.io` in some places — branding strings in code are inconsistent.
* Owner dashboard is incomplete: many tabs exist in UI but have no backend, or data is stubbed.
* Booking and payment flows are partially implemented but verification and transaction recording are unreliable.
* Tests are missing or shallow; no reliable test coverage guarding changes.

---

## 3. Required Files & Pages (what should exist)

This section lists expected pages and components (if any are absent or stubbed, mark them for implementation).

### Public pages

* `LandingPage` / `/` — hero, explore preview, search.
* `Explore` / `/explore` — property grid (data-driven), filters, pagination.
* `PropertyDetail` / `/property/:id` — full property detail, reviews, contact owner form, availability calendar.
* `About`, `Trust & Safety`, `Help Centre`, `List Your Property` (redirects to owner flow or modal if unauthenticated).

### Auth pages

* `AuthPage` (`/login`, `/signup`) — Supabase auth or app auth hooks.
* `Profile` — editable user profile (name, email, phone, avatar).

### Tenant pages

* `TenantDashboard` — My bookings, messages, payments, profile.

### Owner pages

* `OwnerDashboard` — Dashboard summary, My Listings, Bookings, Payments, Messages, Settings, Add New Listing.
* `AddListing` — create property form (images, amenities, calendar availability).
* `EditListing` — edit existing listing details, upload images.

### Admin pages (if present)

* `AdminDashboard` — user moderation, audit logs, analytics.

### Shared components

* `Header`, `Footer` (with About/Trust/Help links that actually navigate), `AvatarMenu` (profile controls), `PropertyCard`, `SearchBar`, `Pagination`, `Calendar`, `QRCodeGenerator`, `MessageComposer`, `ChatWindow`.

---

## 4. Database (Supabase) — Truthful schema recommended

> These are the minimum tables required. Use these schemas as the canonical source of truth.

### `users`

* `id` (uuid, pk)
* `email` (text, unique)
* `name` (text)
* `phone` (text)
* `role` (`tenant` | `owner` | `admin`)
* `avatar_url` (text)
* `metadata` (jsonb)
* `created_at`, `updated_at`

### `properties`

* `id` (uuid, pk)
* `owner_id` (uuid -> users.id)
* `title`, `description`, `location` (text)
* `price_per_night` (numeric)
* `currency` (text)
* `amenities` (jsonb)
* `images` (jsonb array of storage URLs)
* `status` (`available` | `unavailable`)
* `created_at`, `updated_at`

### `reviews`

* `id` (uuid)
* `property_id` (uuid)
* `user_id` (uuid)
* `rating` (int 1..5)
* `comment` (text)
* `created_at`

### `bookings`

* `id` (uuid)
* `property_id` (uuid)
* `tenant_id` (uuid)
* `start_date`, `end_date` (date)
* `guests` (int)
* `status` (`pending`|`awaiting_verification`|`confirmed`|`cancelled`)
* `created_at`, `updated_at`

### `payments`

* `id` (uuid)
* `booking_id` (uuid)
* `amount` (numeric)
* `upi_qr_uri` (text)
* `status` (`pending`|`paid`|`rejected`|`verified`)
* `transaction_id` (text) — user-entered after manual UPI payment
* `created_at`, `verified_at`

### `messages`

* `id` (uuid)
* `from_id` (uuid)
* `to_id` (uuid)
* `property_id` (uuid, nullable)
* `content` (text)
* `attachments` (jsonb)
* `status` (`sent`|`delivered`|`read`)
* `created_at`

---

## 5. Known Bugs & Exact Reproductions

Each entry includes steps to reproduce, root-cause hypothesis, and the exact fix.

### Bug A — Explorer shows only 4 hardcoded properties

* **Reproduce:** open `/explore` — cards show the same 4 items even after seeding DB.
* **Cause:** `Explore` uses a local array `const DUMMY = [{...}, ...]` rather than fetching `GET /api/properties` or Supabase client call.
* **Fix:** replace local array with data fetching hook that calls Supabase or `/api/properties?limit=...`. Implement server-side pagination. Remove fallback hardcoded list or keep as dev-mode only behind `if (process.env.NODE_ENV==='development')`.

### Bug B — Reviews hardcoded in code

* **Reproduce:** Navigate to property detail and see reviews that don’t match DB.
* **Cause:** Reviews are embedded in `PropertyDetail` as static JSX or imported JSON.
* **Fix:** Implement `getReviews(property_id)` endpoint (or Supabase query) and populate review list. Keep fallback empty state.

### Bug C — Contact Owner shows success but doesn’t save

* **Reproduce:** Click contact owner → submit message → success toast → messages table is empty.
* **Cause:** UI returns 200 on front-end without awaiting response or uses a mocked function resolving to success. The real API call is missing or miswired (wrong endpoint or CORS).
* **Fix:** Ensure client calls `/api/messages` POST with body `{from_id, to_id, property_id, content}`; backend inserts into `messages` and returns inserted row. Only show success after response OK; otherwise show error.

### Bug D — Avatar click logs user out

* **Reproduce:** Click avatar → app routes to `/logout` or triggers signOut.
* **Cause:** `Avatar` component’s `onClick` assigned to function that toggles menu but due to event propagation it fires logout action attached to parent element; or wrong `href` attribute used.
* **Fix:** Refactor Avatar button: separate `avatarButton` and `logoutButton`. Use `stopPropagation()` and proper role-based menu. Verify `logout` only triggers when clicking the actual logout button.

### Bug E — Site Title wrong in multiple places (`Stays.io`)

* **Reproduce:** Search codebase for `Stays.io` or open pages where title displayed.
* **Cause:** Hardcoded strings inconsistent across files or reused template from another project.
* **Fix:** Replace all occurrences with `stayeasy`/`StayEasy`. Centralize brand strings in `src/config/brand.ts` and import.

### Bug F — Owner dashboard tabs inaccessible or show “not implemented”

* **Reproduce:** Login as owner → open Owner Dashboard → tabs show empty or non-functional UI.
* **Cause:** Tabs exist but backend endpoints return 501 or front-end routes call wrong endpoints. Some components are placeholders.
* **Fix:** Implement or wire endpoints for `GET /api/owner/listings`, `GET /api/owner/bookings`, `GET /api/owner/messages`. Create UI that checks for empty state and renders useful guidance.

### Bug G — Booking/payment flows partially broken

* **Reproduce:** Create booking → generate QR → user marks paid → booking remains `pending`.
* **Cause:** Frontend may write payment status to local state only and not create a `payments` record; owner verification steps not implemented.
* **Fix:** Full integration: booking creation must create a `payments` row with `status=pending`. When owner sends personalized price request, update `payments.upi_qr_uri`. When user marks paid, update `payments.transaction_id` and `status=paid` (owner still needs to verify). Owner UI must have `verify payment` action to set `status=verified`.

---

## 6. Prioritized Fix Plan (Sprint-style, must-do first)

### Sprint 1 — Critical (blockers & day-1 deliverables)

1. Fix Avatar click logout bug.
2. Fix branding strings to `StayEasy`.
3. Replace hardcoded Explore & Reviews with Supabase fetches.
4. Make Contact Owner persist messages to `messages` table and show them in user profile and owner dashboard.
5. Create central config file for routes and brand names.

### Sprint 2 — Core workflows (owner & booking)

1. Owner dashboard wiring: listings, bookings, messages, payments.
2. Implement Add/Edit Listing forms with image upload to Supabase Storage.
3. Implement booking creation & payments record creation.
4. QR generator that creates `upi://pay?pa=<UPI>&am=<amount>&cu=INR&tn=<note>` and a PNG QR image.

### Sprint 3 — UX polish & testing

1. Calendar view with bookings marked.
2. Profile edit form.
3. Notifications and toast messages.
4. Unit/integration tests for critical API endpoints.

---

## 7. Exact Code Patterns and Examples (copy-paste ready)

### 7.1 Supabase client (frontend)

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
```

### 7.2 Fetch properties (React hook)

```ts
// src/hooks/useProperties.ts
import { useState, useEffect } from 'react'
import { supabase } from ''lib/supabase'' (see below for file content)

export function useProperties(limit = 12, page = 1) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page-1)*limit, page*limit - 1)
      .then(res => {
        if (!isMounted) return
        if (res.error) throw res.error
        setItems(res.data || [])
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
    return () => { isMounted = false }
  }, [limit, page])
  return { items, loading }
}
```

### 7.3 Save message (frontend)

```ts
async function sendMessage({from_id, to_id, property_id, content}) {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ from_id, to_id, property_id, content }])
    .select()
  if (error) throw error
  return data[0]
}
```

### 7.4 Transaction flow pseudocode (server-side)

```ts
// when tenant initiates booking -> create booking (PENDING) and payments record
BEGIN TRANSACTION
INSERT INTO bookings (...) RETURNING id as booking_id
INSERT INTO payments (booking_id, amount, status) VALUES (booking_id, amount, 'pending')
COMMIT
```

---

## 8. Testing & Validation Plan

* **Automated tests** for: creating a property, creating booking, creating payment, sending message, owner verifying payment.
* **Manual tests**: reproduce each bug listed in section 5 after implementing fixes.
* **End-to-end**: Use Playwright or Cypress to simulate tenant -> owner flows including QR generation and marking paid.

---

## 9. Git Workflow & Safety

* Branch naming: `fix/<what>`, `feature/<what>`
* Open PR for every change; PR template must include: summary, related issue, manual test steps, screenshots, and rollback notes.
* Add `pre-commit` linting (ESLint + Prettier), and `husky` hooks to run tests.

---

## 10. Rollback & Hotfix Strategy

* Use feature flags (env var gated) when enabling large changes.
* Use small incremental PRs.
* If a change breaks the build, revert using `git revert <commit>` and open a hotfix branch.

---

## 11. Production Checklist

* Environment vars configured (Supabase keys, storage bucket).
* DB migrations applied & seeded.
* Storage policies set to allow signed uploads only.
* Rate limiting and CORS set.

---

## 12. AI Agent Task (copy-paste prompt)

Use this prompt for your code-fixing AI agent (Replit Agent / GitHub Copilot or similar). It is written to be executable by automated repair agents. Paste it into the agent as a single task.

> **AGENT TASK:**
>
> 1. Run the frontend dev server. Fix any runtime build errors. Provide a list of fixes as commit messages.
> 2. Replace any hardcoded property, review, or messages arrays with Supabase queries. Create necessary API endpoints if missing.
> 3. Implement message persistence: when a user contacts an owner, insert into `messages` table. Make messages visible in both sender's profile and owner's message inbox.
> 4. Fix the Avatar menu bug (click should open menu; logout only on explicit logout button).
> 5. Search-and-replace `Stays.io` -> `StayEasy` (centralize brand strings).
> 6. Implement owner dashboard endpoints: `GET /api/owner/listings`, `GET /api/owner/bookings`, `GET /api/owner/messages`. Wire UI to these endpoints.
> 7. Booking/payment: ensure booking creation writes `bookings` and `payments`. Add `Mark Paid` flow requiring transaction ID. Add owner verification action.
> 8. Add QR generator that produces `upi://` URI and a PNG or data-url QR. Use a small JS library such as `qrcode` to generate dataURL.
> 9. Add unit tests for messaging, booking, and payments.
> 10. Run test suite and present results. Commit fixes on separate logical commits and open a PR summary.

**Extra:** create a new, accurate `Structure.md` at repository root with the content of this file (so repo and docs match reality).

---

## 13. Checklist for you (developer / owner) — what to do next

1. Run `git status` and create a branch `fix/critical-stayeasy`.
2. Run the app locally and paste console errors into a new issue (or the AI agent will collect them).
3. Run the AI agent with the prompt in section 12.
4. Review changes, run test suite, and perform manual reproduction of the bug list in section 5.
5. Merge small PRs only after tests pass and manual verification.

---

## 14. Contact & Handover Notes

* Keep a changelog.
* If you want, run the AI agent I included in section 12 and I will review the PR diffs and suggest additional fixes.

---

*Document generated as a replacement to the earlier incomplete file. It explicitly lists all defects you reported and gives exact actionable fixes and code examples.*
