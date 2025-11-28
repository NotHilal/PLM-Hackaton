# 🔧 Upload Issue Troubleshooting

## Problem: Upload shows "uploading" indefinitely

I've added logging and fixes to help debug this. Follow these steps:

---

## Step 1: Restart Backend with Logging

1. **Stop the backend** (Ctrl+C in the terminal)
2. **Restart it:**
   ```bash
   cd backend
   python app.py
   ```

3. **Look for startup messages:**
   ```
   🚀 Starting PLM AI Backend Server...
   📊 Available endpoints:
   ...
   ```

---

## Step 2: Test Backend is Running

**Open in browser:**
- http://localhost:5000/api/v2/upload/test

**Expected response:**
```json
{
  "status": "ok",
  "message": "Upload endpoint is accessible"
}
```

**If this FAILS:**
- Backend is not running properly
- Check the terminal for errors
- Try restarting the backend

**If this WORKS:**
- Backend is running, continue to Step 3

---

## Step 3: Try Uploading Again

1. Go to http://localhost:4200
2. Navigate to "📊 Data" page
3. Click "Choose MES File"
4. Select a file
5. **Watch the backend terminal for logs:**

**You should see:**
```
📤 Upload request received
📝 File: MES_Extraction.xlsx, Type: mes
💾 Saving file to: C:\Users\...\data\MES_Extraction.xlsx
✅ File saved successfully
🔄 Reloading data...
✅ Loaded MES data: 50 rows
🔄 Reinitializing KPI calculator...
✅ Upload complete!
```

**If you see an error like:**
```
❌ Upload error: [error message]
```
- Copy the error message and let me know
- This will tell us what's wrong

---

## Step 4: Check Browser Console

1. **Open browser console:**
   - Press F12
   - Go to "Console" tab

2. **Look for errors:**
   - Red text = errors
   - Look for messages about CORS, network, or HTTP errors

**Common errors:**

**Error: "CORS policy"**
- Backend CORS is not configured properly
- Make sure backend has `CORS(app)` enabled

**Error: "Failed to fetch"**
- Backend is not running
- Or wrong URL (should be localhost:5000)

**Error: "404 Not Found"**
- Upload endpoint doesn't exist
- Make sure backend restarted properly

**Error: "500 Internal Server Error"**
- Backend error (check backend terminal logs)

---

## Step 5: Common Fixes

### Fix 1: Backend Not Running
```bash
cd backend
python app.py
```

### Fix 2: Wrong Python Version
```bash
# Try these alternatives:
python3 app.py
py app.py
```

### Fix 3: Port Already in Use
- Backend might be running twice
- Kill the old process or use a different port

### Fix 4: Missing Dependencies
```bash
pip install flask flask-cors werkzeug pandas openpyxl
```

---

## What I Changed to Fix This

**Backend changes:**
1. ✅ Removed slow `get_all_kpis()` call from upload response
2. ✅ Added detailed logging (you'll see progress in terminal)
3. ✅ Added better error handling with stack traces
4. ✅ Added test endpoint `/api/v2/upload/test`

**The upload should be MUCH faster now (< 2 seconds instead of hanging)**

---

## Step 6: Tell Me What You See

After following the steps above, tell me:

1. **Does the test endpoint work?** (Step 2)
   - YES / NO

2. **What do you see in the backend terminal when uploading?** (Step 3)
   - Copy the log messages

3. **What errors appear in browser console?** (Step 4)
   - Copy any red error messages

With this information, I can help you fix the specific issue! 🔧
