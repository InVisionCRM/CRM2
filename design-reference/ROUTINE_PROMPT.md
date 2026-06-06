# Routine prompt — paste this as the scheduled agent's instruction

You are doing a **visual-only design modernization** of the Purlin CRM. One section per run.
You have no memory of previous runs — the repo files below are your memory. Follow them exactly.

## Step 1 — Load context (do this first, every run)
1. Read `design-reference/DESIGN_DIRECTION.md` — the palette, system, and hard limits.
2. Open the mockups `design-reference/mockups/dashboard.html` and `lead-detail.html` — match that polish.
3. Read `design-reference/UI_MODERNIZATION.md` — the progress checklist.

## Step 2 — Pick exactly one section (anti-repeat — this is critical)
- Run `gh pr list --state all --json headRefName --limit 100` and `git branch -a`.
- A section is **off-limits** if: it's marked `[x]` or `[~]` in the checklist, **or** a branch/PR
  named `ui/<slug>` already exists (open OR merged).
- Choose the **first** available `[ ]` section in the table. That slug is the only thing you touch.
- **If every section is off-limits: STOP. Open no PR. Report "All sections complete — nothing to do."**
  Do not invent work and do not re-polish a finished section.

## Step 3 — Make the changes (visual only)
- Create branch `ui/<slug>`.
- Restyle only that section's components to match `DESIGN_DIRECTION.md` and the mockups:
  spacing, color, typography, radius, borders, shadows, presentational markup.
- **Hard limits (do not cross):** no logic, state, data-fetching, routing, API, dependency,
  version, refactor, test, or config changes. No new colors or fonts. If a change requires
  touching behavior, skip it and note it in the PR instead.
- Replace harsh neon `#59ff00` with refined lime `#A4D65E`, used sparingly. Keep all copy and behavior identical.

## Step 4 — Verify before opening the PR (gate)
- Run `npm run typecheck` and `npm run lint`. Both must pass.
- Run `npm run build`. It must succeed.
- If any fail and you can't fix it within the visual-only limits, **revert and abort the run**
  (open no PR; report what blocked you). Never open a PR on a red build.

## Step 5 — Record + PR (one PR per run)
1. In `design-reference/UI_MODERNIZATION.md`: set the section to `[~]`, fill in its PR column and
   date, and append a one-line entry under `## Log`. Commit this in the same branch.
2. `gh pr create` against `main`. Title: `Modernize UI: <Section name>`. Body must list:
   files restyled, a short before/after note, and an explicit "No behavior/logic changed" line.
3. Report the PR URL. Done — exactly one section, one PR, this run.

## Guardrails recap
Visual polish only. Site already works — don't optimize it, don't refactor it, don't break it.
One section per run. If unsure whether something is "visual," leave it alone.
