
# FTI — Financial Transformation Interface

A bold, brutalist + hand-drawn financial literacy platform. Cream backdrop, neon lime / purple / orange accents, wobbly borders, marker doodles, tilted cards, scroll reveals, and micro-interactions everywhere — never boring fintech.

---

## 🎨 Design system (locked first)

Before any feature, we set the foundation so every screen feels consistent and alive.

- **Palette (HSL tokens in `index.css`)**: cream `#fffbf0` background with subtle SVG noise overlay, ink black `#101010`, neon lime `#ccff00`, purple `#b084ff`, orange `#ff5e00`, plus semantic success/warn/danger.
- **Typography**: Space Grotesk (headings, weight 700–900), Inter (body), Caveat / Permanent Marker (handwritten accents and doodles).
- **Motifs**:
  - Wobbly SVG borders (filter: turbulence) reusable as a `<WobblyCard>` component.
  - Hand-drawn doodles (arrows, circles, underlines, stars) as inline SVG with animated stroke-dashoffset.
  - Tilted cards (-2° to 3°), thick offset shadows (4–8px solid black).
  - Sticker-style badges and chunky buttons with press-down hover.
- **Motion**: Framer Motion for scroll reveals, layout transitions, and chart animations; smooth scroll via Lenis; parallax floating shapes on landing.
- **Micro-interactions**: hover lift + rotate, button press squash, number tickers, confetti on milestones, animated SVG stroke draw-in.

---

## 🧱 App structure & navigation

- **Public**: Landing → Auth (signup/login).
- **Authed shell** with sticky brutalist top nav: Budget · Tax · Investments · Learn · Simulate · Leaderboard · Profile · 🔔 notifications bell with dropdown.
- Mobile: collapsible drawer nav, bottom action bar on key tools.
- Routes: `/`, `/auth`, `/budget`, `/tax`, `/investments`, `/learn`, `/simulate`, `/leaderboard`, `/profile`.

---

## 🔐 Auth & user data (Lovable Cloud)

- Email/password signup and login.
- Onboarding form collects: **name, age, email, phone, location, language**.
- `profiles` table linked to `auth.users` (cascade delete) with RLS so users only read/update their own profile.
- Auto-create profile via DB trigger on signup; `onAuthStateChange` listener set up before `getSession`.
- Logout, session persistence, protected routes.

---

## 💰 Section 1 — Budget management

**A1. Income profile**
- Inputs: job type (gov / private / freelancer), CTC, in-hand salary.
- Tooltips explain CTC, HRA, allowances in plain language with little doodle arrows pointing to fields.

**A2. Loans & CIBIL**
- CIBIL input (300–900) drives an animated gauge meter with the 5-tier color classification (Excellent / Good / Average / Low / Poor) and the exact messages from the spec.
- Dynamic 2–3 improvement tips based on tier (e.g., "Pay credit card in full", "Lower utilization below 30%").
- Loans manager: add/edit/delete multiple loans (principal, rate, tenure) → auto EMI calc → total EMI auto-deducted from in-hand income.

**A3. Budget planner**
- Auto-calculates disposable income (in-hand − total EMI).
- Editable expense categories (Rent, Food, Transport, Utilities, Subscriptions, Other — user can add).
- Animated donut chart breakdown.
- Alert (sticker callout) when savings rate < 20%.
- All values persist per user in Cloud and feed every other section.

---

## 🧾 Section 2 — Tax management

- Side-by-side **Old vs New Regime** comparison table for FY salary inputs.
- Computes deductions, slabs, total tax, take-home for both.
- Highlights better option with a big neon-lime sticker and plain-language reasoning ("New regime saves ₹X because you don't claim 80C deductions").

---

## 📈 Section 3 — Investments

- Monthly investment slider; auto smart allocation across Mutual Funds, FDs, Stocks, Emergency Fund based on age + risk inferred from CIBIL + savings rate.
- SIP growth simulator: tenure + expected return sliders, animated line/area chart of corpus growth, plus "what if you increase by ₹X" toggle.

