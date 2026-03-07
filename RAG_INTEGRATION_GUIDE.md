# ChronoLens RAG Integration Guide

## Overview
This guide explains how the **updated_data.csv** is connected to the RAG (Retrieval-Augmented Generation) pipeline and how the Query & Retrieval chatbot works end-to-end.

## Architecture

### Data Flow
```
updated_data.csv 
    ↓
rag_module.py (Load & Process Data)
    ├─ Load CSV (3400 government schemes)
    ├─ Create embeddings (HuggingFace)
    ├─ Build FAISS vector index
    └─ Store indexed documents
    ↓
Flask Backend (app.py)
    ├─ /health - System status
    ├─ /roles - Available user roles
    └─ /query - RAG query endpoint
    ↓
React Frontend (QueryRetrieval.tsx)
    ├─ User submits query
    ├─ Calls backend /query endpoint
    ├─ Retrieves results
    └─ Displays answer + citations
```

### Components

#### 1. **updated_data.csv**
- **Location**: `src/updated_data.csv`
- **Format**: CSV with the following columns:
  - `scheme_name`: Name of the government scheme
  - `slug`: URL-friendly identifier  
  - `details`: Detailed description
  - `benefits`: Benefits of the scheme
  - `eligibility`: Eligibility criteria
  - `application`: Application process
  - `documents`: Required documents
  - `level`: National/State/District level
  - `schemeCategory`: Category (Education, Health, etc.)
  - `tags`: Searchable tags
- **Size**: 3400 rows covering Indian government schemes

#### 2. **RAG Module** (`src/rag_module.py`)
- Loads and processes the data
- Creates embeddings using HuggingFace (all-MiniLM-L6-v2)
- Builds FAISS vector index for fast retrieval
- Supports role-based access (public/researcher/government_official)
- Falls back to mock vectorstore if models unavailable

**Key Features**:
- Lazy initialization (loads on first query)
- Automatic FAISS index caching
- Support for document retrieval with relevance scoring
- Text generation using Mistral-7B (when available)

#### 3. **Flask Backend** (`app.py`)
- **Endpoints**:
  - `GET /health` - Health check
  - `GET /roles` - List available roles
  - `POST /query` - RAG query with document retrieval

**Request Format**:
```json
{
  "query": "Which education schemes help SC/ST students?",
  "user_role": "public",  // or "researcher" / "government_official"
  "time_filter": null
}
```

**Response Format**:
```json
{
  "retrieved_documents": [
    {
      "id": "rag-doc-1",
      "title": "Scheme Name",
      "category": "education",
      "excerpt": "...",
      "matched_chunk": "...",
      "relevance_score": 95,
      "tags": "...",
      "level": "National"
    }
  ],
  "generated_answer": "Based on [1] and [2]...",
  "metadata": {
    "role": "public",
    "num_docs": 3,
    "latency_ms": 1250
  }
}
```

#### 4. **React Frontend** (`src/pages/QueryRetrieval.tsx`)
- Query input with role selector
- Category filters (optional)
- Retrieved documents panel
- Generated answer with citations
- Expandable matched text snippets

## Setup Instructions

### Prerequisites
```bash
# Python 3.10+ (avoid 3.14 due to Pydantic V1 incompatibility)
# Requires: Flask, LangChain, FAISS, Sentence Transformers

pip install -r requirements.txt
```

### Running the Backend

#### Option 1: Full Dataset (Slower, ~3-5 minutes initialization)
```bash
python app.py
```

#### Option 2: Fast Mode (Testing, ~30 seconds initialization)
```bash
export CHRONOLENS_MAX_ROWS=200  # Limit to 200 rows
python app.py
```

#### Option 3: Skip LLM (Extractive-only, no generation)
```bash
export CHRONOLENS_SKIP_LLM=1    # Disable generation pipeline
python app.py
```

#### Option 4: Custom CSV Path
```bash
export CHRONOLENS_DATA_CSV=/path/to/custom_data.csv
python app.py
```

### Running the Frontend

```bash
npm install
npm run dev  # Starts on http://localhost:5173
```

The frontend will automatically connect to `http://localhost:5000` for API calls.

## How the Chatbot Works

### Query Processing Flow

