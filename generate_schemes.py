#!/usr/bin/env python3
"""
Generate TypeScript scheme data from CSV
This script reads the entire updated_data.csv file and generates a TypeScript constant
containing all schemes that can be imported into the frontend.
"""

import csv
import json
import os
from pathlib import Path

def read_csv_and_generate_ts(csv_path, output_path):
    """
    Read CSV file and generate TypeScript file with all schemes
    """
    
    schemes = []
    
    print(f"📖 Reading CSV from: {csv_path}")
    
    # Read the CSV file
    try:
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for idx, row in enumerate(reader, 1):
                scheme = {
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
                if idx % 10 == 0:
                    print(f"  ✓ Loaded {idx} schemes...")
        
        print(f"✅ Total schemes loaded: {len(schemes)}")
        
        # Generate TypeScript file
        print(f"\n📝 Generating TypeScript file...")
        
        # Build the CSV content with JSON encoding for safety
        import json
        
        csv_lines = []
        
        # Add header
        csv_lines.append("scheme_name,slug,details,benefits,eligibility,application,documents,level,schemeCategory,tags")
        
        # Add each scheme as a CSV line
        for scheme in schemes:
            line_parts = []
            for key in ['scheme_name', 'slug', 'details', 'benefits', 'eligibility', 'application', 'documents', 'level', 'schemeCategory', 'tags']:
                value = scheme.get(key, '')
                # Escape quotes and wrap in quotes if contains comma
                value = value.replace('"', '""')
                if ',' in value or '"' in value or '\n' in value:
                    line_parts.append(f'"{value}"')
                else:
                    line_parts.append(value)
            csv_lines.append(','.join(line_parts))
        
        csv_content = '\n'.join(csv_lines)
        
        # Escape the CSV content for TypeScript template string
        # Replace backticks and backslashes to avoid breaking the template literal
        csv_content_escaped = csv_content.replace('\\', '\\\\').replace('`', '\\`')
        
        # Write TypeScript file with proper escaping
        ts_content = f'''// Auto-generated file from generate_schemes.py
// Total schemes: {len(schemes)}
// Last updated: {__import__("datetime").datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

export const schemeCSVData = `{csv_content_escaped}`;

export const schemeCount = {len(schemes)};

export interface SchemeMetadata {{
  total: number;
  lastUpdated: string;
  categories: string[];
  levels: string[];
}}

// Extract metadata
const extractMetadata = (): SchemeMetadata => {{
  const lines = schemeCSVData.split('\\n');
  const schemes = lines.slice(1); // Skip header
  
  const categories = new Set<string>();
  const levels = new Set<string>();
  
  schemes.forEach(line => {{
    const parts = line.split(',');
    if (parts.length >= 9) {{
      categories.add(parts[8]?.replace(/"/g, '') || 'Other');
      levels.add(parts[7]?.replace(/"/g, '') || 'State');
    }}
  }});
  
  return {{
    total: schemes.length,
    lastUpdated: new Date().toISOString(),
    categories: Array.from(categories),
    levels: Array.from(levels)
  }};
}};

export const schemeMetadata = extractMetadata();
'''
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(ts_content)
        
        print(f"✅ Generated: {output_path}")
        print(f"   - Total schemes: {len(schemes)}")
        print(f"   - File size: {len(ts_content) / 1024:.2f} KB")
        
        # Print summary
        print("\n📊 Scheme Summary:")
        print(f"   - First scheme: {schemes[0]['scheme_name']}")
        print(f"   - Last scheme: {schemes[-1]['scheme_name']}")
        
        # Count by category and level
        categories = {}
        levels = {}
        for scheme in schemes:
            cat = scheme.get('schemeCategory', 'Other')
            lv = scheme.get('level', 'State')
            categories[cat] = categories.get(cat, 0) + 1
            levels[lv] = levels.get(lv, 0) + 1
        
        print("\n   Categories:")
        for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
            print(f"     • {cat}: {count}")
        
        print("\n   Levels:")
        for lv, count in sorted(levels.items()):
            print(f"     • {lv}: {count}")
        
        return True
        
    except FileNotFoundError:
        print(f"❌ Error: CSV file not found at {csv_path}")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    # Get paths
    script_dir = Path(__file__).parent
    csv_path = script_dir / "src" / "updated_data.csv"
    output_path = script_dir / "src" / "data" / "allSchemeData.ts"
    
    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Generate the file
    success = read_csv_and_generate_ts(str(csv_path), str(output_path))
    
    exit(0 if success else 1)
