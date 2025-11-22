/**
 * Order Conflict Resolution Interface
 * Side-by-side comparison with field-level diffs and selective reimport
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Check, X, Info } from 'lucide-react';
import { toast } from 'sonner';

interface ConflictField {
  field: string;
  localValue: any;
  woocommerceValue: any;
  lastModifiedBy?: number;
  lastModifiedAt?: Date;
}

interface OrderConflict {
  orderId: number;
  woocommerceId: number;
  orderNumber: string;
  conflictFields: ConflictField[];
  localData: any;
  woocommerceData: any;
}

interface ConflictResolutionProps {
  conflicts: OrderConflict[];
  onResolve: (orderId: number, resolution: 'keep_local' | 'use_woocommerce' | 'selective', selectedFields?: Record<string, 'local' | 'woocommerce'>) => void;
  onClose: () => void;
}

export default function ConflictResolution({ conflicts, onResolve, onClose }: ConflictResolutionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolution, setResolution] = useState<'keep_local' | 'use_woocommerce' | 'selective'>('selective');
  const [selectedFields, setSelectedFields] = useState<Record<string, 'local' | 'woocommerce'>>({});

  const currentConflict = conflicts[currentIndex];

  if (!currentConflict) {
    return null;
  }

  const handleFieldSelection = (field: string, source: 'local' | 'woocommerce') => {
    setSelectedFields((prev) => ({
      ...prev,
      [field]: source,
    }));
  };

  const handleResolve = () => {
    onResolve(currentConflict.orderId, resolution, selectedFields);
    
    if (currentIndex < conflicts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedFields({});
    } else {
      toast.success('All conflicts resolved!');
      onClose();
    }
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      status: 'Order Status',
      totalAmount: 'Total Amount',
      shippingCost: 'Shipping Cost',
      taxAmount: 'Tax Amount',
      orderItems: 'Order Items',
      billingAddress: 'Billing Address',
      shippingAddress: 'Shipping Address',
    };
    return labels[field] || field;
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Order Conflict Detected
              </CardTitle>
              <CardDescription>
                Order #{currentConflict.orderNumber} has been modified locally and in WooCommerce
              </CardDescription>
            </div>
            <Badge variant="outline">
              {currentIndex + 1} of {conflicts.length}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Resolution Strategy */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Resolution Strategy</Label>
            <RadioGroup value={resolution} onValueChange={(v: any) => setResolution(v)}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="keep_local" id="keep_local" />
                <Label htmlFor="keep_local" className="flex-1 cursor-pointer">
                  <div className="font-medium">Keep Local Changes</div>
                  <div className="text-sm text-muted-foreground">
                    Preserve all manual edits made in the system
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="use_woocommerce" id="use_woocommerce" />
                <Label htmlFor="use_woocommerce" className="flex-1 cursor-pointer">
                  <div className="font-medium">Use WooCommerce Data</div>
                  <div className="text-sm text-muted-foreground">
                    Overwrite with latest data from WooCommerce
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="selective" id="selective" />
                <Label htmlFor="selective" className="flex-1 cursor-pointer">
                  <div className="font-medium">Selective Import</div>
                  <div className="text-sm text-muted-foreground">
                    Choose which fields to update on a per-field basis
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Field-by-Field Comparison */}
          {resolution === 'selective' && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">Field Comparison</Label>
              
              {currentConflict.conflictFields.map((conflict) => (
                <Card key={conflict.field} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {getFieldLabel(conflict.field)}
                      {conflict.lastModifiedBy && (
                        <Badge variant="secondary" className="text-xs">
                          Modified by User #{conflict.lastModifiedBy}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Local Value */}
                      <div
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedFields[conflict.field] === 'local'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleFieldSelection(conflict.field, 'local')}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-semibold">Local (Current)</Label>
                          {selectedFields[conflict.field] === 'local' && (
                            <Check className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <pre className="text-sm whitespace-pre-wrap break-words">
                          {formatValue(conflict.localValue)}
                        </pre>
                        {conflict.lastModifiedAt && (
                          <div className="text-xs text-muted-foreground mt-2">
                            Last modified: {new Date(conflict.lastModifiedAt).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* WooCommerce Value */}
                      <div
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedFields[conflict.field] === 'woocommerce'
                            ? 'border-green-500 bg-green-50 dark:bg-green-950'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleFieldSelection(conflict.field, 'woocommerce')}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-semibold">WooCommerce (Latest)</Label>
                          {selectedFields[conflict.field] === 'woocommerce' && (
                            <Check className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <pre className="text-sm whitespace-pre-wrap break-words">
                          {formatValue(conflict.woocommerceValue)}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium mb-1">What happens next?</div>
              <div className="text-muted-foreground">
                Your choice will be applied to this order and recorded in the order history.
                You can always view the full changelog to see all modifications.
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel Import
            </Button>

            <div className="flex gap-2">
              {currentIndex > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentIndex(currentIndex - 1);
                    setSelectedFields({});
                  }}
                >
                  Previous
                </Button>
              )}
              <Button onClick={handleResolve}>
                <Check className="w-4 h-4 mr-2" />
                {currentIndex < conflicts.length - 1 ? 'Next Conflict' : 'Resolve & Complete'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
