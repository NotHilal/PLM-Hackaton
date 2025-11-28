# 🔧 File Versions UI - Troubleshooting

## Issues Fixed:

### ✅ Issue 1: Multiple files marked as active
**Problem:** Multiple files in same category showing as active
**Fix:** Updated backend logic to ensure only ONE file per category is active

### ✅ Issue 2: Modal not loading
**Added:** Better error logging and debugging

---

## 🚀 Steps to Fix:

### Step 1: Restart Backend
```bash
cd backend
python app.py
```

**Look for:**
```
✅ Created uploads folder
🚀 Starting PLM AI Backend Server...
```

---

### Step 2: Delete Old Registry (if exists)

The old registry might have corrupt data with multiple active files.

**Windows:**
```bash
del "C:\Users\hilal\OneDrive\Desktop\A5\hackathon\PLM-Hackaton\data\file_registry.json"
```

**Or manually:**
1. Navigate to: `PLM-Hackaton\data\`
2. Delete `file_registry.json` if it exists
3. Restart backend

This will create a fresh registry on next upload.

---

### Step 3: Refresh Frontend
- Press F5 or Ctrl+R
- Or restart: `npm start`

---

### Step 4: Open Browser Console
**Before clicking the button:**
1. Press F12
2. Go to "Console" tab
3. Keep it open

---

### Step 5: Click "📁 File Versions" Button

**Watch console for:**

**Expected logs:**
```
📁 Opening file versions modal...
📁 Modal state: true
📁 File Versions Modal constructed
📁 File Versions Modal initialized - loading versions...
🔄 Loading file versions from: http://localhost:5000/api/v2/files/list
✅ File versions loaded: {mes: Array(0), erp: Array(0), plm: Array(0)}
```

**If you see errors:**
- Copy the error message
- Tell me what it says

---

## Common Issues:

### Issue: "Failed to load file versions"

**Cause:** Backend not running or endpoint not responding

**Fix:**
1. Check backend is running on port 5000
2. Test endpoint: http://localhost:5000/api/v2/files/list
3. Should see: `{"mes": [], "erp": [], "plm": []}`

---

### Issue: Modal opens but shows "Loading..." forever

**Cause:** CORS error or backend not responding

**Check console for:**
```
Access to XMLHttpRequest at 'http://localhost:5000/...' has been blocked by CORS
```

**Fix:** Backend should have CORS enabled (already added)

---

### Issue: Multiple files still showing as active

**Check the registry:**
1. Visit: http://localhost:5000/api/v2/files/list
2. Look for files with `"active": true`
3. Should only be ONE per category

**If multiple active:**
```json
{
  "mes": [
    {"id": "mes_123", "active": true},  ← Only ONE should be true
    {"id": "mes_456", "active": true}   ← This is wrong!
  ]
}
```

**Fix:**
1. Delete `data/file_registry.json`
2. Restart backend
3. Upload files fresh

---

## Testing the Fix:

### Test 1: Upload Multiple Files
```
1. Go to Data Upload page
2. Upload MES file → version 1
3. Upload same file again → version 2
4. Upload again → version 3
```

**Check:**
```bash
# Visit in browser:
http://localhost:5000/api/v2/files/list
```

**Should see:**
```json
{
  "mes": [
    {"id": "mes_20241128_101530", "active": false},
    {"id": "mes_20241128_143000", "active": false},
    {"id": "mes_20241129_090000", "active": true}  ← Only latest is active
  ]
}
```

✅ **CORRECT:** Only one active
❌ **WRONG:** Multiple active

---

### Test 2: Switch Versions

**In modal:**
1. Click tab (MES/ERP/PLM)
2. Should see list of files
3. One has ⭐ ACTIVE badge
4. Others have 🔄 Switch button

**Click Switch on inactive file:**
```
1. Confirm dialog appears
2. Click OK
3. Should see "Switched to..." message
4. Page reloads
5. Check Overview - data changed
```

---

## Debug Checklist:

**Backend Running?**
- [ ] Terminal shows "Starting PLM AI Backend Server"
- [ ] http://localhost:5000/api/v2/files/list responds

**Frontend Running?**
- [ ] http://localhost:4200 loads
- [ ] No red errors in console

**Button Click:**
- [ ] Console shows "Opening file versions modal..."
- [ ] Console shows "Modal constructed"
- [ ] Console shows "Loading file versions..."

**Modal Appears:**
- [ ] Dark backdrop visible
- [ ] White modal box in center
- [ ] Tabs visible (MES/ERP/PLM)

**Data Loads:**
- [ ] "Loading..." disappears
- [ ] File list shows OR "No files" message
- [ ] No error alerts

---

## Expected Behavior:

### First Time (No Uploads)
```
Modal opens
→ Shows tabs
→ "No MES/ERP/PLM files uploaded yet" message
```

### After Uploads
```
Modal opens
→ Shows tabs with badges (count)
→ File list appears
→ Active file has ⭐ badge
→ Inactive files have buttons
```

### Switching Version
```
Click 🔄 Switch
→ Confirm dialog
→ Success message
→ Page reloads
→ Modal shows new active file
```

---

## ✅ FIXED: Multiple Active Files Issue

**Issue:** Multiple files showing as active per category after upgrading to versioning system

**Root Cause:** Old registry file (`data/file_registry.json`) contained corrupted data from before the fix was applied

**Solution Applied:**
1. ✅ Fixed backend upload logic to ensure only ONE file per category is marked active (app.py:404-415)
2. ✅ Cleaned up existing corrupted registry data
3. ✅ Created repair tool: `backend/fix_registry.py`

**What Changed:**
- **MES**: 2 active files → 1 active file (latest)
- **ERP**: 3 active files → 1 active file (latest)
- **PLM**: 1 active file → 1 active file (unchanged)

**If You Still See Multiple Active Files:**
Run the registry repair tool:
```bash
cd backend
python fix_registry.py
```

Or manually check: http://localhost:5000/api/v2/files/list

---

## If Still Not Working:

**Send me:**
1. Console logs (F12 → Console → copy all red errors)
2. Response from: http://localhost:5000/api/v2/files/list
3. Backend terminal output
4. Screenshot of what you see

**I'll help debug!** 🔧
