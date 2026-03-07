import { 
  PolicyDocument, 
  PolicyCategoryInfo, 
  SourceInfo, 
  TimelineDataPoint,
  SystemMetrics,
  CategoryFreshness,
  PolicyCategory
} from '@/types/policy';

export const policyCategories: PolicyCategoryInfo[] = [
  { id: 'womens', name: "Women's Policies", documentCount: 487, color: 'category-womens' },
  { id: 'education', name: 'Student & Education', documentCount: 623, color: 'category-education' },
  { id: 'healthcare', name: 'Healthcare', documentCount: 892, color: 'category-healthcare' },
  { id: 'transport', name: 'Traffic & Transport', documentCount: 534, color: 'category-transport' },
  { id: 'taxation', name: 'Taxation & Fiscal', documentCount: 711, color: 'category-taxation' },
];

export const topSources: SourceInfo[] = [
  { name: 'Department of Health', type: 'government', documentCount: 423, lastContributionDate: '2024-12-15' },
  { name: 'National Education Board', type: 'government', documentCount: 387, lastContributionDate: '2024-12-20' },
  { name: 'Policy Research Institute', type: 'research_institute', documentCount: 312, lastContributionDate: '2024-12-18' },
  { name: 'Transport Authority', type: 'government', documentCount: 298, lastContributionDate: '2024-12-12' },
  { name: 'Tax Policy Center', type: 'research_institute', documentCount: 256, lastContributionDate: '2024-12-22' },
  { name: 'World Health Organization', type: 'international_org', documentCount: 234, lastContributionDate: '2024-12-10' },
];

export const recentDocuments: PolicyDocument[] = [
  {
    id: 'doc-001',
    title: 'Healthcare Reform Act 2024: Implementation Guidelines',
    category: 'healthcare',
    source: 'Department of Health',
    sourceType: 'government',
    publishedAt: '2024-12-20',
    type: 'regulation',
    excerpt: 'Comprehensive guidelines for implementing the Healthcare Reform Act across all healthcare facilities...',
  },
  {
    id: 'doc-002',
    title: 'Student Loan Restructuring Policy Framework',
    category: 'education',
    source: 'National Education Board',
    sourceType: 'government',
    publishedAt: '2024-12-18',
    type: 'white_paper',
    excerpt: 'A new framework for restructuring student loan repayment schedules to reduce financial burden...',
  },
  {
    id: 'doc-003',
    title: 'Gender Pay Gap Analysis Report 2024',
    category: 'womens',
    source: 'Policy Research Institute',
    sourceType: 'research_institute',
    publishedAt: '2024-12-15',
    type: 'report',
    excerpt: 'Annual analysis of gender pay disparities across different sectors and recommendations...',
  },
  {
    id: 'doc-004',
    title: 'Electric Vehicle Infrastructure Tax Incentives',
    category: 'taxation',
    source: 'Tax Policy Center',
    sourceType: 'research_institute',
    publishedAt: '2024-12-14',
    type: 'statement',
    excerpt: 'Policy statement on tax incentives for businesses investing in EV charging infrastructure...',
  },
  {
    id: 'doc-005',
    title: 'Urban Public Transport Modernization Plan',
    category: 'transport',
    source: 'Transport Authority',
    sourceType: 'government',
    publishedAt: '2024-12-12',
    type: 'legislation',
    excerpt: 'Legislative proposal for modernizing urban public transport systems with smart technology...',
  },
  {
    id: 'doc-006',
    title: 'Mental Health Coverage Expansion Directive',
    category: 'healthcare',
    source: 'Department of Health',
    sourceType: 'government',
    publishedAt: '2024-12-10',
    type: 'regulation',
    excerpt: 'Directive expanding mental health coverage under national healthcare programs...',
  },
  {
    id: 'doc-007',
    title: 'Vocational Education Reform Proposal',
    category: 'education',
    source: 'National Education Board',
    sourceType: 'government',
    publishedAt: '2024-12-08',
    type: 'white_paper',
    excerpt: 'Proposal for reforming vocational education to better align with industry needs...',
  },
  {
    id: 'doc-008',
    title: 'Maternal Leave Policy Enhancement Study',
    category: 'womens',
    source: 'World Health Organization',
    sourceType: 'international_org',
    publishedAt: '2024-12-05',
    type: 'report',
    excerpt: 'Comparative study on maternal leave policies and their impact on workforce participation...',
  },
];

// Generate timeline data for the past 24 months
export const generateTimelineData = (category?: PolicyCategory): TimelineDataPoint[] => {
  const data: TimelineDataPoint[] = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const baseCount = Math.floor(Math.random() * 100) + 80;
    const variance = Math.floor(Math.random() * 40) - 20;
    
    data.push({
      date: date.toISOString().slice(0, 7),
      count: baseCount + variance,
      category: category,
    });
  }
  
  return data;
};

