# API Usage Examples & Comparison

## 🎯 Quick Decision Matrix

**Choose your integration method:**

| Need | Recommendation | Why |
|------|-----------------|------|
| Maximum performance | Backend API | Sub-100ms queries, scalable |
| Offline support | Embedded Data | Works without server |
| Development simplicity | Embedded Data | Already integrated |
| Production deployment | Backend API | Better for scale |
| Resilience required | Hybrid | Fallback if API down |

---

## 📋 Code Examples

### 1. Search for Education Schemes (All Methods)

#### Method A: Using TypeScript Client (Recommended)
```typescript
import { PolicyRetrieverClient } from '@/api/policyRetrieverClient';

const client = new PolicyRetrieverClient('http://localhost:5000');

const results = await client.search('education');
console.log(`Found ${results.count} schemes`);
results.results.forEach(scheme => {
  console.log(`- ${scheme.scheme_name}`);
  console.log(`  Benefits: ${scheme.benefits}`);
  console.log(`  Level: ${scheme.level}`);
});
```

#### Method B: Using cURL (Testing/Debug)
```bash
curl -X POST http://localhost:5000/api/schemes/search \
  -H "Content-Type: application/json" \
  -d '{"query": "education", "limit": 50}' | python -m json.tool
```

#### Method C: Using Fetch API (Direct)
```javascript
const response = await fetch('http://localhost:5000/api/schemes/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'education', limit: 50 })
});
const data = await response.json();
console.log(data.results);
```

#### Method D: Embedded Data (No API)
```typescript
import { schemeCSVData } from '@/data/allSchemeData';

// Parse CSV and filter locally
const schemes = parseSchemeCSV(schemeCSVData)
  .filter(s => s.scheme_name.toLowerCase().includes('education'));
```

---

### 2. Filter Schemes by Multiple Criteria

#### Using API Client
```typescript
const results = await client.filter({
  category: 'Business & Entrepreneurship',
  level: 'State',
  tags: 'MSME,loan',
  limit: 100
});

console.log(`Found ${results.count} business schemes at State level`);
```

#### Using cURL
```bash
curl -X POST http://localhost:5000/api/schemes/filter \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Business & Entrepreneurship",
    "level": "State",
    "tags": "MSME,loan",
    "limit": 100
  }'
```

---

### 3. Advanced Search (Query + Filters)

#### Using API Client
```typescript
const results = await client.advancedSearch({
  query: 'women empowerment',
  category: 'Social welfare & Empowerment',
  level: 'Central',
  tags: 'financial,skill',
  limit: 50
});
```

#### Combined: Query alone + Multiple categories
```typescript
// Search everywhere
const allResults = await client.search('scholarship');

// Filter specific type
const stateSchemes = allResults.results
  .filter(s => s.level === 'State');
```

---

### 4. React Component Integration (Full Example)

#### Option A: API-Based (Dynamic)
```typescript
import React, { useState, useEffect } from 'react';
import { PolicyRetrieverClient } from '@/api/policyRetrieverClient';
import { Scheme } from '@/api/policyRetrieverClient';

export function SchemesDirectory() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  const client = new PolicyRetrieverClient('http://localhost:5000');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const results = await client.search(query);
      setSchemes(results.results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Search Government Schemes</h1>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search schemes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2 border rounded"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      <div className="grid gap-4">
        {schemes.map(scheme => (
          <div key={scheme.id} className="p-4 border rounded hover:shadow-lg">
            <h2 className="text-xl font-bold">{scheme.scheme_name}</h2>
            <p className="text-gray-600 my-2">{scheme.details}</p>
            <p className="text-green-600 font-semibold">Benefits: {scheme.benefits}</p>
            <div className="flex gap-2 mt-2">
              <span className="bg-blue-100 px-2 py-1 rounded text-sm">{scheme.level}</span>
              <span className="bg-purple-100 px-2 py-1 rounded text-sm">
                {scheme.schemeCategory.split(',')[0]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Option B: Embedded Data (Static)
```typescript
import React, { useState, useMemo } from 'react';
import { schemeCSVData } from '@/data/allSchemeData';
import { Scheme } from '@/types/policy';

