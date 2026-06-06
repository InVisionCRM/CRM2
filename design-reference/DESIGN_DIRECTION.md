# Purlin — Design Direction

The single source of truth for visual modernization. Every UI run must follow this.
Visual reference mockups live in [`mockups/dashboard.html`](mockups/dashboard.html) and
[`mockups/lead-detail.html`](mockups/lead-detail.html) — open them and match that level of polish.

Brand: **Purlin** by **In-Vision Construction**. Logo = roof-peak mark with lime "purlin"
stripes on forest green (`mockups/purlin-logo.png`).

---

## Palette

Use these tokens. Do **not** introduce new accent colors.

| Role | Hex | Use |
|------|-----|-----|
| Base background | `#0F1311` → `#131815` | App background (subtle gradient, forest-charcoal — never pure black) |
| Card surface | `#161D18` | Panels, cards |
| Elevated surface | `#1B231D` | Inputs, nested surfaces, hover |
| Hairline | `rgba(236,234,224,.08)` | Borders, dividers |
| Hairline strong | `rgba(236,234,224,.14)` | Emphasized borders |
| **Lime (primary)** | `#A4D65E` (deep `#7FB23F`) | Primary actions, active state, key data **only** — use sparingly |
| Cyan | `#5AD2F4` | Info / links / "scheduled" |
| Amber | `#E8A33D` | Warnings / "files" / pending |
| Violet | `#9B8BD0` | "signed" / secondary status |
| Rose | `#EF5E73` | Destructive / overdue |
| Text | `#ECEAE0` | Headings, primary text (cream) |
| Text dim | `#A7B0A6` | Body / secondary |
| Text faint | `#6E776E` | Labels, captions, placeholders |

### The single most important rule
The app currently overuses a harsh neon green (`#59ff00`) in ~55 places. **Replace neon
with the refined lime `#A4D65E`** and use it sparingly. Neon-everything is the #1 thing
making the app look dated. Accent ≠ default; most surfaces are neutral forest/cream.

---

## System

- **Type:** Inter. Headings 700–800, tight tracking (`-0.02` to `-0.03em`). Body 400–500.
- **Radius:** cards/inputs `12–16px` (rounded-xl). Pills `999px`. Don't go sharp; don't go blobby.
- **Spacing:** 8px grid. Generous padding (cards `18–20px`). Let things breathe.
- **Elevation:** hairline border + soft shadow (`0 12px 32px -12px rgba(0,0,0,.55)`). No hard black borders, no heavy drop shadows.
- **Status colors:** map pipeline/status to the palette above (faint pill backgrounds at ~14% alpha + solid text), not glowing full-saturation chips.
- **Icons:** thin line icons (lucide), `stroke-width 2`, sized 16–20px.
- **Motion:** keep existing transitions; subtle only (`.15s`). Don't add new animations.

## Do
- Match the mockups' calm, professional, dark-forest aesthetic.
- Reuse existing shadcn/Tailwind components and tokens; refine their styling.
- Keep all existing copy, data, structure, and behavior identical.

## Don't (hard limits)
- ❌ No logic, state, data-fetching, routing, or API changes.
- ❌ No new dependencies, no version bumps, no refactors, no "optimizations."
- ❌ No changing what a component does or which props it takes functionally.
- ❌ No new accent colors or fonts beyond what's above.
- ❌ Don't touch tests, config, or non-visual files.

Styling, layout, spacing, color, typography, and presentational markup **only**.
