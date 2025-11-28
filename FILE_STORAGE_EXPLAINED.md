# 💾 File Storage - How It Works

## Quick Answer

**✅ YES - Files are stored permanently on disk!**

Uploaded files are **NOT** lost on:
- ✅ Page refresh
- ✅ Browser close
- ✅ Backend restart
- ✅ Frontend restart

They persist **until you upload a new file to replace them**.

---

## How It Works

### Storage Location

```
PLM-Hackaton/
├── backend/
│   └── app.py
├── data/                    ← Files stored here!
│   ├── MES_Extraction.xlsx  ← Permanent storage
│   ├── ERP_Equipes Airplus.xlsx
│   └── PLM_DataSet.xlsx
└── App/
    └── src/
```

**Path:** `data/` folder (same level as `backend/` and `App/`)

---

### Upload Process

**Step 1: You upload a file**
```
User clicks "Choose MES File" → Selects "my_new_data.xlsx"
```

**Step 2: Frontend sends to backend**
```typescript
// Frontend
uploadFile(file, 'mes')
// POST /api/v2/upload
// FormData: { file: File, type: 'mes' }
```

**Step 3: Backend saves to disk**
```python
# backend/app.py (Line 324-333)
file_mapping = {
    'mes': 'MES_Extraction.xlsx',
    'erp': 'ERP_Equipes Airplus.xlsx',
    'plm': 'PLM_DataSet.xlsx'
}

target_filename = file_mapping['mes']  # 'MES_Extraction.xlsx'
filepath = os.path.join('data', target_filename)
# Result: 'data/MES_Extraction.xlsx'

file.save(filepath)  # Saves to disk!
```

**Step 4: File is on disk permanently**
```
data/MES_Extraction.xlsx  ← Your uploaded file (replaced the old one)
```

---

## File Naming

Uploaded files are **renamed** to standard names:

| You upload          | Saved as                    | Location                          |
|---------------------|-----------------------------|-----------------------------------|
| `my_mes_data.xlsx`  | `MES_Extraction.xlsx`       | `data/MES_Extraction.xlsx`        |
| `employees_2024.xlsx` | `ERP_Equipes Airplus.xlsx` | `data/ERP_Equipes Airplus.xlsx`   |
| `components.xlsx`   | `PLM_DataSet.xlsx`          | `data/PLM_DataSet.xlsx`           |

**Why?**
- Consistent filenames make backend code simpler
- Always knows where to find MES/ERP/PLM data
- No need to track user-provided filenames

---

## Persistence

### ✅ Data Persists Through:

**1. Page Refresh (F5)**
- Files stay in `data/` folder
- Backend still has them loaded
- Frontend re-fetches on page load
- **Result:** Same data appears

**2. Browser Close**
- Files are on disk, not in browser
- **Result:** Data still there when you reopen

**3. Backend Restart**
```bash
# Stop backend (Ctrl+C)
# Restart
python app.py

# On startup:
✅ Loaded ERP data: 150 rows
✅ Loaded MES data: 56 rows
✅ Loaded PLM data: 40 rows
# Same data loaded from disk!
```

**4. Frontend Restart**
```bash
# Stop frontend (Ctrl+C)
# Restart
npm start

# Angular fetches data from backend
# Backend loads from disk
# Same data appears
```

**5. Computer Restart**
- Files are saved to your hard drive
- **Result:** Still there after reboot

---

## What DOESN'T Persist

### ❌ No Version History

**Problem:** Each upload **overwrites** the previous file

**Example:**
```
1. Upload MES_v1.xlsx → Saved as MES_Extraction.xlsx
2. Upload MES_v2.xlsx → OVERWRITES MES_Extraction.xlsx
3. Upload MES_v3.xlsx → OVERWRITES MES_Extraction.xlsx
```

**Result:** Only the latest file remains. Previous versions are gone.

---

### ❌ No Automatic Backups

If you upload a bad file, you can't automatically restore the previous one.

**Workaround:** Keep manual backups:
```
data_backups/
├── MES_Extraction_2024-11-27.xlsx
├── MES_Extraction_2024-11-28.xlsx
└── ERP_Equipes_Airplus_2024-11-27.xlsx
```

---

## File Verification

### Check What's Currently Stored

**Method 1: File Explorer**
1. Navigate to: `PLM-Hackaton/data/`
2. Look at file timestamps
3. Right-click → Properties → "Modified" date

**Method 2: Backend API**
```
GET http://localhost:5000/api/v2/current-files
```

