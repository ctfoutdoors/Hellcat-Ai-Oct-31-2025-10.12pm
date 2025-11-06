import { protectedProcedure, router } from '../_core/trpc';
import { ResilienceService } from '../services/resilienceService';
import { SavedSearchService } from '../services/savedSearchService';
import { PerformanceOptimizationService } from '../services/performanceOptimization';

export const monitoringRouter = router({
  /**
   * Get system metrics (uptime, memory, requests)
   */
  getSystemMetrics: protectedProcedure.query(async () => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    return {
      uptime: `${hours}h ${minutes}m`,
      memoryUsage: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      memoryPercentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      requestsPerMinute: 0, // TODO: Implement request counter
      avgResponseTime: 0, // TODO: Implement response time tracking
    };
  }),

  /**
   * Get circuit breaker status for all services
   */
  getCircuitBreakerStatus: protectedProcedure.query(async () => {
    return ResilienceService.getCircuitBreakerStatus();
  }),

  /**
   * Get cache statistics
   */
  getCacheStats: protectedProcedure.query(async () => {
    return SavedSearchService.getCacheStats();
  }),

  /**
   * Get performance metrics
   */
  getPerformanceMetrics: protectedProcedure.query(async () => {
    return await PerformanceOptimizationService.getPerformanceMetrics();
  }),

  /**
   * Reset circuit breaker for a service
   */
  resetCircuitBreaker: protectedProcedure
    .input(z => z.object({ service: z.string() }))
    .mutation(async ({ input }) => {
      ResilienceService.resetCircuitBreaker(input.service);
      return { success: true };
    }),

  /**
   * Clear cache
   */
  clearCache: protectedProcedure.mutation(async () => {
    SavedSearchService.clearCache();
    return { success: true };
  }),
});
