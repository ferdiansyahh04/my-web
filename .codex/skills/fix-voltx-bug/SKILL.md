---
name: fix-voltx-bug
description: Fix bugs in the VOLTX Store codebase, especially issues in the vanilla HTML/CSS/JS storefront, Supabase auth and data flows, checkout, cart, orders, admin panel, and mobile responsiveness. Use when Codex needs to diagnose regressions, trace DOM-to-JS-to-Supabase behavior, make minimal safe patches, and verify the fix without rewriting the app structure.
---

# Fix VOLTX Bug

Use this skill when working inside the VOLTX Store project. Favor minimal, local fixes that preserve the current architecture.

## Project Map

- `index.html`, `checkout_system.html`: page structure and static UI entry points
- `style.css`: shared styling, responsive layout, modal sizing, cart/sidebar behavior
- `js/main.js`: page bootstrapping, search sync, mobile menu behavior, product loading
- `js/ui.js`: cart sidebar open/close and toast behavior
- `js/auth.js`: auth modal, account modal, auth button state
- `js/admin.js`: admin button visibility and admin panel behavior
- `js/cart.js`: cart storage and cart mutations
- `js/checkout.js`: checkout steps, order submission, validation
- `js/orders.js`: order loading/rendering
- `js/supabase.js`: Supabase access layer and role/data checks

## Non-Negotiables

- Preserve the existing static-site structure unless the bug strictly requires more.
- Preserve public globals and integration points such as `window.auth`, `window.supabaseAPI`, and existing DOM ids.
- Prefer targeted CSS or JS fixes over broad rewrites.
- Treat mobile regressions as layout, viewport, overflow, and interaction problems first.
- Avoid changing Supabase behavior unless the bug clearly originates there.

## Debug Workflow

1. Reproduce the bug from the user report and identify whether it is layout, event binding, state synchronization, persistence, or Supabase-related.
2. Trace the path end to end: DOM element, listener, state/storage mutation, and API call or rendered output.
3. Inspect nearby responsive rules before editing JS for mobile issues.
4. Patch the smallest surface that resolves the failure.
5. Verify there is no obvious regression in the adjacent flow.

## Common Failure Patterns

### Mobile UI Bugs

- Check for elements hidden in markup with `hidden` plus CSS that expects to reveal them later.
- Check conflicting `display`, `position`, `overflow`, `height`, `100vh`, `100dvh`, and negative margin rules.
- Check fixed/sticky headers, modals, drawers, and bottom padding for safe-area or viewport issues.
- Check whether desktop-only controls are hidden on small screens without a mobile replacement.

### Auth and Account Bugs

- Verify auth button labels and hidden states in both desktop and mobile controls.
- Trace modal open/close behavior and `document.body.style.overflow`.
- Confirm account/admin visibility logic after `auth:changed`.

### Cart and Checkout Bugs

- Confirm cart state is present in storage and survives navigation when expected.
- Trace checkout validation before assuming order persistence is broken.
- Check quantity and remove handlers that rely on delegated selectors or `data-*` attributes.

### Admin and Supabase Bugs

- Verify admin visibility via role checks before changing rendering logic.
- Check Supabase responses, null handling, and async error paths.
- Preserve CRUD form field ids and existing render/update functions.

## Fix Heuristics

- For CSS bugs, patch the narrowest selector that matches the failing viewport.
- For JS bugs, prefer adapting existing listeners or state sync instead of introducing parallel code paths.
- For visibility issues, fix the source of truth first: markup classes, CSS selector precedence, or button-state logic.
- For modal clipping, adjust wrapper height and scroll containers before changing inner content markup.

## Verification

- Re-read the edited selectors and functions after patching.
- Check related flows that share the same component: mobile and desktop variants, open and close states, logged-in and logged-out states, and admin and non-admin states.
- If a real browser check is unavailable, state that clearly and list what still needs manual verification.

## Response Style

- State the root cause in one or two sentences.
- Name the files changed.
- Summarize the behavioral fix, not a line-by-line diff.
- Call out anything not fully verified in-browser.
