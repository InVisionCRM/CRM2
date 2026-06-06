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
| [ ] | Nav / sidebar / app shell | `nav-shell` | — | — |
| [ ] | Dashboard / home | `dashboard` | — | — |
| [ ] | Leads table (list view) | `leads-table` | — | — |
| [ ] | Lead detail page | `lead-detail` | — | — |
| [~] | Calendar | `calendar` | [#7](https://github.com/InVisionCRM/CRM2/pull/7) | 2026-06-06 |
| [ ] | Files / Drive | `files-drive` | — | — |
| [ ] | Roof estimator | `roof-estimator` | — | — |
| [ ] | Auth / login | `auth-login` | — | — |
| [ ] | Settings | `settings` | — | — |
| [ ] | Shared UI primitives (buttons, inputs, cards, dialogs) | `ui-primitives` | — | — |

> Add a row if you discover a real section that's missing. Never duplicate an existing slug.

## Log
<!-- Each run appends one line: YYYY-MM-DD · <slug> · <PR url> · one-line summary -->
- 2026-06-06 · calendar · https://github.com/InVisionCRM/CRM2/pull/7 · Restyled calendar month grid, day-detail view, event chips, and tooltip to forest/cream tokens with refined lime accent.
