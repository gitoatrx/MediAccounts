# Bimble Design System

**Bimble** is a Canadian healthcare appointment platform. It brings booking, identity
verification, AI-assisted documentation, and recovery/delivery workflows into one place
so **patients** and **clinics** move through care with less friction. The product's own
words: *"Healthcare that stays connected, from your first click to final recovery,"* and
the recurring promise — **"More medicine. Less admin."**

This design system was reverse-engineered from the product's frontend source so design
agents can produce on-brand Bimble interfaces, marketing, and prototypes.

---

## Sources

Everything here was derived from one GitHub repository (read it for deeper fidelity):

- **`gitoatrx/Bimble-Pro-Frontend-2026`** — https://github.com/gitoatrx/Bimble-Pro-Frontend-2026
  A Next.js 16 + React 19 + Tailwind v4 app. Two surfaces live inside it:
  the **marketing site** (`components/*.tsx`, `app/page.tsx`) and the
  **clinic registration / "Pro" onboarding flow** (`app/login`, `app/onboarding/*`,
  `components/clinic-access/*`). Design tokens: `app/globals.css`. Type setup:
  `app/layout.tsx`. Plans/data: `lib/clinic/*`.

Related repos the user also referenced and worth exploring for more context:
`gitoatrx/Bimble_Pro_v1_2026` and `ayushr2407/liveoscar`.

> The reader may not have access to these repos. If you do, browse them to lift exact
> markup, copy, and component structure beyond what is captured here.

---

## The two products / surfaces

1. **Marketing site** — public landing aimed at both patients and clinics. Sticky glass
   header, oversized hero with floating "product peek" cards, alternating
   who-we-serve / how-it-works / benefits sections, a patients↔clinics tab toggle, an
   FAQ accordion, and a dark footer. Light, airy, lots of whitespace and soft shadows.
   → see `ui_kits/marketing/`

2. **Clinic onboarding ("Bimble Pro")** — the flow a clinic uses to sign up: choose a
   plan → enter card details → 3-step clinic setup form → receive credentials → log in.
   A calmer, more utilitarian chrome: a thin top bar, a single centered column, neutral
   slate borders, step progress bar, and "Step N of 3" pills.
   → see `ui_kits/clinic-onboarding/`

Both share the same tokens (primary `#5c70ff`, Inter/Montserrat, rounded cards) but the
marketing site leans **periwinkle-tinted and expressive** while the Pro flow leans
**neutral slate and focused**.

---

## CONTENT FUNDAMENTALS

**Voice:** calm, reassuring, plain-spoken. The product sells *less friction* and *calmer
clinic days*, so the language never hypes or shouts. Phrases like
*"a clear, anxiety-free process,"* *"calmer care workflows,"* and *"Built for calmer
clinic days"* set the tone.

