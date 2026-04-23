## ✅ ChronoLens Backend - Startup Instructions

Your venv is activated! Now follow these exact steps:

### Step 1: Install Dependencies (ONE TIME ONLY)
```bash
pip install -r requirements.txt
```
⏱️ This takes 5-10 minutes on first run
⚠️ __Keep this terminal open until it completes__

### Step 2: Start Backend (Fast Mode - Recommended for Testing)
```bash
python startup.py --fast-mode 200 --skip-llm
```

**What this does:**
- `--fast-mode 200`: Uses only first 200 schemes (instead of 2000) → faster startup ⚡
- `--skip-llm`: Disables Mistral-7B LLM → instantaneous, but extractive-only summaries

**Expected output:**
```
======================================================================
ChronoLens RAG Backend Startup
======================================================================
[*] Platform: Windows-10.0.26200-SP0-64bit
[*] Python: 3.11.10

[*] Checking dependencies...
[✓] All dependencies available

[*] Fast mode: Limiting to 200 rows
[*] LLM disabled: Using extractive-only mode
[*] CPU mode: Using CPU (slower but works everywhere)
[*] Starting Flask Backend on http://localhost:5000
[*] Python: C:\...\venv\Scripts\python.exe
[*] Press Ctrl+C to stop

 * Serving Flask app 'app'
 * Running on http://127.0.0.1:5000
```

✅ **If you see "Running on http://127.0.0.1:5000" — Backend is ready!**

### Step 3: Test Backend in Another Terminal
```bash
# Open a NEW terminal (keep backend terminal open)
curl http://localhost:5000/health
```

Expected response:
```json
{"status":"ok","service":"ChronoLens RAG Backend","version":"1.0.0"}
```

---

## 🚀 Alternative Startup Methods

### Option A: Full Mode (All schemes, LLM enabled)
```bash
python startup.py
```
⏱️ First query takes 30-120 seconds (models load)
Subsequent queries: 1-3 seconds

### Option B: Direct (Without startup.py)
```bash
python app.py
```

### Option C: Set Environment & Run
```bash
# Windows CMD:
set CHRONOLENS_SKIP_LLM=1
set CHRONOLENS_MAX_ROWS=200
python app.py

# Or PowerShell:
$env:CHRONOLENS_SKIP_LLM="1"
$env:CHRONOLENS_MAX_ROWS="200"
python app.py
```

---

## 🆘 If Dependencies Installation Fails

### Error: `Microsoft Visual C++ 14.0 or greater is required`
**Solution:**
1. Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Install "Desktop development with C++"
3. Re-run: `pip install -r requirements.txt`

### Error: `ModuleNotFoundError: No module named 'XX'`
**Solution:**
```bash
# Clear pip cache and reinstall
pip cache purge
pip install --upgrade pip
pip install -r requirements.txt --no-cache-dir
```

### Error: `Could not find a version that satisfies X`
**Solution (Python may be too new):**
```bash
# Check Python version
python --version

# If 3.13+, consider using Python 3.11 or 3.12
# Create new venv with specific Python version:
python -3.11 -m venv venv_backup
venv_backup\Scripts\activate
pip install -r requirements.txt
```

---

## ✅ Checklist Before Starting Backend

- [ ] Virtual environment activated: `(venv)` shown in terminal?
- [ ] In correct directory: `chronolens-explorer-main`?
- [ ] Dependencies installed: `pip list | grep flask` returns something?
- [ ] `startup.py` exists: `dir startup.py` shows file?
- [ ] `app.py` exists: `dir app.py` shows file?
- [ ] `requirements.txt` exists: `dir requirements.txt` shows file?

---

## 📊 Backend Status Commands

```bash
# Health check
curl http://localhost:5000/health

# Get user roles
curl http://localhost:5000/roles

# Test query (example)
curl -X POST http://localhost:5000/query ^
  -H "Content-Type: application/json" ^
  -d "{ \"query\": \"women entrepreneur schemes\", \"user_role\": \"public\" }"
```

---

## ✅ Once Backend is Running

Open **another terminal** and start the frontend:
```bash
# Terminal 2:
npm install  # (first time only)
npm run dev
```

Then visit: http://localhost:5173

🎉 **Done! Test the Query Retrieval page!**
