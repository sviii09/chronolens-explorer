# ChronoLens - Government Schemes RAG Assistant

A Flask-powered RAG (Retrieval Augmented Generation) system for querying Indian government schemes using semantic search and LLM-based generation.

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 16+
- pip/npm

### Installation

**1. Install Backend Dependencies**
```bash
pip install -r requirements.txt
```

**2. Start Backend (on port 5000)**
```bash
python app.py
```

The backend will:
- Load the embeddings model (first time: ~2 min)
- Build FAISS index from CSV (first time: ~3 min)
- Start serving on http://localhost:5000

**3. In Another Terminal, Start Frontend (on port 5173)**
```bash
npm install
npm run dev
```

**4. Open in Browser**
- http://localhost:5173

## API Endpoints

### GET `/health`
Health check.

**Response:**
```json
{
  "status": "ok",
  "service": "ChronoLens RAG Backend",
  "version": "2.0.0"
}
```

### GET `/roles`
Get available user roles.

**Response:**
```json
{
  "roles": [
    {"id": "public", "label": "Public", "description": "Top 3 results"},
    {"id": "researcher", "label": "Researcher", "description": "Top 7 results"},
    {"id": "government_official", "label": "Gov. Official", "description": "Top 10 results"}
  ]
}
```

### POST `/query`
Execute RAG query.

**Request:**
```json
{
  "query": "Which schemes are available for women entrepreneurs?",
  "user_role": "public",
  "time_filter": null
}
```

**Response:**
```json
{
  "retrieved_documents": [...],
  "generated_answer": "...",
  "metadata": {
    "role": "public",
    "num_docs": 3,
    "latency_ms": 1250
  }
}
```

## Environment Variables

- `CHRONOLENS_SKIP_LLM=1` - Skip LLM loading (use extractive summaries only)
- `CHRONOLENS_DATA_CSV=/path/to/csv` - Use custom CSV file

## Architecture

- **Frontend**: React + Vite (port 5173)
- **Backend**: Flask (port 5000)
- **Embeddings**: HuggingFace all-MiniLM-L6-v2 (384-dim vectors)
- **Vector DB**: FAISS
- **LLM**: Mistral-7B-Instruct-v0.2 (optional, GPU recommended)
- **Data**: Indian Government Schemes (500+ schemes)