export const systemMetrics: SystemMetrics = {
  totalDocuments: 3847,
  totalChunks: 28421,
  uniqueSources: 63,
  lastUpdated: '2024-12-22T14:30:00Z',
  averageDocumentAge: '18 months',
  dateRange: {
    start: '2019-01-01',
    end: '2024-12-22',
  },
  averageQueryLatency: 340,
  queriesToday: 127,
  p95Latency: 580,
};

export const categoryFreshness: CategoryFreshness[] = [
  { category: 'healthcare', categoryName: 'Healthcare', lastDocumentDate: '2024-12-20', status: 'fresh' },
  { category: 'education', categoryName: 'Student & Education', lastDocumentDate: '2024-12-18', status: 'fresh' },
  { category: 'womens', categoryName: "Women's Policies", lastDocumentDate: '2024-12-15', status: 'fresh' },
  { category: 'taxation', categoryName: 'Taxation & Fiscal', lastDocumentDate: '2024-12-14', status: 'fresh' },
  { category: 'transport', categoryName: 'Traffic & Transport', lastDocumentDate: '2024-11-28', status: 'aging' },
];

// Generate ingestion activity for the past 30 days
export const generateIngestionData = (): TimelineDataPoint[] => {
  const data: TimelineDataPoint[] = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().slice(0, 10),
      count: Math.floor(Math.random() * 20) + 5,
    });
  }
  
  return data;
};

// Extended documents for Policy Explorer
export const allDocuments: PolicyDocument[] = [
  ...recentDocuments,
  {
    id: 'doc-009',
    title: 'Carbon Tax Implementation Framework',
    category: 'taxation',
    source: 'Tax Policy Center',
    sourceType: 'research_institute',
    publishedAt: '2024-12-01',
    type: 'white_paper',
    excerpt: 'Framework for implementing carbon taxation across industrial sectors...',
  },
  {
    id: 'doc-010',
    title: 'Highway Safety Standards Update',
    category: 'transport',
    source: 'Transport Authority',
    sourceType: 'government',
    publishedAt: '2024-11-28',
    type: 'regulation',
    excerpt: 'Updated safety standards for highway construction and maintenance...',
  },
  {
    id: 'doc-011',
    title: 'Workplace Harassment Prevention Guidelines',
    category: 'womens',
    source: 'Policy Research Institute',
    sourceType: 'research_institute',
    publishedAt: '2024-11-25',
    type: 'report',
    excerpt: 'Guidelines for preventing and addressing workplace harassment...',
  },
  {
    id: 'doc-012',
    title: 'Special Education Funding Analysis',
    category: 'education',
    source: 'National Education Board',
    sourceType: 'government',
    publishedAt: '2024-11-22',
    type: 'report',
    excerpt: 'Analysis of funding patterns and needs in special education programs...',
  },
  {
    id: 'doc-013',
    title: 'Telemedicine Regulatory Framework',
    category: 'healthcare',
    source: 'Department of Health',
    sourceType: 'government',
    publishedAt: '2024-11-20',
    type: 'regulation',
    excerpt: 'New regulatory framework for telemedicine services and providers...',
  },
  {
    id: 'doc-014',
    title: 'Small Business Tax Relief Act',
    category: 'taxation',
    source: 'Tax Policy Center',
    sourceType: 'research_institute',
    publishedAt: '2024-11-18',
    type: 'legislation',
    excerpt: 'Proposed tax relief measures for small businesses affected by economic changes...',
  },
  {
    id: 'doc-015',
    title: 'Autonomous Vehicle Testing Protocols',
    category: 'transport',
    source: 'Transport Authority',
    sourceType: 'government',
    publishedAt: '2024-11-15',
    type: 'regulation',
    excerpt: 'Testing protocols and safety requirements for autonomous vehicles...',
  },
  {
    id: 'doc-016',
    title: 'Childcare Accessibility Initiative',
    category: 'womens',
    source: 'World Health Organization',
    sourceType: 'international_org',
    publishedAt: '2024-11-12',
    type: 'statement',
    excerpt: 'Initiative to improve childcare accessibility for working parents...',
  },
  {
    id: 'doc-017',
    title: 'Digital Learning Infrastructure Plan',
    category: 'education',
    source: 'National Education Board',
    sourceType: 'government',
    publishedAt: '2024-11-10',
    type: 'white_paper',
    excerpt: 'Plan for developing digital learning infrastructure in schools...',
  },
  {
    id: 'doc-018',
    title: 'Prescription Drug Pricing Reform',
    category: 'healthcare',
    source: 'Department of Health',
    sourceType: 'government',
    publishedAt: '2024-11-08',
    type: 'legislation',
    excerpt: 'Legislative proposal for reforming prescription drug pricing...',
  },
];
