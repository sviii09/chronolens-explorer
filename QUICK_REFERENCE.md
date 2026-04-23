# 🚀 ChronoLens RAG Frontend - Quick Start Card

## ⚡ Start in 30 seconds

```bash
# Terminal 1: Backend
python app.py
# ✅ Running on http://localhost:5000

# Terminal 2: Frontend  
npm run dev
# ✅ Running on http://localhost:5173
```

Open browser → http://localhost:5173 → "Query Retrieval" tab → Try it!

---

## 🔌 How It Works

```
You type query
    ↓
React Component (QueryRetrieval.tsx)
    ↓
API Client (client.ts) → POST /query
    ↓
Flask Backend (app.py)
    ↓
RAG Module (rag_module.py)
    ├── Retrieve: FAISS vector search
    └── Generate: Mistral-7B LLM (optional)
    ↓
Returns: {retrieved_documents, generated_answer}
    ↓
Frontend displays results
```

---

## 📡 API Endpoints

### Health Check
```bash
curl http://localhost:5000/health
```
**Response:** `{"status":"ok","service":"ChronoLens RAG Backend"}`

### Get Available Roles
```bash
curl http://localhost:5000/roles
```

### Submit RAG Query
```bash
curl -X POST http://localhost:5000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "women entrepreneur schemes",
    "user_role": "public"
  }'
```

**Response:**
```json
{
  "retrieved_documents": [
    {
      "id": "rag-doc-1",
      "title": "Prime Minister MUDRA Yojana",
      "category": "womens",
      "relevance_score": 95,
      "matched_chunk": "..."
    }
  ],
  "generated_answer": "...",
  "metadata": {
    "role": "public",
    "num_docs": 3,
    "latency_ms": 250
  }
}
```

---

## 🎛️ User Roles

| Role | Results | Use Case |
|------|---------|----------|
| `public` | Top 3 | General users |
| `researcher` | Top 7 | Research/analysis |
| `government_official` | Top 10 | Official access |

---

## 🛠️ Configuration

### Skip LLM (Fast Mode)
```bash
set CHRONOLENS_SKIP_LLM=1
python app.py
```
Starts in seconds, uses extractive summaries only.

### Limit Dataset (Testing)
```bash
set CHRONOLENS_MAX_ROWS=100
python app.py
```
Uses only first 100 schemes for quick testing.

### Custom Data CSV
```bash
set CHRONOLENS_DATA_CSV=/path/to/schemes.csv
python app.py
```

---

## 📂 Key Files

| File | What It Does |
|------|-------------|
| `app.py` | Flask backend with `/query` endpoint |
| `src/rag_module.py` | RAG pipeline (retrieve + generate) |
| `src/api/client.ts` | Frontend API client |
| `src/pages/QueryRetrieval.tsx` | Query UI component |
| `src/govt_schemes_faiss/` | FAISS vector index (pre-built) |

---

## ✅ Verify Setup

```bash
# Comprehensive check
python setup_rag_frontend.py

# Quick connectivity test
python test_rag_frontend.py
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Backend won't start | `pip install -r requirements.txt` |
| Frontend can't reach backend | Check `http://localhost:5000/health` |
| FAISS not found | Will auto-build on first query |
| Slow first query | LLM is loading (~30-120s); subsequent queries faster |
| Module import errors | Python 3.10+, fresh venv recommended |

---

## 📊 Performance

- **First query:** 30-120s (models load into memory)
- **Subsequent queries:** 1-3s
- **Vector search:** <200ms (depends on k value)
- **LLM generation:** 1-5s (or skip with `CHRONOLENS_SKIP_LLM=1`)

---

## 📚 Frontend Usage

```typescript
// In React component
import { queryRag } from '@/api/client';

const results = await queryRag(
  "women entrepreneur schemes",
  "public"  // or "researcher" / "government_official"
);

console.log(results.retrieved_documents);  // Top 3 docs
console.log(results.generated_answer);     // LLM response
```

---

## 📝 Example Query

**Query:** `"Which healthcare schemes are available for rural populations?"`

**Response:**

**Retrieved Documents:**
1. Ayushman Bharat - PMJAY (95% relevant)
2. NRHM - National Rural Health Mission (92% relevant)
3. Aam Aadmi Bima Yojana (88% relevant)

**Generated Answer:**
```
Three major healthcare schemes serve rural populations in India:

1. **Ayushman Bharat - PMJAY**: Provides up to ₹5 lakhs health 
   insurance to eligible families for hospitalization.

2. **National Rural Health Mission (NRHM)**: Focuses on reducing 
   child/maternal mortality and infectious disease prevention.

3. **Aam Aadmi Bima Yojana**: Provides social security coverage 
   to unorganized workers in rural areas.
```

---

## 🎓 Learn More

- **Full Integration Guide:** See [RAG_FRONTEND_INTEGRATION.md](RAG_FRONTEND_INTEGRATION.md)
- **RAG Module API:** See [src/rag_module.py](src/rag_module.py) docstrings
- **Frontend Client:** See [src/api/client.ts](src/api/client.ts)
- **Backend Code:** See [app.py](app.py)

---

## 🚀 Next Steps

1. ✅ Start backend: `python app.py`
2. ✅ Start frontend: `npm run dev`
3. ✅ Open http://localhost:5173
4. ✅ Go to "Query Retrieval" tab
5. ✅ Ask a question!

**Happy querying!** 🎉
