/**
 * Import Summary Widget
 * Displays latest WooCommerce import batch statistics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { formatDistanceToNow } from 'date-fns';

export default function ImportSummaryWidget() {
  const { data: summary, isLoading } = trpc.wooImport.getLastImportSummary.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Latest Import
          </CardTitle>
          <CardDescription>Loading import statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Latest Import
          </CardTitle>
          <CardDescription>No import history available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Run your first WooCommerce import to see statistics here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const successRate = summary.totalProcessed > 0
    ? ((summary.created + summary.updated) / summary.totalProcessed) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Latest Import
            </CardTitle>
            <CardDescription>
              {summary.completedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(summary.completedAt), { addSuffix: true })}
                </span>
              )}
            </CardDescription>
          </div>
          <Badge variant={summary.conflicts > 0 ? 'destructive' : 'default'}>
            {summary.totalProcessed} orders
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Success Rate Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Success Rate</span>
            <span className="font-medium">{successRate.toFixed(1)}%</span>
          </div>
          <Progress value={successRate} className="h-2" />
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Created */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <div>
              <div className="text-xs text-muted-foreground">Created</div>
              <div className="text-lg font-semibold text-green-700 dark:text-green-300">
                {summary.created}
              </div>
            </div>
          </div>

          {/* Updated */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="text-xs text-muted-foreground">Updated</div>
              <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                {summary.updated}
              </div>
            </div>
          </div>

          {/* Skipped */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <div>
              <div className="text-xs text-muted-foreground">Skipped</div>
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {summary.skipped}
              </div>
            </div>
          </div>

          {/* Conflicts */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
            <XCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <div>
              <div className="text-xs text-muted-foreground">Conflicts</div>
              <div className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">
                {summary.conflicts}
              </div>
            </div>
          </div>
        </div>

        {/* Duration */}
        {summary.duration && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Completed in {(summary.duration / 1000).toFixed(1)}s
          </div>
        )}
      </CardContent>
    </Card>
  );
}
