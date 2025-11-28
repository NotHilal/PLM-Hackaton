# ✅ File Versioning - Implemented!

## 🎉 YES! Files are now kept in a list with version history!

Instead of overwriting, the system now:
- ✅ Saves each upload with a timestamp
- ✅ Keeps ALL previous versions
- ✅ Lets you switch between versions
- ✅ Shows upload history
- ✅ Allows deleting old versions (except active one)

---

## 📁 New Folder Structure

```
PLM-Hackaton/
├── backend/
├── App/
└── data/
    ├── MES_Extraction.xlsx       ← Active file (currently used)
    ├── ERP_Equipes Airplus.xlsx  ← Active file
    ├── PLM_DataSet.xlsx           ← Active file
    ├── file_registry.json         ← 🆕 Tracks all versions
    └── uploads/                   ← 🆕 All versioned files
        ├── mes_20241128_101530.xlsx
        ├── mes_20241128_143000.xlsx
        ├── mes_20241129_090000.xlsx
        ├── erp_20241128_102000.xlsx
        ├── erp_20241128_150000.xlsx
        └── plm_20241128_103000.xlsx
```

**Active Files:** Located in `data/` (backward compatible)
**Version History:** Stored in `data/uploads/` with timestamps
**Registry:** `data/file_registry.json` tracks metadata

---

## 🔄 How It Works Now

### Upload Process

**Step 1: You upload a file**
```
Upload: my_new_mes_data.xlsx
```

**Step 2: System saves with timestamp**
```python
# Generated filename
timestamp = "20241128_101530"  # YYYYMMDD_HHMMSS
versioned_file = "mes_20241128_101530.xlsx"

# Saved to:
data/uploads/mes_20241128_101530.xlsx  # Versioned copy
data/MES_Extraction.xlsx               # Active copy
```

**Step 3: Registry updated**
```json
{
  "mes": [
    {
      "id": "mes_20241127_090000",
      "original_name": "MES_old_data.xlsx",
      "stored_name": "mes_20241127_090000.xlsx",
      "file_type": "mes",
      "uploaded_at": "2024-11-27T09:00:00",
      "size": 25600,
      "active": false  ← Not active
    },
    {
      "id": "mes_20241128_101530",
      "original_name": "my_new_mes_data.xlsx",
      "stored_name": "mes_20241128_101530.xlsx",
      "file_type": "mes",
      "uploaded_at": "2024-11-28T10:15:30",
      "size": 27800,
      "active": true  ← Currently active
    }
  ],
  "erp": [...],
  "plm": [...]
}
```

**Step 4: File is active**
- System uses the active version for KPI calculations
- Old versions preserved in `uploads/` folder

---

## 🆕 New API Endpoints

### 1. List All File Versions

**Endpoint:** `GET /api/v2/files/list`

**Response:**
```json
{
  "mes": [
    {
      "id": "mes_20241127_090000",
      "original_name": "MES_v1.xlsx",
      "stored_name": "mes_20241127_090000.xlsx",
      "file_type": "mes",
      "uploaded_at": "2024-11-27T09:00:00.000Z",
      "size": 25600,
      "active": false
    },
    {
      "id": "mes_20241128_101530",
      "original_name": "MES_v2.xlsx",
      "stored_name": "mes_20241128_101530.xlsx",
      "file_type": "mes",
      "uploaded_at": "2024-11-28T10:15:30.000Z",
      "size": 27800,
      "active": true
    }
  ],
  "erp": [...],
  "plm": [...]
}
```

---

### 2. Switch Active Version

**Endpoint:** `POST /api/v2/files/active/:type`

**Request Body:**
```json
{
  "file_id": "mes_20241127_090000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Switched to MES_v1.xlsx",
  "file_id": "mes_20241127_090000"
}
```

**What happens:**
1. Marks selected version as active in registry
2. Copies versioned file to active location (`data/MES_Extraction.xlsx`)
3. Reloads backend data
4. Recalculates KPIs
5. Frontend sees updated data

---

### 3. Delete Old Version

**Endpoint:** `DELETE /api/v2/files/delete/:type/:file_id`

**Example:** `DELETE /api/v2/files/delete/mes/mes_20241127_090000`

**Response:**
```json
{
  "success": true,
  "message": "Deleted MES_v1.xlsx"
}
```

**Rules:**
- ❌ Cannot delete active file
- ✅ Can delete any non-active version
- Deletes both registry entry and physical file

---

## 🎯 Example Scenario

### Day 1 (Nov 27 - Morning)
```
Upload: MES_v1.xlsx
→ Saved as: mes_20241127_090000.xlsx
→ Active: ✅
```

**Files:**
```
data/uploads/mes_20241127_090000.xlsx
data/MES_Extraction.xlsx (copy of above)
```

---

### Day 1 (Nov 27 - Afternoon)
```
Upload: MES_v2_fixes.xlsx
→ Saved as: mes_20241127_143000.xlsx
→ Active: ✅
→ Previous: mes_20241127_090000.xlsx (now inactive)
```

**Files:**
```
data/uploads/mes_20241127_090000.xlsx  (v1 - inactive)
data/uploads/mes_20241127_143000.xlsx  (v2 - active)
data/MES_Extraction.xlsx (copy of v2)
```

---

### Day 2 (Nov 28)
```
Upload: MES_v3_final.xlsx
→ Saved as: mes_20241128_101530.xlsx
→ Active: ✅
→ Previous: v1, v2 (both inactive)
```

