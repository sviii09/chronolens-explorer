# RAG-Flask Integration Configuration

## ✅ Integration Status

The RAG system is now properly connected to Flask. Here's what's configured:

### File Locations Fixed
- **CSV Dataset**: Supports both `src/updated_data.csv` and root `updated_data.csv`
- **FAISS Index**: Supports both `src/govt_schemes_faiss/` and root `govt_schemes_faiss/`
- **rag_engine.py**: Located in root directory, properly imports from relative paths

### Flask Endpoints Ready
- `GET /health` - Health check
- `GET /roles` - Available user roles  
- `POST /query` - RAG-powered semantic search

## 🚀 Quick Start

### Option 1: Skip LLM (Faster, for Testing)
```bash
set CHRONOLENS_SKIP_LLM=1
python app.py
```
Server runs on `http://localhost:5000`

### Option 2: Full RAG with LLM (Production)
```bash
python app.py
```
⚠️ Warning: Requires 16GB+ RAM for Mistral-7B model

## 🧪 Testing the Integration

### Health Check
```bash
curl http://localhost:5000/health
```

### Query RAG
```bash
curl -X POST http://localhost:5000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Which schemes help women entrepreneurs?",
    "user_role": "public"
  }'
```

### Using Python Test Script
```bash
python test_rag_flask_integration.py
```

## 🔍 Debugging

If RAG doesn't initialize:

1. **Check embeddings model download**:
   ```bash
   python -c "from sentence_transformers import SentenceTransformer; m = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"
   ```

2. **Check FAISS index integrity**:
   ```bash
   python test_rag_connection.py
   ```

3. **Enable verbose logging**:
   Edit `rag_engine.py` and set:
   ```python
   logging.basicConfig(level=logging.DEBUG)
   ```

## 📦 Dependencies

All required packages are in `requirements.txt`:
- Flask, Flask-CORS (web framework)
- LangChain ecosystem (RAG pipeline)
- sentence-transformers (embeddings)
- FAISS (vector database)
- transformers, torch (LLM)

Install with:
```bash
pip install -r requirements.txt
```

##  🎯 API Schema

### POST /query

**Request**:
```json
{
  "query": "string (required)",
  "user_role": "public | researcher | government_official (default: public)",
  "time_filter": "string (optional, for future use)"
}
```

**Response**:
```json
{
  "retrieved_documents": [
    {
      "id": "doc-1",
      "title": "Scheme Name",
      "category": "Category",
      "source": "Source",
      "excerpt": "...",
      "relevance_score": 95,
      "tags": "...",
      "level": "National"
    }
  ],
  "generated_answer": "Based on retrieved documents...",
  "metadata": {
    "role": "public",
    "num_docs": 3,
    "latency_ms": 1250
  }
}
```

## 🐛 Common Issues & Fixes

### Issue: RAG Engine hangs on initialization
**Cause**: Downloading embeddings model on first run
**Fix**: Check internet connection, wait 5+ minutes

### Issue: "FAISS index not found"
**Cause**: Dataset or index files missing
**Fix**: Ensure `src/updated_data.csv` and `src/govt_schemes_faiss/` exist

### Issue: All queries return same results
**Cause**: Embeddings all-zero vectors (corrupted index)
**Fix**: Delete FAISS index and rebuild:
```bash
rm -rf src/govt_schemes_faiss
python rebuild_rag.py
```

### Issue: Memory error on query
**Cause**: Mistral-7B model needs 16GB RAM
**Fix**: Use LLM disabled mode:
```bash
set CHRONOLENS_SKIP_LLM=1
python app.py
```
