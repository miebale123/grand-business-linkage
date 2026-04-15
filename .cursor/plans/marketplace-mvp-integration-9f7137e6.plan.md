<!-- 9f7137e6-0020-4485-93f9-99a7a3f8ee70 -->
---
todos:
  - id: "align-types-and-mock-data"
    content: "Extend shared product/merchant types and mock provider data with trust/listing-status fields and required listing metadata."
    status: pending
  - id: "implement-favorites-flow"
    content: "Add a marketplace favorites composable, wire favorite button into ProductCard, and create missing FavoritesPage.vue."
    status: pending
  - id: "extend-listing-filters-pagination"
    content: "Enhance UserDashboardPage with price/condition filters, approved-only listing behavior, and pagination logic/UI."
    status: pending
  - id: "upgrade-product-detail-trust-cta"
    content: "Add gallery + posted/location/condition trust details and prominent call seller CTA in ProductDetailsPage."
    status: pending
  - id: "merchant-admin-approval-loop"
    content: "Implement merchant status behavior and complete AdminListingsPage approval/rejection moderation workflow."
    status: pending
isProject: false
---
# Trusted Marketplace MVP Integration Plan

## Goal
Add profile, filtering, favorites, pagination, "posted by merchant", verification visibility, and approval flow into the current `marketplace`, `merchant`, and `admin` modules without deleting major existing structure.

## Frontend Direction (`/frontend-design`)
- Design principle: **Trust-first marketplace** with a clear Ethiopian-local context and phone-first behavior.
- Aesthetic direction: **editorial + utilitarian** (high contrast typography, clean cards, bold trust chips, minimal noise).
- Memorable signature: every listing card has a visible trust strip (`Posted by`, verification state, location, call affordance) that makes credibility scannable in 2-3 seconds.
- UX priority order: `Call seller` > `Verification clarity` > `Filter speed` > `Favorites`.
- Keep this consistent across all modules; avoid generic dashboard look.

## Current Baseline (already in your code)
- `UserDashboardPage.vue` already supports search/category/availability/area filters via route query + `api.fetchProducts(...)`.
- `ProductCard.vue` already accepts `merchant` and can show merchant block and badge.
- `ProductDetailsPage.vue` already loads merchant data and has inquiry flow.
- Merchant and admin routes/pages already exist in router (`src/app/router/index.ts`).
- Gap found: router references `FavoritesPage.vue` but file is currently missing.

## Integration Strategy (minimal-disruption)
- Preserve module boundaries and page components already in place.
- Extend existing types and client methods instead of replacing architecture.
- Add new behavior via small composables + optional props, then wire into existing pages.
- Keep mock-backend logic in current API client/mock provider (no service-layer rewrite).

## Phase 1: Data Model Additions (shared types + mock data)
- Update `src/shared/types/index.ts` with marketplace trust fields:
  - `ProductRecord`: `status` (`pending|approved|rejected`), `condition` (`New|Used`), `location`, `phone`, `createdAt`, `images: string[]`.
  - `MerchantRecord` keep `verified` (already present), optionally add `verificationLevel` alias only if needed by UI labels.
- Align mock DB/provider data to include these fields for existing products.
- Ensure product creation payload from merchant editor can include required listing fields.

## Phase 2: Marketplace Listing Enhancements
- In `src/modules/marketplace/pages/UserDashboardPage.vue`:
  - Keep existing filters; add price range + condition filters.
  - Restrict public listing to approved products (`status === 'approved'`).
  - Add pagination state (`page`, `pageSize`, `totalPages`) and render only current page slice.
  - Reset to page 1 when filters change.
  - Add sticky filter panel on desktop and compact top-sheet filter controls on mobile.
- In `src/modules/marketplace/components/ProductCard.vue`:
  - Add top text: `Posted by {merchant.businessName}`.
  - Add per-card favorite toggle button.
  - Keep merchant verification badge visible and compact.
  - Add a dedicated trust row: merchant name, verified/basic chip color, location, posted date.