---

## 📱 Section 4 — Simulation mode (flagship, fully functional)

A **phone-frame interface** in the center of a brutalist desk. All scenarios run real math against the user's saved profile.

- Pre-built scenarios: Rent change, Salary change, New loan, SIP increase, Emergency expense, Overspending.
- Each scenario has live sliders/inputs that recompute on every change:
  - Disposable income, EMI burden %, savings rate, investment capacity, risk level, **Financial Health Score (0–100)**.
- **Before vs After** comparison cards side-by-side with animated counters and color-coded deltas.
- Charts (donut + bar) update live via Framer Motion / Recharts transitions.
- Smart feedback engine returns context-aware messages, e.g. "Rent is 45% of income — recommended < 30%", "This loan pushes EMI burden above 50%".
- Users can **add, edit, delete custom scenarios**, save them per profile.
- Feels like a financial decision game (score badge, streak indicator).

---

## 📚 Section 5 — Learning (AI-powered)

- **Story Mode**: AI-generated real-world journeys (e.g., "Priya's first salary"), generated on demand via Lovable AI edge function and cached.
- **Read Aloud**: browser SpeechSynthesis (free) with play/pause/speed controls; upgrade path noted for ElevenLabs.
- **Lessons + Quizzes**: AI generates a lesson + 3–5 MCQ quiz per topic; user answers update points.
- **Mini-game**: "Spend vs Save" rapid-fire decision cards with score and feedback.
- All AI calls go through edge functions with rate-limit (429) and credits (402) errors surfaced as toasts.

---

## 🏆 Section 6 — Leaderboard

- Global ranking by points earned from simulations completed, lessons finished, quiz accuracy, mini-game scores.
- Badges (sticker style) for milestones: first sim, 10 lessons, perfect quiz, savings champ.
- Top 3 podium with tilted cards; full ranked list below with current user highlighted.

---

## 👤 Profile

- Avatar, name, age, location, language switch (i18n-ready, English shipped; structure supports adding Hindi/regional later without refactor).
- **Financial Health Score (0–100)** computed from savings rate, debt-to-income, investment ratio, EMI load — shown on a big animated meter (Poor → Excellent).
- Monthly snapshot card: income, savings, investments, biggest expense.
- Personalized AI suggestions ("Increase SIP by ₹2k", "Pay down loan #2 first").

---

## 🔔 Notifications

- Bell icon with badge count and dropdown panel.
- Smart triggers: overspending (savings < 20%), low CIBIL (< 650), positive investment growth milestones, generic tax-season reminder.
- Stored per user; mark as read; cleared individually or all at once.

---

## 🗄️ Data model (Lovable Cloud)

- `profiles` (id, name, age, email, phone, location, language)
- `income_profiles`, `loans`, `expenses`
- `cibil_history`
- `investments_config`
- `simulations` (custom user scenarios + saved snapshots)
- `learning_progress` (lessons, quizzes, story reads)
- `game_scores`, `points`, `badges`
- `notifications`
- All tables RLS-protected: users access only their own rows; leaderboard exposed via a security-definer function returning aggregate public columns only.

---

## 🚀 Build order

1. Design system + landing page + auth + onboarding.
2. Authed shell, nav, profile shell, notifications scaffold.
3. Budget (income → CIBIL → loans → planner) with persistence.
4. Tax comparison.
5. Investments + SIP simulator.
6. Simulation mode (the centerpiece).
7. Learning with AI edge function.
8. Leaderboard + badges + Financial Health Score wiring.
9. Polish: animations, scroll reveals, doodles, mobile pass.

---

## ⚙️ Tech choices

- React + Vite + TypeScript + Tailwind (existing).
- Framer Motion (animations), Lenis (smooth scroll), Recharts (charts), Lucide (icons), Zod (validation), Sonner (toasts).
- Lovable Cloud for auth/DB/edge functions; Lovable AI Gateway (default `google/gemini-3-flash-preview`) for learning content.
- i18n scaffolding with `react-i18next` so additional languages drop in later.
