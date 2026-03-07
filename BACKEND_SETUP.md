# ChronoLens Backend & Frontend Integration Guide

## Overview
ChronoLens is a full-stack RAG (Retrieval-Augmented Generation) application for querying Indian government policy schemes.

- **Backend**: Flask server running on `http://localhost:5000`
- **Frontend**: React + TypeScript with Vite
- **RAG Pipeline**: LangChain + FAISS + HuggingFace (Mistral-7B)

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+ (tested with 3.14.2)
- Node.js 18+ 
- Windows / macOS / Linux

### 1. Setup Backend

#### Option A: Using Virtual Environment (Recommended)
```bash
# Navigate to project root
cd chronolens-explorer-main

# Create virtual environment (already done if using venv)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start Flask server
python app.py
```

Expected output:
```
INFO:__main__:Starting ChronoLens Flask server on http://localhost:5000
 * Running on http://127.0.0.1:5000
```

#### Option B: Using Conda
```bash
conda create -n chronolens python=3.11 -y
conda activate chronolens
pip install -r requirements.txt
python app.py
```

### 2. Setup Frontend

```bash
# In a new terminal (keep backend running)
cd chronolens-explorer-main

# Install Node dependencies
npm install
# or with bun:
bun install

# Start development server
npm run dev
# or with bun:
bun run dev
```

Expected output:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### 3. Configure Environment

Backend URL is automatically set to `http://localhost:5000` in development.

If you need custom configuration:
```bash
# Create .env.local file:
echo "REACT_APP_API_URL=http://localhost:5000" > .env.local
```

---

## 📡 API Endpoints

### 1. Health Check
**GET** `/health`

Check if backend is running.

```bash
curl -X GET http://localhost:5000/health
```

Response:
```json
{
  "status": "ok",
  "service": "ChronoLens RAG Backend",
  "version": "1.0.0"
}
```

### 2. Get User Roles
**GET** `/roles`

Get available access roles and their permissions.

```bash
curl -X GET http://localhost:5000/roles
```

Response:
```json
{
  "roles": [
    {
      "id": "public",
      "label": "Public",
      "description": "General access — top 3 results"
    },
    {
      "id": "researcher",
      "label": "Researcher",
      "description": "Enhanced access — top 7 results"
    },
    {
      "id": "government_official",
      "label": "Government Official",
      "description": "Full access — top 10 results"
    }
  ]
}
```

### 3. Query RAG Pipeline
**POST** `/query`

Submit a query and get retrieved documents + AI-generated answer.

```bash
curl -X POST http://localhost:5000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Which schemes help rural women entrepreneurs?",
    "user_role": "public",
    "time_filter": null
  }'
```

Request body:
- `query` (string, required): Your policy question
- `user_role` (string, optional): One of `public`, `researcher`, `government_official` (default: `public`)
- `time_filter` (string, optional): ISO date for filtering (e.g., `"2024-01-01"`)

Response:
```json
{
  "retrieved_documents": [
    {
      "id": "doc_123",
      "title": "Scheme Name",
      "category": "womens",
      "source": "Government Portal",
      "excerpt": "Scheme description...",
      "relevance_score": 92,
      "matched_chunk": "Full matched text from document",
      "tags": "tag1, tag2",
      "level": "national",
      "slug": "scheme-slug"
    }
  ],
  "generated_answer": "Answer with [1] citations [2] to source documents.",
  "metadata": {
    "role": "public",
    "num_docs": 3,
    "latency_ms": 4250
  }
}
```

---

## 🔧 Frontend Integration

The frontend uses a centralized API client located at `src/api/client.ts`:

```typescript
import { queryRag, healthCheck, fetchRoles } from '@/api/client';

// Check backend health
const health = await healthCheck();

// Get available roles
const { roles } = await fetchRoles();

// Execute a RAG query
const result = await queryRag(
  'What education scholarships exist?',
  'public',
  null
);

console.log(result.retrieved_documents);
console.log(result.generated_answer);
console.log(result.metadata);
```

### Using the API in Components

