# SayHomes Packages — Google Sheet (full content)

**Sheet:** https://docs.google.com/spreadsheets/d/19MVCeWzCCS7kORemCrGnf9emsy6__gYteo2UcywE2Ok/edit

## One tab: `Packages`

### Row 1 headers (8 columns)

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Package Name | Old Price | New Price | Sort Order | Show | Section Title | Section Sort | Details |

### How to fill

- **One row per section** (76 rows = 19 sections × 4 packages)
- Package name and prices **repeat** on every row for that package
- **Details** — one bullet per line. Press **Alt+Enter** in the cell for a new line

### Example — Warranty & Guarantee (Essential)

| Package Name | Old Price | New Price | Sort Order | Show | Section Title | Section Sort | Details |
| Essential | 2060 | 1990 | 1 | YES | Warranty & Guarantee | 19 | 1. Construction guarantee - 1 Year<br>2. Waterproofing warranty - 5 Years Guarantee & warranty is provided |

### Import all data at once

**File → Import → Upload** → `google-sheet-import/Packages.csv`

### Apps Script

Paste `google-apps-script/PackagesApi.gs` → Deploy → Web app (Anyone)

URL in `js/packages-loader.js`

### Customer workflow

Edit any row in the sheet → save → refresh `packages.html`
