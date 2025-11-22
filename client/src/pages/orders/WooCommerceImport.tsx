/**
 * WooCommerce Import Dashboard
 * Beautiful UI with dual progress bars, live data display, and cool effects
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface ImportProgress {
  totalOrders: number;
  processedOrders: number;
  currentBatch: number;
  totalBatches: number;
  batchProgress: number;
  conflicts: number;
  errors: number;
  created: number;
  updated: number;
  skipped: number;
  currentOrder?: {
    id: number;
    number: string;
    customer: string;
    total: string;
    status: string;
  };
}

export default function WooCommerceImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [dateFrom, setDateFrom] = useState('2025-01-01');
  const [dateTo, setDateTo] = useState('');

  const importMutation = trpc.woocommerceImport.import.useMutation({
    onSuccess: (result) => {
      setIsImporting(false);
      toast.success(`Import complete! Created: ${result.created}, Updated: ${result.updated}`);
      
      if (result.conflicts.length > 0) {
        toast.warning(`${result.conflicts.length} conflicts require your attention`);
      }
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} orders failed to import`);
      }
    },
    onError: (error) => {
      setIsImporting(false);
      toast.error(`Import failed: ${error.message}`);
    },
  });

  const handleImport = async (type: 'all' | 'range' | 'year') => {
    setIsImporting(true);
    setProgress({
      totalOrders: 0,
      processedOrders: 0,
      currentBatch: 0,
      totalBatches: 0,
      batchProgress: 0,
      conflicts: 0,
      errors: 0,
      created: 0,
      updated: 0,
      skipped: 0,
    });

    const options: any = {};

    if (type === 'range' && dateFrom) {
      options.dateFrom = dateFrom;
      if (dateTo) {
        options.dateTo = dateTo;
      }
    } else if (type === 'year') {
      options.dateFrom = dateFrom;
      options.dateTo = dateFrom.replace('2025', '2026');
    }

    // Simulate progress updates (replace with actual subscription when available)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (!prev) return prev;
        const newProcessed = Math.min(prev.processedOrders + 1, prev.totalOrders);
        return {
          ...prev,
          processedOrders: newProcessed,
          batchProgress: (newProcessed % 50) + 1,
          currentBatch: Math.floor(newProcessed / 50) + 1,
        };
      });
    }, 100);

    try {
      await importMutation.mutateAsync(options);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const overallProgress = progress
    ? (progress.processedOrders / Math.max(progress.totalOrders, 1)) * 100
    : 0;

  const batchProgress = progress
    ? (progress.batchProgress / 50) * 100
    : 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WooCommerce Import</h1>
          <p className="text-muted-foreground mt-1">
            Import orders from WooCommerce with smart deduplication and conflict resolution
          </p>
        </div>
      </div>

      {/* Import Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Import Orders</CardTitle>
          <CardDescription>
            Choose import scope and start the import process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                disabled={isImporting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date (Optional)</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                disabled={isImporting}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => handleImport('year')}
              disabled={isImporting || !dateFrom}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Import 2025 Orders
            </Button>
            <Button
              onClick={() => handleImport('range')}
              disabled={isImporting || !dateFrom}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Import Date Range
            </Button>
            <Button
              onClick={() => handleImport('all')}
              disabled={isImporting}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Import All Orders
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Display */}
      {isImporting && progress && (
        <div className="space-y-4">
          {/* Overall Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Overall Progress</span>
                <Badge variant="outline">
                  {progress.processedOrders} / {progress.totalOrders} orders
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Batch {progress.currentBatch} of {progress.totalBatches}</span>
                  <span>{Math.round(overallProgress)}%</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{progress.created}</div>
                    <div className="text-xs text-muted-foreground">Created</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{progress.updated}</div>
                    <div className="text-xs text-muted-foreground">Updated</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-2xl font-bold">{progress.skipped}</div>
                    <div className="text-xs text-muted-foreground">Skipped</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold">{progress.conflicts}</div>
                    <div className="text-xs text-muted-foreground">Conflicts</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold">{progress.errors}</div>
                    <div className="text-xs text-muted-foreground">Errors</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Batch Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Batch</span>
                <Badge variant="outline">
                  {progress.batchProgress} / 50 orders
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing batch {progress.currentBatch}</span>
                  <span>{Math.round(batchProgress)}%</span>
                </div>
                <Progress value={batchProgress} className="h-2" />
              </div>

              {/* Current Order Display */}
              {progress.currentOrder && (
                <div className="mt-4 p-4 bg-muted rounded-lg animate-pulse">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Order #{progress.currentOrder.number}</div>
                      <div className="text-sm text-muted-foreground">
                        {progress.currentOrder.customer}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${progress.currentOrder.total}</div>
                      <Badge variant="secondary">{progress.currentOrder.status}</Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Imports</CardTitle>
          <CardDescription>View past import operations and their results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No import history yet. Start your first import above.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