**Files:**
```
data/uploads/mes_20241127_090000.xlsx  (v1)
data/uploads/mes_20241127_143000.xlsx  (v2)
data/uploads/mes_20241128_101530.xlsx  (v3 - active)
data/MES_Extraction.xlsx (copy of v3)
```

---

### Rollback to v2
```
API Call: POST /api/v2/files/active/mes
Body: { "file_id": "mes_20241127_143000" }

→ Marks v2 as active
→ Copies mes_20241127_143000.xlsx to MES_Extraction.xlsx
→ Reloads data
→ KPIs recalculated with v2 data
```

**Files:**
```
data/uploads/mes_20241127_090000.xlsx  (v1)
data/uploads/mes_20241127_143000.xlsx  (v2 - active)
data/uploads/mes_20241128_101530.xlsx  (v3)
data/MES_Extraction.xlsx (copy of v2)
```

---

### Delete v1
```
API Call: DELETE /api/v2/files/delete/mes/mes_20241127_090000

→ Removes from registry
→ Deletes physical file
```

**Files:**
```
data/uploads/mes_20241127_143000.xlsx  (v2 - active)
data/uploads/mes_20241128_101530.xlsx  (v3)
data/MES_Extraction.xlsx (copy of v2)
```

---

## 🔄 How to Test

### Step 1: Restart Backend
```bash
cd backend
python app.py
```

Look for:
```
✅ Created uploads folder: data/uploads/
```

---

### Step 2: Upload First File
1. Go to Data Upload page
2. Upload `MES_Extraction.xlsx`
3. Backend logs:
```
💾 Saving versioned file to: data/uploads/mes_20241128_101530.xlsx
💾 Copying to active file: data/MES_Extraction.xlsx
✅ File saved successfully (versioned + active)
```

---

### Step 3: Check File List
**Browser:** http://localhost:5000/api/v2/files/list

**Should see:**
```json
{
  "mes": [
    {
      "id": "mes_20241128_101530",
      "original_name": "MES_Extraction.xlsx",
      "stored_name": "mes_20241128_101530.xlsx",
      "uploaded_at": "2024-11-28T10:15:30",
      "active": true
    }
  ],
  "erp": [],
  "plm": []
}
```

---

### Step 4: Upload Second File
1. Modify MES_Extraction.xlsx (change some data)
2. Upload again
3. Check file list again

**Should now see:**
```json
{
  "mes": [
    {
      "id": "mes_20241128_101530",
      ...
      "active": false  ← Now inactive
    },
    {
      "id": "mes_20241128_102000",
      ...
      "active": true  ← New active version
    }
  ]
}
```

---

### Step 5: Switch Back to First Version

**Using Postman/curl:**
```bash
curl -X POST http://localhost:5000/api/v2/files/active/mes \
  -H "Content-Type: application/json" \
  -d '{"file_id": "mes_20241128_101530"}'
```

**Check Overview page:**
- KPIs should revert to first version's values
- Proof that switching works!

---

## 📊 File Registry Format

**File:** `data/file_registry.json`

```json
{
  "mes": [
    {
      "id": "mes_20241128_101530",
      "original_name": "my_mes_data.xlsx",
      "stored_name": "mes_20241128_101530.xlsx",
      "file_type": "mes",
      "uploaded_at": "2024-11-28T10:15:30.123456",
      "size": 27800,
      "active": false
    }
  ],
  "erp": [],
  "plm": []
}
```

**Fields:**
- `id`: Unique identifier (type + timestamp)
- `original_name`: Name user uploaded
- `stored_name`: Name on disk (with timestamp)
- `file_type`: mes/erp/plm
- `uploaded_at`: ISO timestamp
- `size`: File size in bytes
- `active`: Boolean - currently active version

---

## 🎨 Frontend Integration (Next Step)

I can now create a UI to:
- ✅ Show list of all file versions
- ✅ Highlight active version
- ✅ Button to switch version
- ✅ Button to delete old versions
- ✅ Show upload date/time
- ✅ Show file size

**Would you like me to add this UI now?**

---

## 🔍 Benefits

**Before:** Upload overwrites file ❌
**After:** Upload adds to version list ✅

**Advantages:**
- ✅ Never lose data
- ✅ Easy rollback to previous version
- ✅ Compare different data sets
- ✅ Track changes over time
- ✅ Delete old versions when not needed
- ✅ See who uploaded what and when (with future user auth)

**Use Cases:**
1. **Test new data** without losing old data
2. **Rollback** if new data has errors
3. **Compare** different time periods
4. **Audit trail** of data changes
5. **Cleanup** old versions to save space

---

## 🚀 What's Next?

**Backend:** ✅ COMPLETE
- Files saved with timestamps
- Registry tracking
- Switch versions API
- Delete versions API

**Frontend:** ⏳ TODO (if you want)
- File version list UI
- Switch version button
- Delete version button
- Upload history timeline

**Would you like me to create the frontend UI for this?**

---

## 📋 Summary

✅ **Files are now versioned!**
✅ **No more overwriting**
✅ **Full history kept**
✅ **Easy rollback**
✅ **API ready**

**Test it:**
```bash
# Restart backend
python app.py

# Upload files multiple times
# Check: http://localhost:5000/api/v2/files/list
```

Your file management just got WAY better! 🎉