## Phase 3: Favorites (local persistence)
- Add `src/modules/marketplace/composables/useFavorites.ts`:
  - Source of truth: `localStorage` (e.g., key `marketplace:favorites`).
  - API: `isFavorite(productId)`, `toggleFavorite(productId)`, `favoriteIds`.
- Wire favorite state into `ProductCard.vue` and listing pages.
- Create missing `src/modules/marketplace/pages/FavoritesPage.vue`:
  - Load approved products by favorite IDs.
  - Reuse `ProductCard` grid + empty state.

## Phase 4: Product Detail Trust UX
- In `src/modules/marketplace/pages/ProductDetailsPage.vue`:
  - Show image gallery from `images` (fallback to `image`).
  - Ensure posted date, location, condition, and merchant badge are displayed.
  - Promote primary CTA to prominent call action (`tel:`) using merchant phone/product phone.
  - Keep inquiry form as secondary action.
  - Place trust facts immediately above CTA (badge, merchant name, area, posting date) to reduce hesitation before calling.

## Phase 5: Merchant Profile + Merchant Workspace
- `src/modules/marketplace/pages/MerchantProfilePage.vue`:
  - Show merchant profile block (name, verification, phone/location) and published catalog only.
- `src/modules/merchant/pages/MerchantDashboardPage.vue` and `ProductEditorPage.vue`:
  - Add listing status chips (pending/approved/rejected).
  - On create/save, set status rule:
    - verified merchant -> approved
    - non-verified merchant -> pending
  - Optionally lock editing for approved items if you want stricter trust simulation.

## Phase 6: Admin Approval + Moderation
- Implement `src/modules/admin/pages/AdminListingsPage.vue` (currently placeholder):
  - Pending queue table/cards.
  - Approve/reject actions (status patch).
  - Basic report/removal actions can be scaffolded with simple controls if reports dataset exists.
- Keep admin features limited to essential MVP moderation.

## UI System Constraints (for implementation quality)
- Typography:
  - Use existing project typography tokens, but enforce stronger hierarchy for trust info and CTAs.
  - Reserve uppercase micro-labels for trust metadata (`Verified`, `Pending review`, `Posted`).
- Color semantics:
  - Verified = success tone; Basic/Pending = warn/neutral tone; Rejected/flagged = danger tone.
  - Never reuse one neutral chip style for all statuses.
- Interaction:
  - Favorite button must have immediate visual feedback and accessible `aria-pressed`.
  - Pagination controls must be keyboard accessible and preserve filter query state.
  - Call action remains visible without scrolling deep on mobile.
- Motion:
  - Subtle hover lift on cards and chip transitions only; avoid heavy animation that slows list scanning.
- Accessibility:
  - Maintain contrast for badges/chips, visible focus states, and semantic labels for all status indicators.

## Phase 7: API Client/Provider Updates (mock only)
- Extend existing `src/shared/api/api.ts` exports and underlying provider contracts with:
  - fetch pending products
  - approve/reject product
  - fetch by status + pagination/filter params
- Ensure route-driven filters still work with existing query syncing.

## Phase 8: Rollout Order (safe incremental)
1. Types + provider data additions
2. Favorites composable + missing favorites page
3. ProductCard posted-by + favorite button
4. User dashboard price/condition filters + pagination
5. Product detail trust fields + call CTA
6. Merchant status flow in editor/dashboard
7. Admin listings approval UI

## Acceptance Criteria
- Marketplace shows only approved products to users.
- Each product card shows `Posted by {merchantName}` and favorite toggle.
- Favorites persist across refresh and are viewable in dedicated favorites page.
- Filters include keyword/category/availability/area/price/condition.
- Pagination works with filter resets and accurate result counts.
- Product detail includes gallery, trust badge, location, posted date, and visible call button.
- Merchant submission status follows verification rule.
- Admin can approve/reject pending listings.
- Visual hierarchy clearly prioritizes trust + call flow over decorative content.

## Risk Controls
- Avoid broad refactors; keep existing pages/components and style system.
- Add fields with backward-compatible fallbacks so old mock records still render.
- Ship in vertical slices so each step remains runnable.