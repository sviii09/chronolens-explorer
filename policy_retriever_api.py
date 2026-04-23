#!/usr/bin/env python3
"""
Government Schemes Policy Retriever API
Flask backend for retrieving government schemes with search, filter, and LLM integration support
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import csv
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import json

app = Flask(__name__)
CORS(app)

# Global schemes cache
SCHEMES_CACHE = []
SCHEMES_INDEXED = {}

def load_schemes_from_csv(csv_path: str) -> List[Dict]:
    """Load all schemes from CSV file"""
    global SCHEMES_CACHE, SCHEMES_INDEXED
    
    schemes = []
    try:
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for idx, row in enumerate(reader, 1):
                scheme = {
                    'id': idx,
                    'scheme_name': row.get('scheme_name', ''),
                    'slug': row.get('slug', ''),
                    'details': row.get('details', ''),
                    'benefits': row.get('benefits', ''),
                    'eligibility': row.get('eligibility', ''),
                    'application': row.get('application', ''),
                    'documents': row.get('documents', ''),
                    'level': row.get('level', ''),
                    'schemeCategory': row.get('schemeCategory', ''),
                    'tags': row.get('tags', '')
                }
                schemes.append(scheme)
                # Index by slug for fast lookup
                SCHEMES_INDEXED[scheme['slug']] = scheme
        
        SCHEMES_CACHE = schemes
        print(f"✅ Loaded {len(schemes)} schemes from CSV")
        return schemes
    except Exception as e:
        print(f"❌ Error loading CSV: {str(e)}")
        return []


def search_schemes(query: str, limit: int = 50) -> List[Dict]:
    """Full-text search across schemes"""
    if not query or len(query) < 2:
        return []
    
    query_lower = query.lower()
    results = []
    
    for scheme in SCHEMES_CACHE:
        score = 0
        searchable_text = f"{scheme['scheme_name']} {scheme['details']} {scheme['tags']} {scheme['benefits']} {scheme['schemeCategory']}"
        searchable_lower = searchable_text.lower()
        
        # Score based on match quality
        if query_lower in scheme['scheme_name'].lower():
            score += 100  # Exact name match
        elif searchable_lower.find(query_lower) != -1:
            score += 50   # Text contains query
        
        # Check tags
        if query_lower in scheme['tags'].lower():
            score += 75
        
        if score > 0:
            results.append((scheme, score))
    
    # Sort by score
    results.sort(key=lambda x: x[1], reverse=True)
    return [r[0] for r in results[:limit]]


def filter_schemes(
    category: Optional[str] = None,
    level: Optional[str] = None,
    tags: Optional[str] = None,
    limit: int = 50
) -> List[Dict]:
    """Filter schemes by various criteria"""
    results = SCHEMES_CACHE
    
    if category:
        results = [s for s in results if category.lower() in s['schemeCategory'].lower()]
    
    if level:
        results = [s for s in results if s['level'].lower() == level.lower()]
    
    if tags:
        tag_list = [t.strip() for t in tags.split(',')]
        results = [s for s in results if any(t.lower() in s['tags'].lower() for t in tag_list)]
    
    return results[:limit]


def get_scheme_metadata() -> Dict:
    """Get metadata about all schemes"""
    categories = set()
    levels = set()
    
    for scheme in SCHEMES_CACHE:
        categories.add(scheme['schemeCategory'])
        levels.add(scheme['level'])
    
    return {
        'total': len(SCHEMES_CACHE),
        'categories': sorted(list(categories)),
        'levels': sorted(list(levels)),
        'timestamp': datetime.now().isoformat()
    }


# API Routes

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'Government Schemes Policy Retriever',
        'schemes_loaded': len(SCHEMES_CACHE),
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/schemes', methods=['GET'])
def get_schemes():
    """Get all schemes with optional pagination"""
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('pageSize', 50, type=int)
    
    start = (page - 1) * page_size
    end = start + page_size
    
    total = len(SCHEMES_CACHE)
    schemes = SCHEMES_CACHE[start:end]
    
    return jsonify({
        'data': schemes,
        'pagination': {
            'page': page,
            'pageSize': page_size,
            'total': total,
            'pages': (total + page_size - 1) // page_size
        },
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/schemes/search', methods=['POST'])
def search():
    """Full-text search across all schemes"""
    data = request.get_json() or {}
    query = data.get('query', '').strip()
    limit = data.get('limit', 50)
    
    if not query:
        return jsonify({'error': 'Query parameter required'}), 400
    
    results = search_schemes(query, limit)
    
    return jsonify({
        'query': query,
        'results': results,
        'count': len(results),
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/schemes/filter', methods=['POST'])
def filter_all():
    """Filter schemes by category, level, tags"""
    data = request.get_json() or {}
    
    category = data.get('category')
    level = data.get('level')
    tags = data.get('tags')
    limit = data.get('limit', 50)
    
    results = filter_schemes(category, level, tags, limit)
    
    return jsonify({
        'filters': {
            'category': category,
            'level': level,
            'tags': tags
        },
        'results': results,
        'count': len(results),
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/schemes/<slug>', methods=['GET'])
def get_scheme_by_slug(slug):
    """Get a specific scheme by slug"""
    scheme = SCHEMES_INDEXED.get(slug)
    
    if not scheme:
        return jsonify({'error': 'Scheme not found'}), 404
    
    return jsonify({
        'data': scheme,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/schemes/category/<category>', methods=['GET'])
def get_schemes_by_category(category):
    """Get all schemes in a category"""
    schemes = filter_schemes(category=category, limit=1000)
    
    return jsonify({
        'category': category,
        'schemes': schemes,
        'count': len(schemes),
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/schemes/level/<level>', methods=['GET'])
def get_schemes_by_level(level):
    """Get all schemes for a government level"""
    schemes = filter_schemes(level=level, limit=1000)
    
    return jsonify({
        'level': level,
        'schemes': schemes,
        'count': len(schemes),
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/metadata', methods=['GET'])
def metadata():
    """Get metadata about schemes (categories, levels, stats)"""
    return jsonify({
        'metadata': get_scheme_metadata(),
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/schemes/statistics', methods=['GET'])
def statistics():
    """Get detailed statistics about schemes"""
    category_stats = {}
    level_stats = {}
    
    for scheme in SCHEMES_CACHE:
        cat = scheme['schemeCategory']
        lv = scheme['level']
        
        category_stats[cat] = category_stats.get(cat, 0) + 1
        level_stats[lv] = level_stats.get(lv, 0) + 1
    
    return jsonify({
        'total_schemes': len(SCHEMES_CACHE),
        'by_category': sorted(category_stats.items(), key=lambda x: x[1], reverse=True),
        'by_level': sorted(level_stats.items(), key=lambda x: x[1], reverse=True),
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/schemes/advanced-search', methods=['POST'])
def advanced_search():
    """Advanced search with multiple filters"""
    data = request.get_json() or {}
    
    query = data.get('query', '').strip()
    category = data.get('category')
    level = data.get('level')
    tags = data.get('tags')
    limit = data.get('limit', 50)
    
    # Start with full search or filter
    if query:
        results = search_schemes(query, limit * 2)  # Get more to apply filters
    else:
        results = SCHEMES_CACHE
    
    # Apply additional filters
    if category:
        results = [s for s in results if category.lower() in s['schemeCategory'].lower()]
    
    if level:
        results = [s for s in results if s['level'].lower() == level.lower()]
    
    if tags:
        tag_list = [t.strip().lower() for t in tags.split(',')]
        results = [s for s in results if any(t in s['tags'].lower() for t in tag_list)]
    
    return jsonify({
        'query': query,
        'filters': {
            'category': category,
            'level': level,
            'tags': tags
        },
        'results': results[:limit],
        'count': len(results),
        'timestamp': datetime.now().isoformat()
    })


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    import sys
    import os
    
    # Default CSV path
    csv_path = os.path.join(os.path.dirname(__file__), 'src', 'updated_data.csv')
    
    # Allow override via environment variable
    if 'CSV_PATH' in os.environ:
        csv_path = os.environ['CSV_PATH']
    
    # Load schemes on startup
    print(f"📚 Loading schemes from: {csv_path}")
    load_schemes_from_csv(csv_path)
    
    if not SCHEMES_CACHE:
        print("⚠️  Warning: No schemes loaded. Check CSV path.")
    else:
        print(f"🎉 Ready! {len(SCHEMES_CACHE)} schemes available")
    
    # Run Flask app
    debug_mode = os.environ.get('DEBUG', 'False') == 'True'
    port = int(os.environ.get('PORT', 5000))
    
    print(f"\n🚀 Starting API server on port {port}")
    app.run(debug=debug_mode, port=port, host='0.0.0.0')
