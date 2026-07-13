# Import SayHomes Projects into Google Sheets

## File to import
`google-sheet-import/Projects.csv`

This file has:
- Correct header row
- All building / interior / commercial projects from your website

---

## Step 1 — Create a new Google Sheet
1. Go to [https://sheets.google.com](https://sheets.google.com)
2. **Blank** spreadsheet
3. Rename it: `SayHomes Projects`

## Step 2 — Import the CSV
1. In the sheet: **File → Import → Upload**
2. Choose: `google-sheet-import/Projects.csv`
3. Import location: **Replace spreadsheet**
4. Separator type: **Comma**
5. Click **Import data**

6. Rename the tab (bottom) to exactly: **Projects**

## Step 3 — Add Apps Script
1. **Extensions → Apps Script**
2. Delete everything in `Code.gs`
3. Open on your PC: `google-apps-script/ProjectsApi.gs`
4. Copy **all** → paste into Apps Script
5. **Save**

## Step 4 — Deploy Web App
1. **Deploy → New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. **Deploy**
6. Copy the Web App URL (ends with `/exec`)

## Step 5 — Test
Open the `/exec` URL in Chrome.

You should see JSON starting with:
```json
{"ok":true,"building":[...],...}
```

If you see `Script function not found: doGet`, you did not paste `ProjectsApi.gs` or did not deploy a new version.

## Step 6 — Connect website
Paste the new URL into:
- `js/projects-loader.js` → `PROJECTS_API_URL`
- `admin-project-form.html` → `PROJECTS_FORM_URL`

Then refresh Building / Interior / Commercial pages.

---

## Sheet columns (row 1)

| Type | Owner | Title | Location | Description | Sector | Project Key | Cover Image | Gallery Images | Video URL | Sort Order | Show |

- **Type:** `building` | `interior` | `commercial`
- **Show:** `YES` to show on website, `NO` to hide
- **Cover Image / Gallery:** site paths like `interior/Sheela.jpg` or full image URLs
- **Gallery Images:** one path per line (Alt+Enter in the cell)

## Admin form secret
Same as in Apps Script: `sayhomes-projects-2026`
