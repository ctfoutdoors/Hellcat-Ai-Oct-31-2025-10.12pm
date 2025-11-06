/**
 * Cache Service
 * 
 * In-memory caching with TTL support for performance optimization
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 300000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiry });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now > entry.expiry) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`[Cache] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`[Cache] Invalidated ${keysToDelete.length} entries matching pattern: ${pattern}`);
    }
  }
}

// Export singleton instance
export const cache = new CacheService();

/**
 * Cache key generators
 */
export const cacheKeys = {
  cases: {
    list: () => 'cases:list',
    detail: (id: number) => `cases:detail:${id}`,
    byCarrier: (carrier: string) => `cases:carrier:${carrier}`,
    byStatus: (status: string) => `cases:status:${status}`,
  },
  dashboard: {
    metrics: () => 'dashboard:metrics',
    recentActivity: () => 'dashboard:activity',
  },
  reports: {
    summary: (startDate?: Date, endDate?: Date) => 
      `reports:summary:${startDate?.toISOString() || 'all'}:${endDate?.toISOString() || 'all'}`,
    carrier: (carrier: string) => `reports:carrier:${carrier}`,
  },
  shipstation: {
    orders: (page: number) => `shipstation:orders:${page}`,
    shipments: (page: number) => `shipstation:shipments:${page}`,
  },
};

/**
 * Cache invalidation helpers
 */
export const invalidateCache = {
  cases: () => {
    cache.invalidatePattern('^cases:');
    cache.delete(cacheKeys.dashboard.metrics());
    cache.delete(cacheKeys.dashboard.recentActivity());
  },
  
  case: (id: number) => {
    cache.delete(cacheKeys.cases.detail(id));
    cache.delete(cacheKeys.cases.list());
    cache.delete(cacheKeys.dashboard.metrics());
  },
  
  dashboard: () => {
    cache.delete(cacheKeys.dashboard.metrics());
    cache.delete(cacheKeys.dashboard.recentActivity());
  },
  
  reports: () => {
    cache.invalidatePattern('^reports:');
  },
  
  all: () => {
    cache.clear();
  },
};

/**
 * Decorator for caching function results
 */
export function cacheable(key: string, ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${key}:${JSON.stringify(args)}`;
      return cache.getOrSet(cacheKey, () => originalMethod.apply(this, args), ttl);
    };
    
    return descriptor;
  };
}
