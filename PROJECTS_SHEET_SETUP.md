# SayHomes Projects — Google Sheet (like Packages)

Update project name, location, description, and image URLs in Google Sheets → refresh the website.

## 1. Create the sheet tab

Use your **Packages** spreadsheet (or a new spreadsheet) and add a tab named **`Projects`**.

### Row 1 headers (12 columns)

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Type | Owner | Title | Location | Description | Sector | Project Key | Cover Image | Gallery Images | Video URL | Sort Order | Show |

### Column guide

| Column | Example | Notes |
|--------|---------|--------|
| **Type** | `building` | `building`, `interior`, or `commercial` |
| **Owner** | `Mr. Yatheesh` | Client / project name |
| **Title** | `Ylnk` | Plot or project subtitle |
| **Location** | `Bengaluru` | Shown on cards & detail pages |
| **Description** | Short text | Card description on listing pages |
| **Sector** | `institutions` | Commercial only: `institutions`, `hospitality`, `nonprofit`, `commercial`, `peb` |
| **Project Key** | `leaders` | Commercial only: URL slug key |
| **Cover Image** | `https://...` or `interior/Sheela.jpg` | Main card image URL |
| **Gallery Images** | one URL per line | Alt+Enter in cell for multiple images |
| **Video URL** | YouTube embed | Commercial optional |
| **Sort Order** | `1` | Lower numbers appear first |
| **Show** | `YES` | `NO` hides the project |

### Example row — Building

```
building | Mr. Yatheesh | Ylnk | Bengaluru | Residential construction at Ylnk | | | ./residentail images/Ylnk.jpg | ./residentail images/Ylnk.jpg
./residentail images/Ylnk1.jpg | | 1 | YES
```

### Example row — Interior

```
interior | Mrs. Sheela | 1BHK, HAL | Bengaluru | Compact 1BHK interior | | | interior/Sheela.jpg | interior/Sheela.jpg
interior/Sheela1.jpg | | 2 | YES
```

### Example row — Commercial

```
commercial | Leaders International School, Gauribidanur | | Gauribidanur | School project | institutions | leaders | commercial/leaders-1.jpg | commercial/leaders-1.jpg
commercial/leaders-2.jpg | https://www.youtube.com/embed/RRxhaxwYwN8 | 1 | YES
```

### Import ALL website projects (ready-made file)

**File → Import → Upload** → `google-sheet-import/Projects.csv`

This file contains **49 projects** already exported from your website:

| Type | Count |
|------|-------|
| Building construction | 22 |
| Interior | 19 |
| Commercial | 10 |

To regenerate after you change project data on the site, run:

```bash
node scripts/generate-projects-csv.js
```

Then re-import or paste the updated CSV into the **Projects** tab.

---

## 2. Apps Script

1. Open the spreadsheet → **Extensions → Apps Script**
2. Add file `ProjectsApi.gs` (from `google-apps-script/ProjectsApi.gs` in this repo)
3. Change `ADMIN_SECRET` in the script to your own password
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the **Web App URL**

---

## 3. Connect the website

Paste the URL in:

- `js/projects-loader.js` → `PROJECTS_API_URL`
- `admin-project-form.html` → `PROJECTS_FORM_URL`

Refresh:

- `BuildingConstruction.html`
- `interior.html`
- `commercial-works.html`
- Project detail pages

If the sheet is empty or the URL is blank, the site uses the built-in `js/*-projects-data.js` files.

---

## 4. Add projects via form (optional)

Open **`admin-project-form.html`** on your site (or host it privately).

- Fill type, name, location, image URLs
- Submit → row is added to the **Projects** sheet
- Refresh project pages to see updates

You can also use **Google Forms** linked to the same sheet tab.

---

## 5. Images

- Host images on your website folder (`interior/`, `commercial/`, etc.) **or**
- Upload to Google Drive → **Anyone with link** → paste the direct image URL in the sheet

Use full URLs or site-relative paths like `interior/Sheela.jpg`.
