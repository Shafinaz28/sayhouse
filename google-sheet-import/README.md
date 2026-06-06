# Google Sheet import — one tab

**Sheet:** https://docs.google.com/spreadsheets/d/19MVCeWzCCS7kORemCrGnf9emsy6__gYteo2UcywE2Ok/edit

## Import

1. Open the spreadsheet (one tab is enough — `Sheet1` or rename to `Packages`).
2. **File → Import → Upload** → select **`Packages.csv`**
3. Import location: **Replace current sheet**

## Column headers (row 1)

`Package Name | Old Price | New Price | Sort Order | Show | Section Title | Section Sort | Details`

76 data rows = 19 sections × 4 packages.

## Regenerate

```bash
node scripts/extract-packages-csv.mjs
```

Then redeploy Apps Script if you changed `google-apps-script/PackagesApi.gs`.
