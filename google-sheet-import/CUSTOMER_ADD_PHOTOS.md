# Customer guide — How to add photos in Google Sheet

Give this to the person updating projects (no coding needed).

---

## Setup once (coder / admin)

1. Create a Google Drive folder: **SayHomes Project Photos**
2. Share that folder with the customer (**Editor**)
3. Share the **Projects** Google Sheet with the customer (**Editor**)
4. Redeploy Apps Script after updating `ProjectsApi.gs` (Drive link support)

---

## Customer steps — add a new photo

### 1. Upload the photo to Drive
1. Open the shared folder **SayHomes Project Photos**
2. Click **New → File upload**
3. Choose the photo from phone/computer

### 2. Get the link
1. Right-click the uploaded photo
2. Click **Share**
3. Set: **Anyone with the link** → **Viewer**
4. Click **Copy link**

Example link:
```
https://drive.google.com/file/d/xxxxxxxx/view?usp=sharing
```

### 3. Paste in Google Sheet
1. Open the **Projects** sheet
2. Find the project row (Owner name)
3. Paste the link:

| Cell | What to paste |
|------|----------------|
| **Cover Image** | Drive link (main photo) |
| **Gallery Images** | One Drive link per line |

For gallery, press **Enter** (or Alt+Enter) for each new photo:

```
https://drive.google.com/file/d/PHOTO1/view?usp=sharing
https://drive.google.com/file/d/PHOTO2/view?usp=sharing
https://drive.google.com/file/d/PHOTO3/view?usp=sharing
```

### 4. Wait / refresh website
Website loads from the sheet automatically.  
Refresh the project page (Ctrl+F5) to see new photos.

---

## Rules for customer

- Always set photo sharing to **Anyone with the link**
- Use **Cover Image** for the main card photo
- Put **all** photos in **Gallery Images** (including cover)
- Keep **Show** = `YES`
- Do not delete header row (row 1)

---

## Update text (name / location)

Edit these columns only:

- **Owner**
- **Title**
- **Location**
- **Description**

Save is automatic in Google Sheets.

---

## Important

Update **both** columns:

1. **Cover Image** = main photo Drive link  
2. **Gallery Images** = all photo Drive links (one per line)

If you change only Cover Image, the gallery may still show old photos.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Photo not showing | Share must be **Anyone with the link** → Viewer |
| Still old photo | Paste new link in **Cover Image** AND **Gallery Images**, then Ctrl+F5 |
| Link looks wrong | Must look like `https://drive.google.com/file/d/.../view` |
| Blank image | Wait 1–2 minutes after sharing, then refresh again |
