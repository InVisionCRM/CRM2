# UI Modernization — Progress Checklist

This file is the memory of the design routine. It is read at the start of **every** run and
updated at the end of every run. It exists so the routine never redoes a section it already did.

**Status legend:** `[ ]` todo · `[~]` in progress (PR open) · `[x]` done (PR merged)

## How a run uses this file
1. Read this list top to bottom.
2. A section is **off-limits** if it is `[x]` OR `[~]`, OR an open/merged PR/branch named
   `ui/<section-slug>` already exists. Skip all off-limits sections.
3. Take the **first** available `[ ]` section. That is the only section this run touches.
4. If every section is off-limits, do **nothing**: open no PR, and report "all sections complete —
   nothing to do." (Do not invent work or re-polish a finished section.)
5. After the work, set the chosen section to `[~]`, fill in the PR link and date, and include
   this file's update in the same PR.

## Sections (one per run, in order)

| Status | Section | Slug | PR | Date |
|--------|---------|------|----|----|
| [~] | Nav / sidebar / app shell | `nav-shell` | https://github.com/InVisionCRM/CRM2/pull/3 | 2026-06-06 |
| [~] | Dashboard / home | `dashboard` | [#4](https://github.com/InVisionCRM/CRM2/pull/4) | 2026-06-06 |
| [~] | Leads table (list view) | `leads-table` | [#5](https://github.com/InVisionCRM/CRM2/pull/5) | 2026-06-06 |
| [~] | Lead detail page | `lead-detail` | [#6](https://github.com/InVisionCRM/CRM2/pull/6) | 2026-06-06 |
| [ ] | Calendar | `calendar` | — | — |
| [ ] | Files / Drive | `files-drive` | — | — |
| [ ] | Roof estimator | `roof-estimator` | — | — |
| [ ] | Auth / login | `auth-login` | — | — |
| [ ] | Settings | `settings` | — | — |
| [ ] | Shared UI primitives (buttons, inputs, cards, dialogs) | `ui-primitives` | — | — |

> Add a row if you discover a real section that's missing. Never duplicate an existing slug.

## Log
<!-- Each run appends one line: YYYY-MM-DD · <slug> · <PR url> · one-line summary -->
- 2026-06-06 · nav-shell · https://github.com/InVisionCRM/CRM2/pull/3 · Refined bottom nav + app shell to forest-charcoal palette, swapped harsh neon for lime #A4D65E, calmer borders/shadows.
- 2026-06-06 · dashboard · [#4](https://github.com/InVisionCRM/CRM2/pull/4) · Replaced neon `#59ff00` with refined lime `#A4D65E` across hero, dividers, my-leads, weather loader; restyled UpcomingEvents/RecentUploads/RecentActivities/RecentEmails cards to dark-forest palette with hairline borders and soft shadow.
- 2026-06-06 · leads-table · https://github.com/InVisionCRM/CRM2/pull/5 · Restyled spreadsheet view, view toggle, pagination, status pills, loading skeleton, and collapsed lead row to the forest/cream palette; replaced harsh neon with refined lime.
- 2026-06-06 · lead-detail · https://github.com/InVisionCRM/CRM2/pull/6 · Restyle lead detail page: refined lime accents, calmer quick-action surfaces, dark-forest overlays, hairline dividers, tracked-out section labels.