**Response:**
```json
{
  "mes": {
    "filename": "MES_Extraction.xlsx",
    "size": 25600,
    "last_modified": "2025-11-28T01:19:53",
    "exists": true
  },
  "erp": {
    "filename": "ERP_Equipes Airplus.xlsx",
    "size": 87400,
    "last_modified": "2025-11-27T14:30:00",
    "exists": true
  },
  ...
}
```

**Method 3: Frontend UI**
The file uploader shows:
- Current file name
- File size
- Last modified date

---

## Upload History

### Currently: No Upload History

The system doesn't track:
- Who uploaded what file
- When it was uploaded
- Previous file versions
- Change logs

**To Add Upload History:**
You'd need to:
1. Create a database table (SQLite or PostgreSQL)
2. Store upload metadata (timestamp, user, original filename)
3. Keep old files instead of overwriting
4. Add UI to view/restore history

---

## Example Scenario

**Day 1 (Nov 27):**
```
System starts with:
data/MES_Extraction.xlsx (v1 - original file)
```

**Day 2 (Nov 28 - 10:00 AM):**
```
User uploads new MES data
→ data/MES_Extraction.xlsx (v2 - overwrites v1)
```

**Day 2 (Nov 28 - 2:00 PM):**
```
Backend restarts
→ Loads MES_Extraction.xlsx (v2) from disk
→ Still has v2 data ✅
```

**Day 2 (Nov 28 - 5:00 PM):**
```
User refreshes browser
→ Frontend fetches data from backend
→ Backend reads MES_Extraction.xlsx (v2) from disk
→ Still has v2 data ✅
```

**Day 3 (Nov 29):**
```
Computer restarts
Backend starts
→ Loads MES_Extraction.xlsx (v2) from disk
→ Still has v2 data ✅
```

---

## Storage Limits

**Current Settings:**

```python
# backend/app.py (Line 18)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max
```

**Limits:**
- ✅ Max file size: **16 MB**
- ✅ Allowed types: `.xlsx`, `.xls`, `.csv`
- ❌ No total storage limit (limited by disk space)

**Typical File Sizes:**
- MES data: ~25 KB (56 rows)
- ERP data: ~87 KB (150 rows)
- PLM data: ~15 KB (40 rows)
- **Total:** ~127 KB (well under 16MB limit)

---

## Database vs Files

**Current Implementation: Files** 📁

**Pros:**
- ✅ Simple - just Excel files
- ✅ Easy to inspect (open in Excel)
- ✅ Easy to backup (copy folder)
- ✅ No database setup needed

**Cons:**
- ❌ No version history
- ❌ No upload tracking
- ❌ No concurrent access control
- ❌ Overwrites previous data

**Alternative: Database** 🗄️

If you wanted more features:
```python
# Store in SQLite/PostgreSQL instead
upload_record = {
    'filename': 'MES_Extraction.xlsx',
    'uploaded_at': '2025-11-28 10:00:00',
    'uploaded_by': 'user@email.com',
    'file_type': 'mes',
    'version': 2,
    'data': <blob>  # Actual file content
}
db.insert(upload_record)
```

**Would enable:**
- ✅ Version history
- ✅ Upload tracking
- ✅ Rollback to previous versions
- ✅ User management

---

## Summary

| Question | Answer |
|----------|--------|
| **Are files stored permanently?** | ✅ Yes, in `data/` folder |
| **Lost on page refresh?** | ❌ No, they persist |
| **Lost on backend restart?** | ❌ No, loaded from disk |
| **Lost on browser close?** | ❌ No, stored server-side |
| **Can I see old versions?** | ❌ No, each upload overwrites |
| **Where exactly are they?** | `PLM-Hackaton/data/*.xlsx` |
| **Max file size?** | 16 MB |
| **Allowed formats?** | `.xlsx`, `.xls`, `.csv` |

---

## Best Practices

**Recommended Workflow:**

1. **Keep Backups**
   ```bash
   # Before uploading new data, backup current
   cp data/MES_Extraction.xlsx data_backups/MES_Extraction_2024-11-28.xlsx
   ```

2. **Verify Upload Success**
   - Check success message
   - Refresh Overview page to see new KPIs
   - Verify employee list updated (if ERP)

3. **Test New Data First**
   - Upload to test environment first
   - Verify calculations are correct
   - Then upload to production

4. **Document Changes**
   - Keep a log of what you uploaded and when
   - Note any data quality issues

---

**Your data is safe and persistent!** 💾✅