**Example: QueryRetrieval.tsx**
```typescript
import { queryRag, ApiError } from '@/api/client';

const handleSubmit = async () => {
  try {
    const data = await queryRag(query, userRole, timeFilter);
    setResults(data.retrieved_documents);
    setAnswer(data.generated_answer);
  } catch (err) {
    if (err instanceof ApiError) {
      console.error(`API Error ${err.status}: ${err.message}`);
    } else if (err instanceof Error) {
      console.error(`Error: ${err.message}`);
    }
  }
};
```

---

## 📁 Project Structure

```
chronolens-explorer-main/
├── app.py                    # Flask backend entry point
├── requirements.txt          # Python dependencies
├── .env.local               # Local development config
├── venv/                    # Python virtual environment
│
├── src/
│   ├── api/
│   │   └── client.ts        # Centralized API client
│   ├── pages/
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── QueryRetrieval.tsx # RAG query interface
│   │   ├── PolicyExplorer.tsx # Policy browsing
│   │   └── SystemStatus.tsx # Backend health status
│   ├── components/
│   │   ├── layout/          # Layout components
│   │   ├── dashboard/       # Dashboard widgets
│   │   └── ui/              # UI components
│   └── data/
│       └── mockData.ts      # Mock data for UI
│
├── package.json             # Node dependencies
├── vite.config.ts          # Vite configuration
└── tsconfig.json           # TypeScript configuration
```

---

## 🐛 Troubleshooting

### Backend won't start
```
Error: ModuleNotFoundError: No module named 'flask'
```
**Solution**: 
```bash
# Activate virtual environment and reinstall dependencies:
pip install -r requirements.txt
```

### Backend returns 500 error
```
Error: Retrieval error: FAISS index not found
```
**Solution**: 
The RAG pipeline will automatically download and build the FAISS index on first use (takes 30-120 seconds). Wait for it to complete.

### Frontend can't reach backend
```
Cannot reach the Flask backend at http://localhost:5000
```
**Solution**:
1. Ensure Flask backend is running: `python app.py`
2. Check if port 5000 is not blocked by firewall
3. Verify CORS is enabled (already configured in app.py)
4. Check `.env.local` has correct `REACT_APP_API_URL`

### CORS errors in browser console
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Already fixed by `CORS(app)` in `app.py`. If still occurring:
```python
# In app.py:
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})
```

### Query endpoint returns no results
```
"retrieved_documents": []
```
**Possible causes**:
1. FAISS index is still building (first run)
2. Query is too specific or uses non-matching terms
3. Dataset not downloaded from Kaggle

**Solution**: Check the Flask server output for detailed error messages.

---

## 📊 Available Pages

### 1. **Dashboard** (`/`)
- Overview of policy statistics
- Category distribution
- Recent documents
- Top sources

### 2. **Query & Retrieve** (`/query`)
- **Main feature**: Submit queries to RAG pipeline
- Filter by user role (affects result count and visibility)
- Select policy categories to filter results
- View retrieved documents with relevance scores
- Read AI-generated analysis with citations

### 3. **Policy Explorer** (`/explorer`)
- Browse all available government schemes
- Filter and search
- Detailed scheme information

### 4. **System Status** (`/status`)
- Backend health status
- Query latency metrics
- Data freshness information
- Performance overview

---

## 🚀 Deployment

### Backend Deployment
For production, use a proper WSGI server:

```bash
# Install Gunicorn
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Frontend Deployment
```bash
# Build for production
npm run build

# This creates a `dist/` folder ready for deployment
# Deploy to Vercel, Netlify, etc.
```

Update `.env.production` with your production API URL in the deployment environment.

---

## 📚 Additional Resources

- [LangChain Documentation](https://python.langchain.com/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [React TypeScript Guide](https://react-typescript-cheatsheet.netlify.app/)
- [Vite Documentation](https://vite.dev/)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Flask server output for backend errors
3. Check browser console for frontend errors
4. Ensure Python and Node versions are compatible

---

**Last Updated**: February 2026
**Status**: ✅ Backend & Frontend Connected