**Person:** speaks **to** the reader as **"you / your"** ("Manage your healthcare in one
secure home," "from your first click to final recovery"). The brand refers to itself in
the third person — **"Bimble brings…"**, **"Bimble works with…"** — never "we."

**Casing:**
- Headlines and card titles are **sentence case** ("Choose your plan," "More medicine.
  Less admin.," "A calmer, more sustainable clinic day"). Only "Bimble" and proper nouns
  are capitalized.
- **Eyebrows** above section titles are **ALL CAPS with wide letter-spacing**
  ("HOW IT WORKS," "WHO WE SERVE," "BENEFITS," "REASSURANCE").
- Buttons use **Title Case** for short CTAs ("Book a Demo," "Clinic Register,"
  "Choose plan," "Start trial and continue").
- Feature/data pills are short fragments, sentence case ("fast access,"
  "hours saved weekly," "extra tabs").

**Sentence style:** short, concrete, benefit-led. Frequently a punchy fragment headline
followed by one plain explanatory sentence. Lists of 3 are the dominant rhythm (three
bullets, three stats, three cards).

**Numbers as proof:** specific, repeated stats carry the value prop —
**"20+ hours"** weekly admin cut, **"84%"** fewer administrative tasks,
**"15 minutes"** to see a doctor. Keep these exact when reusing.

**Domain specifics:** Canadian — prices in **CAD** ("CAD 149 / month"), Canadian
**provinces**, Canadian **postal codes** (`V6B 1A1`), 10-digit phone formatting
(`604 555 0142`). Trials are **90-day**. Clinic security uses **"Secure OTP"** and a
4-digit **PIN**. AI is always framed as assistive, never autonomous:
*"Your doctor remains the final authority."*

**Emoji:** none. Never used. Meaning is carried by Lucide line icons instead.

**Vibe in one line:** a trustworthy, modern Canadian health-tech brand that wants to feel
*soothing and competent*, not clinical or corporate.

---

## VISUAL FOUNDATIONS

**Color.** One hero color does all the lifting: **periwinkle indigo `#5c70ff`** (primary).
It appears solid on primary buttons and number badges, and at low alpha everywhere else —
`primary/5` for tinted panels and eyebrow chips, `primary/10` for icon chips and "Live"
badges, `primary/20` for the selected-plan ring. Text is near-black slate `#0f172a`;
supporting copy is slate-500 `#64748b`. Borders are a **soft periwinkle `#dbe3ff`**, not
gray — a subtle but defining choice. Nested panels inside white cards use slate-50
`#f8fafc`. The only dark surface is `#0b1220` (footer + dark CTA). Destructive is `#dc2626`.
A full dark theme exists in source but the shipped app runs light.

**Type.** Two Google families. **Montserrat** for every heading (`.font-display`), set
**tight** — section titles at `-0.04em`, the hero at a dramatic `-0.08em` with `0.96`
line-height so it reads as one dense block. **Inter** for all body, UI, labels, and even
"mono." The signature typographic move is the **11px uppercase eyebrow** with `0.28em`
tracking in primary color sitting above a tight sentence-case headline.

**Spacing & layout.** Generous. Sections are `py-20` (80px) tall; content sits in a
`max-w-7xl` centered container with `px-4/6/8` responsive gutters. Marketing is built on
asymmetric 2-column grids (e.g. `0.95fr 1.05fr`). The Pro flow is a single centered
`max-w-2xl` column. Lists/cards are spaced with flex/grid `gap`, not margins.

**Backgrounds.** No photography, no illustration, no heavy gradients. Marketing pages get
a barely-there **ambient radial glow** — primary at 8% top-left, slate at 4% top-right,
`background-attachment: fixed`. Everything else is flat `#f8fafc`/white. "Imagery" is
faked with **floating UI-mock cards** (a booking panel, a visit summary, a recovery path)
— the product shows itself rather than stock photos.

**Corner radii.** Very rounded, layered by scale: pills/badges fully round; buttons &
inputs `rounded-xl` (12px); standard cards `rounded-2xl` (16px); nested panels `1.5rem`
(24px); big marketing feature cards `2rem` (32px); the hero mock cards `1.9rem`.

**Cards.** White fill, 1px `#dbe3ff` border, `shadow-sm`. Floating hero/peek cards get a
big soft drop shadow `0 24px 72px rgba(15,23,42,0.12)`. A "recommended" / selected card is
distinguished by a **primary border + `ring-2 ring-primary/20`**, never by fill. Inside
cards, sub-items are slate-50 rounded-2xl rows with an icon chip on the left.

**Icon chips.** The repeated unit: a `rounded-2xl` square of `bg-primary/10` (sizes
~h-11 to h-16) holding a primary Lucide icon. Numbered steps use a **solid primary**
`rounded-2xl` square with white numerals.

**Badges & pills.** `rounded-full`. Status badges: `bg-primary/10 text-primary` ("Live,"
"Ready"). Eyebrow chips in the Pro flow: `border border-primary/15 bg-primary/5
text-primary` uppercase ("Step 1 of 3"). Audience chips: white, `#dbe3ff` border, shadow-sm.

**Buttons.**
- *Primary*: solid `#5c70ff`, white text, `rounded-xl`, `shadow-sm`, height 44–48px.
- *Outline*: white fill, `#dbe3ff` border, foreground text.
- *Secondary*: pale indigo `#eef2ff` fill.
- *Ghost*: transparent, used for inline "Show/Hide" toggles in primary color.
- *Dark*: `#0f172a` fill, white text (used for the non-selected "Choose plan" CTA).

**Hover states.** Buttons: primary darkens to `primary/90` and **lifts** with
`-translate-y-0.5` + a deeper shadow; outline buttons shift border to `primary/30` and
fill to `accent/40`. Cards that are clickable lift `-translate-y-0.5` and border goes
`primary/40`. Links fade from `foreground/75` to full `foreground` (or `white/65 → white`
in the footer).

**Press / active & focus.** No deliberate shrink on press. Focus is a
`ring-2 ring-ring` (primary) with `ring-offset-2`. Inputs focus to `ring-2 ring-primary/20`.

**Transitions / animation.** Restrained and quick: `transition-all` / `transition-colors`
with default ~150ms easing. The only explicit durations are the accordion chevron rotate
(`duration-200`) and the onboarding progress bar (`duration-300`). `scroll-behavior: smooth`
on html. No bounces, no springs, no parallax — motion is limited to subtle lifts, fades,
and rotations. Loading states use `animate-pulse` skeletons.

**Transparency & blur.** Used purposefully: the sticky header is `bg-white/85
backdrop-blur-xl` (and `bg-white/90 backdrop-blur` on the Pro top bar). Decorative blur
appears once — a `blur-3xl` primary/10 orb behind the hero mock stack. Footer link/border
opacity steps (`white/10`, `white/55`, `white/65`) create hierarchy on dark.

**Borders & dividers.** Hairline 1px throughout, in `#dbe3ff` on light and `white/10` on
dark. Internal card dividers are a single `h-px bg-border` rule.

**Imagery color vibe.** N/A — there is no photography. The palette itself reads **cool,
soft, and calm** (periwinkle + slate + white), which is the intended emotional register.

---

## ICONOGRAPHY

Bimble uses **[Lucide](https://lucide.dev)** exclusively — the source imports
`lucide-react` and renders icons as inline SVG. They are thin, rounded-cap, **stroke-only
(no fill)** line icons at ~`h-4`/`h-5`/`h-6` (16–24px), almost always in the **primary
color** when sitting inside a `primary/10` chip, or `muted-foreground` for inert UI
affordances (chevrons, eye toggles).

**Icons actually used in the product** (reuse these before reaching for others):
`ArrowRight`, `ArrowLeft`, `ChevronRight`, `ChevronDown`, `Menu`, `X`, `Check`,
`Sparkles`, `Eye`, `EyeOff`, `Clock`, `Brain`, `FileText`, `Package`, `Smartphone`,
`Truck`, `ShieldCheck`, `MessageSquare`, `Users`, `Heart`, `Monitor`.

**In HTML artifacts**, load Lucide from CDN and instantiate:
```html
<script src="https://unpkg.com/lucide@latest"></script>
<i data-lucide="arrow-right"></i>
<script>lucide.createIcons();</script>
```
(kebab-case names: `ArrowRight` → `arrow-right`, `ShieldCheck` → `shield-check`.)

**No icon font, no PNG/sprite icons, no emoji, no unicode glyphs** are used. The only
brand "logo" is **typographic**: a capital **"B"** (bold) centered in a `rounded-2xl`
solid-primary square, paired with the wordmark "Bimble" and a tiny uppercase
`HEALTHCARE PLATFORM` kicker. There is no image logo file in the repo — recreate the mark
in markup. See `assets/logo.html` for a ready-to-copy version.

---

## Index — what's in this design system

Root files:
- **`README.md`** — this file.
- **`colors_and_type.css`** — all color tokens, radii, shadows, font families, and
  semantic type classes (`.bm-hero`, `.bm-h2`, `.bm-eyebrow`, `.bm-lead`, …). Import this
  into any HTML artifact.
- **`SKILL.md`** — Agent-Skill manifest so this folder works in Claude Code.

Folders:
- **`assets/`** — the Bimble logo mark (`logo.html`) and any reusable brand snippets.
- **`fonts/`** — note on the Google Fonts used (Inter, Montserrat) + the CDN link.
- **`preview/`** — small specimen cards that populate the Design System tab (colors, type,
  spacing, components, brand). Not meant to be used directly — they document the system.
- **`ui_kits/marketing/`** — high-fidelity recreation of the marketing site
  (`index.html` + JSX components). Header, hero, sections, FAQ, footer.
- **`ui_kits/clinic-onboarding/`** — high-fidelity recreation of the Bimble Pro
  registration flow (`index.html` + JSX components). Plan → billing → setup → login.

Start with `README.md` and `colors_and_type.css`, then open the relevant `ui_kits/*/index.html`.
