# 🎯 Frontend-RAG Integration Guide

The ChronoLens system has a complete **frontend-to-RAG integration** via Flask backend. Here's how it works:

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                           │
│              (http://localhost:5173)                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ QueryRetrieval.tsx                                   │   │
│  │ - User enters query                                  │   │
│  │ - Calls queryRag() from client.ts                    │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │ (POST /query)                            │
│                   │ JSON: { query, user_role }              │
│                   ▼                                          │
├─────────────────────────────────────────────────────────────┤
│                     HTTP / CORS                              │
├─────────────────────────────────────────────────────────────┤
│                   Flask Backend                              │
│              (http://localhost:5000)                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ app.py → /query endpoint                             │   │
│  │ - Validates request                                  │   │
│  │ - Calls rag_module.retrieve_documents()              │   │
│  │ - Calls rag_module.generate_answer()                 │   │
│  └─────────┬──────────────────┬────────────────────────┘   │
│            │                   │                            │
│            ▼                   ▼                            │
│  ┌───────────────────┐  ┌──────────────────┐              │
│  │ rag_module.py     │  │ (Future: LLM)    │              │
│  │                   │  │                  │              │
│  │ Retrieve:         │  │ Generate:        │              │
│  │ - Load FAISS      │  │ - Use Mistral-7B │              │
│  │ - Vector search   │  │ - Create answer  │              │
│  │ - Return top-k    │  │ - Cite sources   │              │
│  │   documents       │  │                  │              │
│  └─────────┬─────────┘  └────────┬─────────┘              │
│            │                     │                         │
│            └─────────┬───────────┘                         │
│                      ▼                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ src/govt_schemes_faiss/                              │   │
│  │ - index.faiss (vector store)                         │   │
│  │ - index.pkl (metadata)                               │   │
│  │                                                       │   │
│  │ Built from: src/updated_data.csv                     │   │
│  │ (2000+ government schemes)                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| **app.py** | Main Flask backend; defines `/query`, `/health`, `/roles` endpoints |
| **src/rag_module.py** | RAG pipeline logic; handles retrieval & generation |
| **src/rag.py** | Original Colab notebook (reference; builds FAISS index) |
| **src/api/client.ts** | TypeScript API client for frontend |
| **src/pages/QueryRetrieval.tsx** | React component; user query interface |
| **src/govt_schemes_faiss/** | Pre-built FAISS vector store (2000+ schemes) |
| **src/updated_data.csv** | Government schemes dataset; indexed by FAISS |
| **requirements.txt** | Python backend dependencies |

---

## 🔗 Integration Flow

### 1. **Frontend Sends Query** (React → TypeScript)
```typescript
// src/pages/QueryRetrieval.tsx
import { queryRag } from '@/api/client';

const response = await queryRag(
  "Which schemes are available for women entrepreneurs?",
  "public"  // user role: "public" | "researcher" | "government_official"
);

// response:
// {
//   retrieved_documents: [...],
//   generated_answer: "...",
//   metadata: { role, num_docs, latency_ms }
// }
```

### 2. **TypeScript Calls Backend** (HTTP POST)
```typescript
// src/api/client.ts → queryRag()
fetch('http://localhost:5000/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "Which schemes are available for women entrepreneurs?",
    user_role: "public",
    time_filter: null
  })
})
```

### 3. **Backend Retrieves & Generates** (Flask + RAG)
```python
# app.py → /query endpoint
rag = get_rag()  # Lazy-loads rag_module on first call

# Step 1: Retrieve relevant documents
retrieved_docs = rag.retrieve_documents(
    query="Which schemes are available for women entrepreneurs?",
    user_role="public",  # Limits to top 3 results
    time_filter=None
)

# Step 2: Generate answer from retrieved docs
answer = rag.generate_answer(
    query="Which schemes are available for women entrepreneurs?",
    retrieved_docs=retrieved_docs,
    user_role="public"
)

# Return to frontend
return {
    "retrieved_documents": retrieved_docs,
    "generated_answer": answer,
    "metadata": {...}
}
```

### 4. **Backend Retrieval Process** (RAG Module)
```python
# src/rag_module.py → retrieve_documents()

# 1. Load FAISS index from disk (vectors + metadata)
vectorstore = FAISS.load_local("govt_schemes_faiss", embeddings)

# 2. Embed user query
query_vector = embeddings.embed_query("Which schemes are available for women entrepreneurs?")

# 3. Vector search (find similar chunks)
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})  # k depends on user_role
raw_docs = retriever.invoke(query)

# 4. Format results with metadata
results = [{
    "id": "rag-doc-1",
    "title": "Prime Minister MUDRA Yojana",
    "category": "womens",
    "source": "Indian Government Schemes",
    "excerpt": "...",
    "relevance_score": 95,
    "matched_chunk": "...",
    "tags": "women,entrepreneurship,loan",
    "level": "national",
    "slug": "pm-mudra-yojana"
}, ...]
```

### 5. **Backend Generation Process** (LLM)
```python
# src/rag_module.py → generate_answer()

context = """
[1] Prime Minister MUDRA Yojana
Scheme Name: Prime Minister MUDRA Yojana
Category: womens
Benefits: Loans up to ₹10 lakhs for women entrepreneurs...

[2] Pradhan Mantri Mahila Udyam Nidhi Scheme
Scheme Name: Pradhan Mantri Mahila Udyam Nidhi Scheme
...
"""

# If Mistral-7B is available:
answer = llm.invoke({
    "context": context,
    "question": "Which schemes are available for women entrepreneurs?",
    "role": "Public"
})

# If LLM unavailable, fallback to extractive summary
answer = f"[Public view] Based on {len(retrieved_docs)} schemes:\n..."
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- All dependencies installed

### Installation

**1. Install backend dependencies:**
```bash
pip install -r requirements.txt  # ~5-10 min on Python 3.14
```

**2. (Optional) Skip LLM for fast development:**
```bash
set CHRONOLENS_SKIP_LLM=1
# or on Unix:
export CHRONOLENS_SKIP_LLM=1
```

### Startup

**Terminal 1 - Backend:**
```bash
cd chronolens-explorer-main
python app.py
```
✅ Runs on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd chronolens-explorer-main
npm install  # First time only
npm run dev
```
✅ Runs on `http://localhost:5173`

### Quick Test

**1. Check backend health:**
```bash
curl http://localhost:5000/health
# Expected: {"status":"ok","service":"ChronoLens RAG Backend","version":"1.0.0"}
```

**2. Test RAG query (in Postman or curl):**
```bash
curl -X POST http://localhost:5000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "women entrepreneur schemes",
    "user_role": "public"
  }'
```

**3. Open frontend and navigate to "Query Retrieval":**
- Visit `http://localhost:5173`
- Click "Query Retrieval" tab
- Enter: `women entrepreneur schemes`
- Select role: "Public"
- See results!

---

## 🔧 Configuration

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `CHRONOLENS_SKIP_LLM` | Skip Mistral-7B (fast startup) | `0` (off) |
| `CHRONOLENS_DATA_CSV` | Path to custom schemes CSV | `src/updated_data.csv` |
| `CHRONOLENS_MAX_ROWS` | Limit rows for testing | None (all rows) |

### User Role Configuration

Defined in `src/rag_module.py`:

```python
ROLE_CONFIG = {
    "public": {
        "k": 3,           # Return top 3 documents
        "label": "Public",
    },
    "researcher": {
        "k": 7,           # Return top 7 documents
        "label": "Researcher",
    },
    "government_official": {
        "k": 10,          # Return top 10 documents
        "label": "Government Official",
    },
}
```

---

## 🐛 Troubleshooting

### Issue: Backend won't start / `ModuleNotFoundError`

```bash
# Solution:
pip install -r requirements.txt --quiet
```

### Issue: FAISS index not found
```
⚠️  Warning: FAISS index not found at src/govt_schemes_faiss
```

**Solution:**
- Index will auto-build on first RAG query (takes 1-2 minutes)
- Or manually rebuild with: `python src/rag.py`
- Or use: `python app.py` with env `CHRONOLENS_MAX_ROWS=100` for faster testing

### Issue: LangChain callback error
```
AttributeError: module 'langchain' has no attribute 'debug'
```

**Solution:** Already fixed in `rag_module.py` lines 318-320. Just re-run setup.

### Issue: Frontend can't reach backend
```
Cannot reach the Flask backend at http://localhost:5000
```

**Solution:**
1. Verify backend is running: `curl http://localhost:5000/health`
2. Check if port 5000 is in use: `netstat -an | find ":5000"`
3. Update `src/api/client.ts` if using custom backend URL

---

## 📊 Performance Notes

| Metric | Value |
|--------|-------|
| First query (models loading) | 30-120 seconds |
| Subsequent queries | 1-3 seconds |
| FAISS index size | ~50 MB |
| Dataset size | ~500 schemes (expandable) |
| Embedding model | sentence-transformers/all-MiniLM-L6-v2 |
| LLM model | Mistral-7B-Instruct-v0.2 (optional) |

---

## ✅ Verification Checklist

Run this script to auto-verify the setup:

```bash
python setup_rag_frontend.py
```

Checks:
- ✅ Python dependencies installed
- ✅ FAISS index exists
- ✅ CSV dataset loaded
- ✅ Frontend API client configured
- ✅ Backend app.py has /query endpoint
- ✅ RAG module initializable

---

## 📚 Reference

- **Frontend Client Docs**: See [src/api/client.ts](src/api/client.ts)
- **RAG Module Docs**: See [src/rag_module.py](src/rag_module.py)
- **Backend App Docs**: See [app.py](app.py)
- **Dataset**: [jainamgada45/indian-government-schemes](https://www.kaggle.com/datasets/jainamgada45/indian-government-schemes)
- **LangChain Docs**: https://python.langchain.com/
- **FAISS Docs**: https://github.com/facebookresearch/faiss

---

## 🎉 Success!

Once everything is running:

1. Backend serves RAG queries on `/query`
2. Frontend sends queries from QueryRetrieval page
3. Results show retrieved documents + generated answer
4. System handles 3 user roles with different access levels

**Happy querying!** 🚀
