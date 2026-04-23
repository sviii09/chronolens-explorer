# Backend API Integration Guide

## Overview

This guide shows how to integrate the **Government Schemes Policy Retriever Backend API** with the PolicyExplorer frontend component. You have three options:

1. **Embedded Data** (Current) - Fastest, no server needed
2. **Backend API** (Recommended) - Best for production, dynamic updates
3. **Hybrid** - Fallback to embedded if API fails

## Option 1: Switching to Backend API (Complete Rewrite)

### Setup

1. **Start the backend API**
   ```bash
   # Windows
   start-api.bat
   
   # Or manually
   python policy_retriever_api.py
   ```

2. **Update PolicyExplorer Component**

Replace `src/pages/PolicyExplorer.tsx` with this API-based version:

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { PolicyRetrieverClient, Scheme, FilterParams, AdvancedSearchParams } from '@/api/policyRetrieverClient';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const client = new PolicyRetrieverClient(API_URL);

export default function QueryRetrieval() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [filteredSchemes, setFilteredSchemes] = useState<Scheme[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiHealth, setApiHealth] = useState(false);

  // Load metadata on mount
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setLoading(true);
        
        // Check API health
        try {
          const health = await client.health();
          setApiHealth(true);
          console.log('✅ API Health:', health);
        } catch {
          console.warn('⚠️ API unreachable, make sure to run: python policy_retriever_api.py');
          throw new Error('Backend API not available. Start it with: start-api.bat');
        }

        // Load metadata and schemes
        const [metadata, allSchemes] = await Promise.all([
          client.getMetadata(),
          client.getSchemes({ page: 1, pageSize: 100 })
        ]);

        setCategories(metadata.metadata.categories);
        setLevels(metadata.metadata.levels);
        setSchemes(allSchemes.data);
        setFilteredSchemes(allSchemes.data);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load schemes';
        setError(message);
        console.error('❌ Error loading schemes:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMetadata();
  }, []);

  // Search handler
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setFilteredSchemes(schemes);
      return;
    }

    setLoading(true);
    try {
      const params: AdvancedSearchParams = {
        query: searchQuery,
        category: selectedCategory || undefined,
        level: selectedLevel || undefined,
        tags: selectedTags || undefined,
        limit: 100
      };

      let result;
      if (selectedCategory || selectedLevel || selectedTags) {
        result = await client.advancedSearch(params);
      } else {
        result = await client.search(searchQuery);
      }

      setFilteredSchemes(result.results);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedLevel, selectedTags, schemes]);

  // Filter handler
  const handleFilter = useCallback(async () => {
    setLoading(true);
    try {
      const params: FilterParams = {
        category: selectedCategory || undefined,
        level: selectedLevel || undefined,
        tags: selectedTags || undefined,
        limit: 100
      };

      const result = await client.filter(params);
      setFilteredSchemes(result.results);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Filter failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedLevel, selectedTags]);

  // Clear filters
  const handleClear = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLevel('');
    setSelectedTags('');
    setFilteredSchemes(schemes);
    setError(null);
  };

  if (loading && schemes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500" />
          <p className="text-lg font-medium">Loading Government Schemes...</p>
          <p className="text-sm text-gray-500">
            {apiHealth ? 'Fetching from backend API...' : 'Connecting to API server...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Policy Explorer</h1>
        <p className="text-gray-600">
          Search and filter {schemes.length}+ government schemes
        </p>
        {apiHealth && <p className="text-sm text-green-600">✅ API Connected</p>}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search & Filter Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium mb-2">Search Schemes</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter scheme name, benefits, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="whitespace-nowrap"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Level Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Government Level</label>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All levels</SelectItem>
                {levels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
            <Input
              placeholder="e.g., loan, scholarship, grant"
              value={selectedTags}
              onChange={(e) => setSelectedTags(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="md:col-span-3 flex gap-2">
            <Button
              variant="outline"
              onClick={handleFilter}
              disabled={loading || !(selectedCategory || selectedLevel || selectedTags)}
            >
              Apply Filters
            </Button>
            <Button variant="ghost" onClick={handleClear}>
              Clear All
            </Button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Found {filteredSchemes.length} schemes
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchemes.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No schemes found. Try adjusting your filters.</p>
          </div>
        ) : (
          filteredSchemes.map((scheme) => (
            <div
              key={scheme.id}
              className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-bold text-lg mb-2 line-clamp-2">{scheme.scheme_name}</h3>
              
              <div className="space-y-2 text-sm mb-3">
                <p className="text-gray-700 line-clamp-2">{scheme.details}</p>
                <p className="text-green-600 font-semibold">{scheme.benefits}</p>
              </div>

              <div className="flex gap-2 mb-3 flex-wrap">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {scheme.level}
                </span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                  {scheme.schemeCategory.split(',')[0]}
                </span>
              </div>

              <div className="text-xs text-gray-500">
                <p>Eligibility: {scheme.eligibility.substring(0, 80)}...</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

3. **Update Environment Variables**

Create or update `.env.local`:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000

# Enable API mode
VITE_USE_API=true
```

### Usage

1. Start API: `start-api.bat`
2. Run frontend: `npm run dev`
3. API requests will automatically connect to backend

---

## Option 2: Hybrid Approach (Embedded + API Fallback)

Use embedded data by default, fallback to API if available:

```typescript
import { useEffect, useState } from 'react';
import { PolicyRetrieverClient, Scheme } from '@/api/policyRetrieverClient';
import { schemeCSVData, schemeCount } from '@/data/allSchemeData';

export const useSchemes = () => {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [source, setSource] = useState<'embedded' | 'api'>('embedded');
  const client = new PolicyRetrieverClient(import.meta.env.VITE_API_URL);

  useEffect(() => {
    const loadSchemes = async () => {
      try {
        // Try API first
        const response = await client.getSchemes({ pageSize: 100 });
        setSchemes(response.data);
        setSource('api');
        console.log('✅ Schemes loaded from API');
      } catch (error) {
        // Fallback to embedded data
        console.warn('API unavailable, using embedded data:', error);
        const parsed = parseSchemeCSV(schemeCSVData);
        setSchemes(parsed);
        setSource('embedded');
      }
    };

    loadSchemes();
  }, []);

  return { schemes, source };
};

function parseSchemeCSV(csv: string): Scheme[] {
  // Parse CSV and return Scheme array
  // ... existing parsing logic ...
}
```

---

## Option 3: Using Built-in Client Methods

Simple examples using `PolicyRetrieverClient`:

### Search Example
```typescript
import { PolicyRetrieverClient } from '@/api/policyRetrieverClient';

const client = new PolicyRetrieverClient('http://localhost:5000');

// Search for education schemes
const results = await client.search('education');
console.log(results.results); // Array of Scheme objects
```

### Filter Example
```typescript
// Find Central government business schemes
const results = await client.filter({
  category: 'Business & Entrepreneurship',
  level: 'Central',
  limit: 50
});
```

### Advanced Search
```typescript
// Search for women-focused education schemes
const results = await client.advancedSearch({
  query: 'women',
  category: 'Education & Learning',
  level: 'State',
  tags: 'scholarship,financial'
});
```

---

## API Response Intercepts

Add custom logic for API responses:

```typescript
// Error handling
client.search('query').catch(error => {
  if (error.message.includes('timeout')) {
    // Handle timeout
  } else if (error.message.includes('API Error: 404')) {
    // Handle not found
  }
});

// Request interception
const originalRequest = client.request;
client.request = async (method, endpoint, body) => {
  console.log(`📡 ${method} ${endpoint}`);
  const result = await originalRequest(method, endpoint, body);
  console.log(`✅ Response received`);
  return result;
};
```

---

## Performance Tips

### 1. Pagination
Load schemes in pages instead of all at once:

```typescript
async function loadSchemesInPages() {
  let allSchemes = [];
  let page = 1;
  
  while (true) {
    const response = await client.getSchemes({
      page,
      pageSize: 50
    });
    
    allSchemes = [...allSchemes, ...response.data];
    if (response.pagination.page >= response.pagination.pages) break;
    page++;
  }
  
  return allSchemes;
}
```

### 2. Caching Results
```typescript
const cache = new Map();

async function searchWithCache(query: string) {
  if (cache.has(query)) {
    return cache.get(query);
  }
  
  const result = await client.search(query);
  cache.set(query, result);
  return result;
}
```

### 3. Debouncing Searches
```typescript
import { useMemo } from 'react';
import { debounce } from 'lodash';

const debouncedSearch = useMemo(
  () => debounce(async (query) => {
    const results = await client.search(query);
    setResults(results.results);
  }, 300),
  []
);

const handleSearchChange = (e) => {
  setQuery(e.target.value);
  debouncedSearch(e.target.value);
};
```

---

## Troubleshooting

### Error: "Failed to fetch"
**Cause**: API server not running or CORS issue
**Solution**:
```bash
# Start API
start-api.bat

# Check API is running
curl http://localhost:5000/api/health
```

### Error: "CORS policy"
**Cause**: Frontend making requests from different origin
**Solution**: Already handled in `policy_retriever_api.py` with Flask-CORS

### Error: "404 Not Found"
**Cause**: Wrong API endpoint call
**Solution**: Check API_DOCUMENTATION.md for correct endpoint paths

---

## Next Steps

1. ✅ Choose integration approach (Option 1, 2, or 3)
2. ✅ Start backend API (`start-api.bat`)
3. ✅ Update PolicyExplorer.tsx with API calls
4. ✅ Test search and filter functionality
5. ✅ Deploy to production (see API_DOCUMENTATION.md scaling section)

---

**Questions?** Check API_DOCUMENTATION.md for full API reference.
