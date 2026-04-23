# Government Schemes Policy Retriever - Backend API

## Overview
A Python Flask REST API for retrieving, searching, and filtering **450+ government schemes**. This system provides a policy retriever backend that can be used independently or integrated with the frontend.

## ✨ Features

- ✅ **Full-Text Search** - Search across all 450+ schemes
- ✅ **Advanced Filtering** - By category, government level, tags
- ✅ **Fast Lookups** - Query by scheme slug
- ✅ **Metadata & Statistics** - Category and level breakdowns
- ✅ **CORS Enabled** - Frontend integration ready
- ✅ **RESTful API** - Standard HTTP methods
- ✅ **JSON Responses** - Clean data format

## 📋 Setup

### 1. Install Dependencies
```bash
pip install -r requirements-api.txt
```

Or manually:
```bash
pip install Flask==3.0.0 Flask-CORS==4.0.0 Werkzeug==3.0.1
```

### 2. Start the Server

**Option 1: Batch File (Windows)**
```bash
start-api.bat
```

**Option 2: Terminal**
```bash
python policy_retriever_api.py
```

**Option 3: Debug Mode**
```bash
set FLASK_DEBUG=True
python policy_retriever_api.py
```

The server will start on `http://localhost:5000`

## 🔌 API Endpoints

### Health Check
```
GET /api/health
```
**Response:**
```json
{
  "status": "ok",
  "service": "Government Schemes Policy Retriever",
  "schemes_loaded": 450,
  "timestamp": "2026-03-12T10:30:00"
}
```

### Get All Schemes (Paginated)
```
GET /api/schemes?page=1&pageSize=50
```
**Parameters:**
- `page` (int, default: 1) - Page number
- `pageSize` (int, default: 50) - Items per page

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "scheme_name": "Immediate Relief Assistance",
      "slug": "ira-wrflsncs",
      "details": "...",
      "benefits": "₹1,00,000",
      "level": "State",
      "schemeCategory": "Agriculture,Rural & Environment"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 450,
    "pages": 9
  },
  "timestamp": "2026-03-12T10:30:00"
}
```

### Search Schemes
```
POST /api/schemes/search
Content-Type: application/json

{
  "query": "education",
  "limit": 50
}
```

**Response:**
```json
{
  "query": "education",
  "results": [
    {
      "id": 5,
      "scheme_name": "Educational Grant Program",
      "slug": "egp",
      "benefits": "₹50,000",
      "level": "Central",
      "schemeCategory": "Education & Learning"
    }
  ],
  "count": 15,
  "timestamp": "2026-03-12T10:30:00"
}
```

### Filter Schemes
```
POST /api/schemes/filter
Content-Type: application/json

{
  "category": "Business & Entrepreneurship",
  "level": "State",
  "tags": "MSME,loan",
  "limit": 100
}
```

**Response:**
```json
{
  "filters": {
    "category": "Business & Entrepreneurship",
    "level": "State",
    "tags": "MSME,loan"
  },
  "results": [...],
  "count": 45,
  "timestamp": "2026-03-12T10:30:00"
}
```

### Get Scheme by Slug
```
GET /api/schemes/ira-wrflsncs
```

### Get All Schemes by Category
```
GET /api/schemes/category/Education%20%26%20Learning
```

### Get All Schemes by Government Level
```
GET /api/schemes/level/State
```

### Get Metadata
```
GET /api/metadata
```

**Response:**
```json
{
  "metadata": {
    "total": 450,
    "categories": [
      "Agriculture,Rural & Environment",
      "Business & Entrepreneurship",
      "Education & Learning",
      ...
    ],
    "levels": ["Central", "State", "Union Territory"],
    "timestamp": "2026-03-12T10:30:00"
  }
}
```

### Get Statistics
```
GET /api/schemes/statistics
```

**Response:**
```json
{
  "total_schemes": 450,
  "by_category": [
    ["Business & Entrepreneurship", 180],
    ["Social welfare & Empowerment", 95],
    ["Education & Learning", 45]
  ],
  "by_level": [
    ["State", 350],
    ["Central", 80],
    ["Union Territory", 20]
  ],
  "timestamp": "2026-03-12T10:30:00"
}
```

### Advanced Search
```
POST /api/schemes/advanced-search
Content-Type: application/json

{
  "query": "education",
  "category": "Education & Learning",
  "level": "Central",
  "tags": "scholarship,financial",
  "limit": 50
}
```

## 🔗 Frontend Integration

### Example: React Integration

```typescript
// src/services/policyRetrieverAPI.ts

