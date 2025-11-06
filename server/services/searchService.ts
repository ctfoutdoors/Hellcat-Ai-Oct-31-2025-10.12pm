/**
 * Search and Filter Service
 * 
 * Advanced search capabilities with filters, sorting, and pagination
 */

interface SearchFilters {
  query?: string;
  carrier?: string[];
  status?: string[];
  priority?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  assignedTo?: string;
  tags?: string[];
}

interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

interface PaginationOptions {
  page: number;
  pageSize: number;
}

interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Apply text search filter
 */
function applyTextSearch<T>(items: T[], query: string, fields: string[]): T[] {
  if (!query) return items;
  
  const lowerQuery = query.toLowerCase();
  
  return items.filter(item => {
    return fields.some(field => {
      const value = getNestedValue(item, field);
      return value && String(value).toLowerCase().includes(lowerQuery);
    });
  });
}

/**
 * Get nested object value by path
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Apply filters to items
 */
function applyFilters<T>(items: T[], filters: SearchFilters): T[] {
  let filtered = items;
  
  // Carrier filter
  if (filters.carrier && filters.carrier.length > 0) {
    filtered = filtered.filter((item: any) => 
      filters.carrier!.includes(item.carrier)
    );
  }
  
  // Status filter
  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter((item: any) => 
      filters.status!.includes(item.status)
    );
  }
  
  // Priority filter
  if (filters.priority && filters.priority.length > 0) {
    filtered = filtered.filter((item: any) => 
      filters.priority!.includes(item.priority)
    );
  }
  
  // Date range filter
  if (filters.dateFrom) {
    filtered = filtered.filter((item: any) => 
      new Date(item.createdAt) >= filters.dateFrom!
    );
  }
  
  if (filters.dateTo) {
    filtered = filtered.filter((item: any) => 
      new Date(item.createdAt) <= filters.dateTo!
    );
  }
  
  // Amount range filter
  if (filters.amountMin !== undefined) {
    filtered = filtered.filter((item: any) => 
      (item.claimedAmount || 0) >= filters.amountMin!
    );
  }
  
  if (filters.amountMax !== undefined) {
    filtered = filtered.filter((item: any) => 
      (item.claimedAmount || 0) <= filters.amountMax!
    );
  }
  
  // Assigned to filter
  if (filters.assignedTo) {
    filtered = filtered.filter((item: any) => 
      item.assignedTo === filters.assignedTo
    );
  }
  
  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter((item: any) => {
      const itemTags = item.tags || [];
      return filters.tags!.some(tag => itemTags.includes(tag));
    });
  }
  
  return filtered;
}

/**
 * Apply sorting to items
 */
function applySort<T>(items: T[], sort: SortOptions): T[] {
  return [...items].sort((a, b) => {
    const aValue = getNestedValue(a, sort.field);
    const bValue = getNestedValue(b, sort.field);
    
    if (aValue === bValue) return 0;
    
    const comparison = aValue < bValue ? -1 : 1;
    return sort.direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Apply pagination to items
 */
function applyPagination<T>(items: T[], pagination: PaginationOptions): T[] {
  const start = (pagination.page - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return items.slice(start, end);
}

/**
 * Search and filter cases
 */
export function searchCases<T>(
  cases: T[],
  filters: SearchFilters = {},
  sort: SortOptions = { field: 'createdAt', direction: 'desc' },
  pagination: PaginationOptions = { page: 1, pageSize: 20 }
): SearchResult<T> {
  let results = cases;
  
  // Apply text search
  if (filters.query) {
    results = applyTextSearch(results, filters.query, [
      'caseNumber',
      'trackingId',
      'customerName',
      'notes',
    ]);
  }
  
  // Apply filters
  results = applyFilters(results, filters);
  
  // Apply sorting
  results = applySort(results, sort);
  
  // Get total before pagination
  const total = results.length;
  
  // Apply pagination
  const items = applyPagination(results, pagination);
  
  return {
    items,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.ceil(total / pagination.pageSize),
  };
}

/**
 * Build search query for database
 */
export function buildSearchQuery(filters: SearchFilters): any {
  const conditions: any[] = [];
  
  if (filters.query) {
    conditions.push({
      OR: [
        { caseNumber: { contains: filters.query } },
        { trackingId: { contains: filters.query } },
        { customerName: { contains: filters.query } },
        { notes: { contains: filters.query } },
      ],
    });
  }
  
  if (filters.carrier && filters.carrier.length > 0) {
    conditions.push({ carrier: { in: filters.carrier } });
  }
  
  if (filters.status && filters.status.length > 0) {
    conditions.push({ status: { in: filters.status } });
  }
  
  if (filters.priority && filters.priority.length > 0) {
    conditions.push({ priority: { in: filters.priority } });
  }
  
  if (filters.dateFrom) {
    conditions.push({ createdAt: { gte: filters.dateFrom } });
  }
  
  if (filters.dateTo) {
    conditions.push({ createdAt: { lte: filters.dateTo } });
  }
  
  if (filters.amountMin !== undefined) {
    conditions.push({ claimedAmount: { gte: filters.amountMin } });
  }
  
  if (filters.amountMax !== undefined) {
    conditions.push({ claimedAmount: { lte: filters.amountMax } });
  }
  
  if (filters.assignedTo) {
    conditions.push({ assignedTo: filters.assignedTo });
  }
  
  return conditions.length > 0 ? { AND: conditions } : {};
}

/**
 * Get filter suggestions based on existing data
 */
export function getFilterSuggestions<T>(items: T[]): {
  carriers: string[];
  statuses: string[];
  priorities: string[];
  assignees: string[];
  tags: string[];
} {
  const carriers = new Set<string>();
  const statuses = new Set<string>();
  const priorities = new Set<string>();
  const assignees = new Set<string>();
  const tags = new Set<string>();
  
  items.forEach((item: any) => {
    if (item.carrier) carriers.add(item.carrier);
    if (item.status) statuses.add(item.status);
    if (item.priority) priorities.add(item.priority);
    if (item.assignedTo) assignees.add(item.assignedTo);
    if (item.tags) item.tags.forEach((tag: string) => tags.add(tag));
  });
  
  return {
    carriers: Array.from(carriers).sort(),
    statuses: Array.from(statuses).sort(),
    priorities: Array.from(priorities).sort(),
    assignees: Array.from(assignees).sort(),
    tags: Array.from(tags).sort(),
  };
}

/**
 * Fuzzy search implementation
 */
export function fuzzySearch(query: string, text: string): number {
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes(lowerQuery)) {
    return 1; // Exact match
  }
  
  // Calculate Levenshtein distance
  const matrix: number[][] = [];
  
  for (let i = 0; i <= lowerText.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= lowerQuery.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= lowerText.length; i++) {
    for (let j = 1; j <= lowerQuery.length; j++) {
      if (lowerText[i - 1] === lowerQuery[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const distance = matrix[lowerText.length][lowerQuery.length];
  const maxLength = Math.max(lowerQuery.length, lowerText.length);
  
  return 1 - (distance / maxLength);
}