1. **User Input**: User enters a question in the Query & Retrieval page
2. **User Role Selection**: Choose access level (Public/Researcher/Official)
3. **Send Query**: Frontend calls `POST /query` endpoint
4. **Backend Retrieval**:
   - Query is converted to embedding
   - FAISS index searches for similar documents
   - Returns top-k results based on role (3/7/10)
5. **Answer Generation**:
   - Retrieved documents are passed to LLM
   - Mistral-7B generates a comprehensive answer
   - Citations [1], [2], etc. added automatically
   - Falls back to extractive summary if LLM unavailable
6. **Display Results**: Frontend shows:
   - Retrieved documents list (left panel)
   - Generated answer with interactive citations (right panel)  
   - Relevance scores and metadata

### Citation System
- Generated answers include citations like `[1]`, `[2]`
- Clicking a citation highlights the source document
- Users can expand documents to see matched text chunks

## Performance Tips

### Optimization
- **First Query**: ~1-3 minutes (building FAISS index)
- **Subsequent Queries**: ~2-10 seconds
- **Skip LLM Mode**: Remove 1-2 second generation time
- **Limit Dataset**: Use `CHRONOLENS_MAX_ROWS` for faster testing

### Memory Usage
- Full Dataset: ~2-3 GB (including models)
- 200-row Dataset: ~800 MB
- CPU-only Mode: Slower but works without GPU

## Troubleshooting

### Issue: "Cannot reach the Flask backend"
**Solution**: Ensure Flask backend is running:
```bash
python app.py
```

### Issue: Long initialization on first query
**Solution**: Normal behavior! First query builds FAISS index:
- Limit rows: `export CHRONOLENS_MAX_ROWS=100`
- Or skip LLM: `export CHRONOLENS_SKIP_LLM=1`

### Issue: "Failed to load HuggingFace embeddings"
**Solution**: System will fall back to mock embeddings:
- Ensure `scipy` is installed: `pip install scipy`
- Or check internet connection to download models

### Issue: Low relevance results
**Solution**: 
- Rephrase query to match scheme terminology
- Try selecting "Researcher" role for more results
- Check query length (optimal: 3-15 words)

## Integration with React Components

### API Usage
```typescript
import { queryRag } from '@/api/client';

const data = await queryRag(
  "education scholarships",
  "public",
  null
);

// data.retrieved_documents: RagDocument[]
// data.generated_answer: string  
// data.metadata: { role, num_docs, latency_ms }
```

### Component Props
```typescript
interface QueryRetrievalProps {
  // No required props - component is self-contained
  // Uses hooks for state management
}
```

## Production Deployment

### Recommended Setup
1. **Pre-build FAISS Index**: Don't wait for first query
   ```bash
   export CHRONOLENS_SKIP_LLM=1
   python app.py  # Let it initialize, then stop
   ```
   
2. **Use GPU**: Enable CUDA for faster embeddings
   ```bash
   export CUDA_VISIBLE_DEVICES=0
   python app.py
   ```

3. **Production Server**: Use production WSGI:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

4. **Environment**: Set production env vars
   ```bash
   export FLASK_ENV=production
   export CHRONOLENS_DATA_CSV=/data/updated_data.csv
   ```

## Testing

### Test RAG Pipeline
```bash
python test_rag_pipeline.py
```

### Test health endpoint
```bash
curl http://localhost:5000/health
```

### Test query endpoint
```bash
curl -X POST http://localhost:5000/query \
  -H "Content-Type: application/json" \
  -d '{"query":"education scholarships","user_role":"public"}'
```

## File Structure
```
chronolens-explorer-main/
├── src/
│   ├── rag_module.py          # RAG pipeline
│   ├── updated_data.csv        # Government schemes dataset
│   ├── pages/
│   │   └── QueryRetrieval.tsx  # React chatbot component  
│   └── api/
│       └── client.ts           # API client
├── app.py                       # Flask backend
├── requirements.txt             # Python dependencies
└── test_rag_pipeline.py         # Testing script
```

## References
- [LangChain Documentation](https://python.langchain.com/)
- [FAISS Vector Store](https://github.com/facebookresearch/faiss)
- [Sentence Transformers](https://www.sbert.net/)
- [Mistral AI](https://mistral.ai/)

---

**Last Updated**: March 1, 2026  
**Version**: 1.0.0