export const searchSchemes = async (query: string, limit: number = 50) => {
  const response = await fetch('http://localhost:5000/api/schemes/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, limit })
  });
  return response.json();
};

export const filterSchemes = async (
  category?: string,
  level?: string,
  tags?: string,
  limit: number = 50
) => {
  const response = await fetch('http://localhost:5000/api/schemes/filter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ category, level, tags, limit })
  });
  return response.json();
};

export const getSchemeMetadata = async () => {
  const response = await fetch('http://localhost:5000/api/metadata');
  return response.json();
};
```

### Usage in PolicyExplorer

```typescript
import { searchSchemes } from '@/services/policyRetrieverAPI';

// Instead of embedded data
const handleSearch = async (query: string) => {
  try {
    const result = await searchSchemes(query);
    setDocuments(result.results);
  } catch (error) {
    console.error('Search failed:', error);
  }
};
```

## 📊 Data Schema

Each scheme contains:

```typescript
interface Scheme {
  id: number;
  scheme_name: string;        // Official name
  slug: string;               // URL-friendly identifier
  details: string;            // Full description
  benefits: string;           // Benefits offered
  eligibility: string;        // Who can apply
  application: string;        // How to apply
  documents: string;          // Required documents
  level: string;              // Central / State / Union Territory
  schemeCategory: string;     // Policy category
  tags: string;               // Search keywords
}
```

## 🚀 Performance

- **Search**: < 100ms for most queries
- **Filter**: < 50ms per filter application
- **Startup**: ~2-5 seconds (first load includes CSV parsing)
- **Memory**: ~150-200 MB with all 450+ schemes loaded

## 🛠️ Configuration

### Environment Variables

```bash
# Port (default: 5000)
set PORT=5000

# Debug mode (True/False)
set FLASK_DEBUG=True

# CSV file path
set CSV_PATH=src/updated_data.csv

# Environment
set FLASK_ENV=development
```

### Custom CSV Path

You can use a different CSV file:

```bash
set CSV_PATH="C:\path\to\custom_schemes.csv"
python policy_retriever_api.py
```

## 🔍 Search Examples

### Search for Education Schemes
```bash
curl -X POST http://localhost:5000/api/schemes/search \
  -H "Content-Type: application/json" \
  -d '{"query": "education"}' | python -m json.tool
```

### Search for Women Empowerment
```bash
curl -X POST http://localhost:5000/api/schemes/search \
  -H "Content-Type: application/json" \
  -d '{"query": "women empowerment", "limit": 100}'
```

### Filter by Business Category and State Level
```bash
curl -X POST http://localhost:5000/api/schemes/filter \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Business & Entrepreneurship",
    "level": "State",
    "limit": 50
  }'
```

## 🐛 Troubleshooting

### Issue: "Module not found: Flask"
**Solution:**
```bash
pip install -r requirements-api.txt
```

### Issue: "Port 5000 already in use"
**Solution:**
```bash
set PORT=5001
python policy_retriever_api.py
```

### Issue: CSV file not found
**Solution:**
```bash
# Make sure you're in the project root
cd "C:\path\to\chronolens-explorer-main"
python policy_retriever_api.py
```

### Issue: Server crashes on startup
**Solution:**
1. Check if CSV file is valid UTF-8 encoding
2. Check if CSV has proper header row
3. Review error logs for specific issues

## 📈 Scaling

For production deployment:

1. **Use Gunicorn** (production WSGI server)
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 policy_retriever_api:app
   ```

2. **Use Nginx** (reverse proxy)
   - Nginx handles CORS
   - Load balancing
   - SSL/TLS

3. **Database Integration** (Future)
   - Replace CSV with SQLite/PostgreSQL
   - Index schemes for faster search
   - Enable real-time updates

4. **Caching**
   - Redis for search results
   - In-memory LRU cache for frequent queries

## 🔐 Security

Currently, the API is open for testing. For production, consider:

- ✅ Add API key authentication
- ✅ Rate limiting (prevent abuse)
- ✅ HTTPS/TLS encryption
- ✅ Input validation
- ✅ CORS whitelist (only allowed frontend domains)

## 📝 API Documentation

### OpenAPI/Swagger (Future Enhancement)

Add Swagger UI for interactive API documentation:

```bash
pip install flask-swagger-ui flasgger
```

Then access at: `http://localhost:5000/swagger/`

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review Flask documentation: https://flask.palletsprojects.com/
3. Check API error messages in terminal

## 📄 License

This API is part of ChronoLens Explorer project.

---

**Status**: ✅ Ready for Development & Testing
**Last Updated**: March 12, 2026
**Total Schemes**: 450+
