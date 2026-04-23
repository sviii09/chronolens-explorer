import { PolicyDocument, PolicyCategory, SourceType, DocumentType } from '@/types/policy';

export interface SchemeData {
  scheme_name: string;
  slug: string;
  details: string;
  benefits: string;
  eligibility: string;
  application: string;
  documents: string;
  level: string;
  schemeCategory: string;
  tags: string;
}

// Map scheme categories to policy categories
const categoryMapping: Record<string, PolicyCategory> = {
  'Agriculture,Rural & Environment, Social welfare & Empowerment': 'education',
  'Social welfare & Empowerment': 'womens',
  'Education & Learning': 'education',
  'Business & Entrepreneurship': 'taxation',
  'Healthcare': 'healthcare',
  'Transport': 'transport',
  'Social Welfare': 'womens',
  'Welfare': 'womens',
  'Education': 'education',
  'Business': 'taxation',
  'Health': 'healthcare',
};

// Map levels to source types
const levelToSourceType: Record<string, SourceType> = {
  'State': 'government',
  'Central': 'government',
  'Union Territory': 'government',
  'Local': 'government',
  'NGO': 'ngo',
  'Private': 'research_institute',
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
};

export const parseSchemeCSV = (csvContent: string): SchemeData[] => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const schemes: SchemeData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;

    const scheme: SchemeData = {
      scheme_name: values[0] || '',
      slug: values[1] || '',
      details: values[2] || '',
      benefits: values[3] || '',
      eligibility: values[4] || '',
      application: values[5] || '',
      documents: values[6] || '',
      level: values[7] || '',
      schemeCategory: values[8] || '',
      tags: values[9] || '',
    };

    if (scheme.scheme_name) {
      schemes.push(scheme);
    }
  }

  return schemes;
};

export const convertSchemesToPolicies = (schemes: SchemeData[]): PolicyDocument[] => {
  return schemes.map((scheme, index) => {
    // Determine category
    const categoryKey = Object.keys(categoryMapping).find(key => 
      scheme.schemeCategory.includes(key) || scheme.tags.includes(key)
    );
    const category = categoryKey ? categoryMapping[categoryKey] : 'education';

    // Determine source type
    const sourceType = levelToSourceType[scheme.level] || 'government';

    // Extract source name from level if available
    const source = scheme.level || 'Government Department';

    // Generate a date (since CSV doesn't have dates, use today minus some days)
    const publishedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Create excerpt from benefits
    const excerpt = scheme.benefits.substring(0, 150) + (scheme.benefits.length > 150 ? '...' : '');

    // Create full content from all fields
    const content = `
Scheme: ${scheme.scheme_name}

Details:
${scheme.details}

Benefits:
${scheme.benefits}

Eligibility:
${scheme.eligibility}

Application Process:
${scheme.application}

Required Documents:
${scheme.documents}
`.trim();

    return {
      id: `scheme-${scheme.slug || index}`,
      title: scheme.scheme_name,
      category: category as PolicyCategory,
      source: source,
      sourceType: sourceType,
      publishedAt,
      type: 'regulation' as DocumentType,
      excerpt,
      content,
      metadata: {
        documentId: `scheme-${scheme.slug || index}`,
        ingestedAt: new Date().toISOString(),
        chunkCount: 1,
        rawLength: content.length,
        cleanedLength: content.length,
      },
    };
  });
};
