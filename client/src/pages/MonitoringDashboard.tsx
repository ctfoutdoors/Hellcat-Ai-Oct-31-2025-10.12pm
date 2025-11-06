import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertCircle, CheckCircle, Clock, Database, Server, Zap } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export default function MonitoringDashboard() {
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // Fetch monitoring data
  const { data: systemMetrics, refetch: refetchMetrics } = trpc.monitoring.getSystemMetrics.useQuery(undefined, {
    refetchInterval: refreshInterval,
  });

  const { data: circuitBreakers } = trpc.monitoring.getCircuitBreakerStatus.useQuery(undefined, {
    refetchInterval: refreshInterval,
  });

  const { data: cacheStats } = trpc.monitoring.getCacheStats.useQuery(undefined, {
    refetchInterval: refreshInterval,
  });

  const { data: performanceMetrics } = trpc.monitoring.getPerformanceMetrics.useQuery(undefined, {
    refetchInterval: refreshInterval,
  });

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0a0e1a] p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">System Monitoring</h1>
          <p className="text-gray-400">Real-time performance metrics and health status</p>
        </div>

        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#1a1f2e]/80 border-[#2a3441] backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">System Status</CardTitle>
              <Server className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-2xl font-bold text-white">Healthy</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">All systems operational</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f2e]/80 border-[#2a3441] backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Uptime</CardTitle>
              <Clock className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {systemMetrics?.uptime || '0h 0m'}
              </div>
              <p className="text-xs text-gray-400 mt-1">Since last restart</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f2e]/80 border-[#2a3441] backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Memory Usage</CardTitle>
              <Database className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {systemMetrics?.memoryUsage || '0 MB'}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {systemMetrics?.memoryPercentage || 0}% of available
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1f2e]/80 border-[#2a3441] backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Requests/min</CardTitle>
              <Activity className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {systemMetrics?.requestsPerMinute || 0}
              </div>
              <p className="text-xs text-gray-400 mt-1">Average response: {systemMetrics?.avgResponseTime || 0}ms</p>
            </CardContent>
          </Card>
        </div>

        {/* Circuit Breakers */}
        <Card className="bg-[#1a1f2e]/80 border-[#2a3441] backdrop-blur mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Circuit Breakers
            </CardTitle>
            <CardDescription className="text-gray-400">
              Automatic failure protection for external services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {circuitBreakers && Object.entries(circuitBreakers).map(([service, status]: [string, any]) => (
                <div
                  key={service}
                  className="p-4 rounded-lg bg-[#0f1419] border border-[#2a3441]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium capitalize">{service}</span>
                    <Badge
                      variant={
                        status.state === 'CLOSED'
                          ? 'default'
                          : status.state === 'OPEN'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className={
                        status.state === 'CLOSED'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : status.state === 'OPEN'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }
                    >
                      {status.state}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Failures:</span>
                      <span className="text-white">{status.failures}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Success Rate:</span>
                      <span className="text-white">{status.successRate}%</span>
                    </div>
                    {status.nextRetry && (
                      <div className="flex justify-between text-gray-400">
                        <span>Next Retry:</span>
                        <span className="text-white">{status.nextRetry}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cache Statistics */}
        <Card className="bg-[#1a1f2e]/80 border-[#2a3441] backdrop-blur mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-400" />
              Cache Performance
            </CardTitle>
            <CardDescription className="text-gray-400">
              In-memory cache statistics and hit rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-[#0f1419] border border-[#2a3441]">
                <div className="text-sm text-gray-400 mb-1">Cache Size</div>
                <div className="text-2xl font-bold text-white">{cacheStats?.size || 0}</div>
                <div className="text-xs text-gray-500 mt-1">entries</div>
              </div>
              <div className="p-4 rounded-lg bg-[#0f1419] border border-[#2a3441]">
                <div className="text-sm text-gray-400 mb-1">Hit Rate</div>
                <div className="text-2xl font-bold text-green-400">{cacheStats?.hitRate || 0}%</div>
                <div className="text-xs text-gray-500 mt-1">cache efficiency</div>
              </div>
              <div className="p-4 rounded-lg bg-[#0f1419] border border-[#2a3441]">
                <div className="text-sm text-gray-400 mb-1">Total Hits</div>
                <div className="text-2xl font-bold text-white">{cacheStats?.hits || 0}</div>
                <div className="text-xs text-gray-500 mt-1">successful lookups</div>
              </div>
              <div className="p-4 rounded-lg bg-[#0f1419] border border-[#2a3441]">
                <div className="text-sm text-gray-400 mb-1">Total Misses</div>
                <div className="text-2xl font-bold text-white">{cacheStats?.misses || 0}</div>
                <div className="text-xs text-gray-500 mt-1">cache misses</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="bg-[#1a1f2e]/80 border-[#2a3441] backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-400" />
              Performance Metrics
            </CardTitle>
            <CardDescription className="text-gray-400">
              Database query performance and optimization stats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceMetrics?.slowQueries && performanceMetrics.slowQueries.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Slow Queries ({'>'}1s)</h3>
                  <div className="space-y-2">
                    {performanceMetrics.slowQueries.map((query: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#0f1419] border border-amber-500/30"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <code className="text-xs text-gray-300 flex-1">{query.query}</code>
                          <Badge variant="secondary" className="ml-2 bg-amber-500/20 text-amber-400">
                            {query.time}ms
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          Executed {query.count} times | Avg: {query.avgTime}ms
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-400" />
                  <p>No slow queries detected</p>
                  <p className="text-sm">All queries are performing optimally</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 rounded-lg bg-[#0f1419] border border-[#2a3441]">
                  <div className="text-sm text-gray-400 mb-1">Avg Query Time</div>
                  <div className="text-2xl font-bold text-white">
                    {performanceMetrics?.avgQueryTime || 0}ms
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-[#0f1419] border border-[#2a3441]">
                  <div className="text-sm text-gray-400 mb-1">Active Connections</div>
                  <div className="text-2xl font-bold text-white">
                    {performanceMetrics?.activeConnections || 0}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-[#0f1419] border border-[#2a3441]">
                  <div className="text-sm text-gray-400 mb-1">Index Usage</div>
                  <div className="text-2xl font-bold text-green-400">
                    {performanceMetrics?.indexUsage || 0}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
