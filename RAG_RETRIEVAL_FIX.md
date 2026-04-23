# ChronoLens RAG Retrieval Issue - Fix Guide

## Problem

When searching for **"women's entrepreneurship schemes"**, the system returns **"fishermen relief schemes"** instead.

This happens because the RAG system is using **DummyEmbeddings** (all-zero vectors) instead of real embeddings from HuggingFace. This makes ALL queries return the same results, regardless of the actual query content.

## Root Cause

In `src/rag_module.py`, when loading embeddings:

```python
try:
    # Load real embeddings
    _embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
except Exception as exc:
    # Falls back to dummy embeddings
    logger.critical("⚠️  CRITICAL: Using DummyEmbeddings (all-zero vectors)!")
    _embeddings = DummyEmbeddings()
```

The fallback happens when:
- ❌ `sentence-transformers` is not installed
- ❌ `torch` is not installed  
- ❌ HuggingFace models failed to download
- ❌ GPU memory issues

## Solution

### Option 1: Use the Auto-Fix Script (RECOMMENDED)

```bash
# Navigate to project directory
cd chronolens-explorer-main

# Run the automatic rebuild script
python rebuild_embeddings.py
```

This script will:
1. ✅ Verify sentence-transformers is installed (install if missing)
2. ✅ Remove the corrupted FAISS index  
3. ✅ Rebuild FAISS with real embeddings
4. ✅ Test retrieval with sample queries
5. ✅ Verify women's entrepreneur queries work correctly

**After running this script, restart the backend:**
```bash
python app.py
```

### Option 2: Manual Fix

If you want to do it manually:

#### Step 1: Install Dependencies

```bash
python -m pip install --upgrade sentence-transformers torch
```

#### Step 2: Clear Old Index

```bash
# Remove the corrupted FAISS index
rmdir /s /q src\govt_schemes_faiss
```

#### Step 3: Restart Backend

```bash
# This will automatically rebuild FAISS on first query with proper embeddings
python app.py
```

On first query after restart, the system will take **2-5 minutes** to rebuild the index with real embeddings. 

### Option 3: Test Without LLM (Faster)

If rebuilding is taking too long:

```bash
set CHRONOLENS_SKIP_LLM=1
python app.py
```

This skips loading Mistral-7B (which requires large downloads) but keeps embeddings working.

## How to Verify It's Fixed

### Test 1: Check Logs

Start the backend and look for this line:
```
✓ Embeddings working! Vector dimension: 384
```

NOT this:
```
⚠️  CRITICAL: Using DummyEmbeddings (all-zero vectors)!
```

### Test 2: Search in UI

Try these searches - results should now be different:

- **"women entrepreneurs"** → Should return "Indira Mahila Shakti Udyam Protsahan Yojana" and similar
- **"fishermen"** → Should return "Welfare and Relief for Fishermen" schemes  
- **"education scholarships"** → Should return education/scholarship schemes

### Test 3: API Query

```bash
curl -X POST http://localhost:5000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "women entrepreneurship schemes",
    "user_role": "public"
  }'
```

Expected: Results should mention women/entrepreneur/business topics, NOT fishermen/fishing

## FAQ

**Q: Why does rebuilding take so long?**  
A: Building embeddings for 500+ schemes requires computing a 384-dimensional vector for each piece of text. This is normal and happens only once.

**Q: Can I use a simpler search instead?**  
A: Yes! The backend also includes `policy_retriever_api.py` with keyword-based search. You could modify `app.py` to use that as a fallback while rebuilding embeddings.

**Q: What if rebuilding still fails?**  
A: Check:
1. How much disk space is available (embeddings need ~1-2 GB)
2. Is your internet connected? (Downloads HuggingFace models)
3. Is `torch` properly installed for your Python version?

Try: `python -m pip install --upgrade --force-reinstall torch sentence-transformers`

## Prevention

To prevent this issue in the future:

1. Keep `requirements.txt` updated with embeddings:
   ```
   sentence-transformers>=3.0.0
   torch>=2.0.0
   ```

2. Monitor startup logs for embedding warnings

3. If adding new schemes, rebuild the index:
   ```bash
   python rebuild_embeddings.py
   ```

## Technical Details

The RAG system uses:
- **FAISS** - Vector database for similarity search over 500+ schemes
- **HuggingFace all-MiniLM-L6-v2** - Converts text queries + schemes into 384-dimensional embeddings
- **LangChain** - Orchestrates the retrieval pipeline

When embeddings fail, the fallback `DummyEmbeddings` class returns all-zero vectors, making cosine similarity identical for all queries (all-zeros · any-vector = 0).

Result: All queries return the same documents in the same order = the bug you're seeing!

---

✅ **After running `rebuild_embeddings.py`, women entrepreneur queries will work correctly!**
