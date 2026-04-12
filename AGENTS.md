# 🤖 AGENTS.md — VOLTX E-Commerce Assistant

## 📌 Project Overview
This is a vanilla JavaScript e-commerce website using Supabase as backend.

Core features:
- Product catalog (Supabase)
- Cart system (in-memory + sessionStorage)
- Checkout multi-step
- Authentication (Supabase Auth)
- Order system (Supabase DB)
- Admin panel (CRUD products + orders)

Tech stack:
- HTML, CSS, Vanilla JS
- Supabase (Auth, DB, Storage)

---

## 🎯 Agent Goal
The agent must:
- Fix bugs WITHOUT breaking existing features
- Improve code quality (clean, modular, readable)
- Maintain compatibility with current structure
- Avoid unnecessary rewrites

---

## ⚠️ Critical Rules

1. ❌ DO NOT rewrite entire project
2. ❌ DO NOT change Supabase schema unless required
3. ❌ DO NOT break authentication flow
4. ❌ DO NOT remove global window APIs (window.auth, window.supabaseAPI, etc.)
5. ✅ ALWAYS keep backward compatibility
6. ✅ ALWAYS explain root cause before fixing bug

---

## 🧠 Architecture Understanding

### 🔐 Auth System
- File: `js/auth.js`
- Uses Supabase Auth
- Session stored in memory (cachedUser)
- UI controlled via DOM + modal

---

### 🛒 Cart System
- File: `js/cart.js`
- In-memory only (NO localStorage persistence)
- Uses:
  - `getCartItems()`
  - `addToCart()`
  - `updateQuantity()`

⚠️ Important:
Cart resets on reload → DO NOT change unless explicitly asked

---

### 💳 Checkout System
- File: `js/checkout.js`
- Multi-step form:
  1. Shipping
  2. Shipping Method
  3. Payment
  4. Confirmation

Uses:
- sessionStorage (`checkoutData`, `pendingCart`)

---

### 📦 Orders System
- File: `js/orders.js`
- Stored in Supabase (`orders` table)

Important:
- Must include `user_id`
- Uses:
  - `ordersAPI.createOrder()`
  - `ordersAPI.loadOrders()`

---

### 🛠️ Admin Panel
- File: `js/admin.js`
- Features:
  - CRUD products
  - View orders

Important:
- Role check via Supabase (`profiles.role`)
- Uses:
  - `supabaseAPI.isAdmin()`

---

### ☁️ Supabase Layer
- File: `js/supabase.js`

Handles:
- Auth
- Products CRUD
- Orders CRUD
- Storage upload

⚠️ DO NOT break:
- `toDbProduct()` mapping
- `fromDbProduct()` mapping

---

## 🐞 Common Bug Areas (HIGH PRIORITY)

1. Auth not updating UI
2. Cart not syncing UI
3. Checkout validation issues
4. Orders not saved to Supabase
5. Admin role not detected
6. Image upload failure

---

## 🧪 Debug Strategy

When fixing bugs:

1. Identify affected module:
   - auth / cart / checkout / admin / supabase

2. Trace flow:
   - UI → JS → API → Supabase

3. Check:
   - null/undefined
   - async/await errors
   - DOM element existence

4. Fix minimally (no over-engineering)

---

## 🧩 Coding Style Rules

- Use vanilla JS (NO frameworks)
- Keep functions small & readable
- Avoid global pollution (except existing pattern)
- Use async/await (not then chains if possible)
- Always handle errors (try/catch)

---

## 🚀 Allowed Improvements

- Fix bugs
- Improve validation
- Improve UX (without redesign)
- Optimize code readability
- Add missing error handling

---

## ❌ Forbidden Changes

- Migrating to React/Vue
- Changing database structure without request
- Removing existing features
- Breaking admin panel
- Changing storage logic

---

## 🧠 Example Tasks

### Fix bug
"Fix checkout error when user clicks next step"

### Improve
"Improve validation on login form"

### Debug
"Why order not saved to Supabase?"

---

## 🧾 Notes

- Project is demo-level (no payment gateway)
- Focus on stability over scalability
- UI heavily tied to DOM → be careful when modifying selectors

---

## 💡 Agent Behavior

When responding:
1. Explain issue clearly
2. Show root cause
3. Provide minimal fix
4. Avoid unnecessary refactor