function parseSchemeCSV(csv: string): Scheme[] {
  const lines = csv.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = parseCSVLine(line);
      return {
        scheme_name: values[0] || '',
        details: values[1] || '',
        benefits: values[2] || '',
        level: values[3] || '',
        // ... map other fields
      };
    });
}

export function SchemesDirectoryStatic() {
  const [query, setQuery] = useState('');
  
  const schemes = useMemo(() => parseSchemeCSV(schemeCSVData), []);
  
  const filtered = useMemo(() => 
    schemes.filter(s => 
      s.scheme_name.toLowerCase().includes(query.toLowerCase())
    ),
    [schemes, query]
  );

  return (
    <div className="p-6">
      <input
        type="text"
        placeholder="Search schemes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-2 border rounded mb-4"
      />
      
      <div className="grid gap-4">
        {filtered.map((scheme, i) => (
          <div key={i} className="p-4 border rounded">
            <h2 className="text-xl font-bold">{scheme.scheme_name}</h2>
            <p className="text-green-600">{scheme.benefits}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 5. Get Statistics

#### Using API Client
```typescript
const stats = await client.getStatistics();

console.log(`Total Schemes: ${stats.total_schemes}`);
console.log('\nBy Category:');
stats.by_category.forEach(([category, count]) => {
  console.log(`  ${category}: ${count}`);
});

console.log('\nBy Government Level:');
stats.by_level.forEach(([level, count]) => {
  console.log(`  ${level}: ${count}`);
});
```

#### Using cURL
```bash
curl http://localhost:5000/api/schemes/statistics | python -m json.tool
```

#### Expected Output
```json
{
  "total_schemes": 450,
  "by_category": [
    ["Business & Entrepreneurship", 150],
    ["Social welfare & Empowerment", 95],
    ["Education & Learning", 85]
  ],
  "by_level": [
    ["State", 300],
    ["Central", 120],
    ["Union Territory", 30]
  ]
}
```

---

### 6. Get Category Metadata

#### Using API Client
```typescript
const metadata = await client.getMetadata();

const categories = metadata.metadata.categories;
const levels = metadata.metadata.levels;

// Use in dropdown
<select>
  {categories.map(cat => (
    <option key={cat} value={cat}>{cat}</option>
  ))}
</select>
```

#### Using cURL
```bash
curl http://localhost:5000/api/metadata
```

---

### 7. Hybrid Approach (API with Fallback)

```typescript
import { PolicyRetrieverClient } from '@/api/policyRetrieverClient';
import { schemeCSVData } from '@/data/allSchemeData';

export function useSchemes(apiUrl: string = 'http://localhost:5000') {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [source, setSource] = useState<'api' | 'embedded'>('embedded');

  useEffect(() => {
    const loadSchemes = async () => {
      const client = new PolicyRetrieverClient(apiUrl);
      
      try {
        // Try API first
        console.log('Attempting to connect to API...');
        const response = await client.getSchemes({ pageSize: 100 });
        setSchemes(response.data);
        setSource('api');
        console.log('✅ Loaded from API');
      } catch (error) {
        // Fallback to embedded data
        console.log('❌ API unavailable, using embedded data:', error);
        const parsed = parseSchemeCSV(schemeCSVData);
        setSchemes(parsed);
        setSource('embedded');
      }
    };

    loadSchemes();
  }, [apiUrl]);

  return { schemes, source, isFromAPI: source === 'api' };
}

// Usage in component
export function App() {
  const { schemes, source } = useSchemes();
  
  return (
    <div>
      <p>Data source: {source === 'api' ? '🌐 API' : '📦 Embedded'}</p>
      <p>Schemes loaded: {schemes.length}</p>
    </div>
  );
}
```

---

### 8. Error Handling

#### Method A: Try-Catch Pattern
```typescript
try {
  const results = await client.search('education');
  console.log('Found:', results.count);
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      console.error('Search timed out');
    } else if (error.message.includes('404')) {
      console.error('Endpoint not found');
    } else {
      console.error('Search failed:', error.message);
    }
  }
}
```

#### Method B: Fetch with Error Handling
```typescript
const search = async (query: string) => {
  try {
    const response = await fetch('http://localhost:5000/api/schemes/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to search:', error);
    throw error;
  }
};
```

---

### 9. Pagination Example

#### Method A: Using API Client
```typescript
async function getAllSchemes() {
  let allSchemes = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await client.getSchemes({
      page,
      pageSize: 50
    });

    allSchemes = [...allSchemes, ...response.data];
    
    hasMore = response.pagination.page < response.pagination.pages;
    page++;
  }

  return allSchemes;
}
```

#### Method B: Using cURL with Pagination
```bash
# Get first 50
curl "http://localhost:5000/api/schemes?page=1&pageSize=50"

# Get next 50
curl "http://localhost:5000/api/schemes?page=2&pageSize=50"
```

---

### 10. Real-World Component: Search + Filter

```typescript
import React, { useState, useEffect } from 'react';
import { PolicyRetrieverClient } from '@/api/policyRetrieverClient';

export function AdvancedSchemeSearch() {
  const [schemes, setSchemes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [levels, setLevels] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [loading, setLoading] = useState(false);

  const client = new PolicyRetrieverClient('http://localhost:5000');

  // Load metadata on mount
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const meta = await client.getMetadata();
        setCategories(meta.metadata.categories);
        setLevels(meta.metadata.levels);
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    };
    loadMetadata();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      let results;
      
      if (query && (selectedCategory || selectedLevel)) {
        // Advanced search with filters
        results = await client.advancedSearch({
          query,
          category: selectedCategory || undefined,
          level: selectedLevel || undefined,
          limit: 100
        });
      } else if (query) {
        // Simple search
        results = await client.search(query);
      } else if (selectedCategory || selectedLevel) {
        // Filter only
        results = await client.filter({
          category: selectedCategory || undefined,
          level: selectedLevel || undefined,
          limit: 100
        });
      }
      
      setSchemes(results?.results || []);
    } catch (err) {
      console.error('Search/filter failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Search Bar */}
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search by name, benefits, etc..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSearch()}
          className="w-full px-4 py-2 border rounded"
        />

        {/* Filters */}
        <div className="grid grid-cols-2 gap-4">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedLevel}
            onChange={e => setSelectedLevel(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Results */}
      <div>
        <p className="text-gray-600 mb-4">Found {schemes.length} schemes</p>
        <div className="space-y-4">
          {schemes.map(scheme => (
            <div key={scheme.id} className="p-4 border rounded hover:shadow-md">
              <h3 className="font-bold text-lg mb-2">{scheme.scheme_name}</h3>
              <p className="text-gray-600 mb-2">{scheme.details}</p>
              <p className="text-green-600 font-semibold mb-2">{scheme.benefits}</p>
              <div className="flex gap-2">
                <span className="bg-blue-100 px-2 py-1 text-sm rounded">
                  {scheme.level}
                </span>
                <span className="bg-purple-100 px-2 py-1 text-sm rounded">
                  {scheme.schemeCategory.split(',')[0]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 🔀 Comparison: API vs Embedded

### Response Time
```
┌─────────────────┬──────────┬──────────┐
│ Operation       │ API      │ Embedded │
├─────────────────┼──────────┼──────────┤
│ Search          │ 100ms    │ < 1ms    │
│ Filter          │ 50ms     │ < 1ms    │
│ First Load      │ 2-5s     │ 1s       │
└─────────────────┴──────────┴──────────┘
```

### Bundle Size
```
Embedded: 12.8 MB (uncompressed)
         2-3 MB (gzipped)
API Only: 0 MB (loaded at runtime)
```

---

## 📱 Browser DevTools Testing

### In Chrome Console
```javascript
// Test API directly
const response = await fetch('http://localhost:5000/api/schemes/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'education' })
});

const data = await response.json();
console.log(data);
```

---

**Questions?** See `API_DOCUMENTATION.md` or `BACKEND_INTEGRATION_GUIDE.md`
