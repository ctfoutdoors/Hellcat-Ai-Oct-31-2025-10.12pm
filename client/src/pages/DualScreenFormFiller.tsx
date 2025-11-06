import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Copy, Check, ExternalLink } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

/**
 * Dual-Screen Form Filler
 * 
 * Split-screen interface for filling carrier dispute forms
 * Left: Case data and field mapping
 * Right: Carrier form preview/instructions
 */

export default function DualScreenFormFiller() {
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<string>('');
  const [copiedFields, setCopiedFields] = useState<Set<string>>(new Set());

  // Fetch cases for selection
  const { data: cases } = trpc.cases.list.useQuery({ 
    limit: 100,
    status: 'DRAFT,SUBMITTED,IN_REVIEW' 
  });

  // Fetch selected case details
  const { data: caseData } = trpc.cases.getById.useQuery(
    { id: selectedCaseId! },
    { enabled: !!selectedCaseId }
  );

  // Field mapping configuration
  const fieldMappings = {
    fedex: [
      { label: 'Tracking Number', field: 'trackingId', required: true },
      { label: 'Invoice Number', field: 'invoiceNumber', required: true },
      { label: 'Dispute Amount', field: 'disputeAmount', required: true },
      { label: 'Ship Date', field: 'shipDate', required: true },
      { label: 'Shipper Name', field: 'shipperName', required: true },
      { label: 'Shipper Address', field: 'shipperAddress', required: false },
      { label: 'Recipient Name', field: 'recipientName', required: true },
      { label: 'Recipient Address', field: 'recipientAddress', required: false },
      { label: 'Package Weight', field: 'weight', required: true },
      { label: 'Package Dimensions', field: 'dimensions', required: true },
      { label: 'Dispute Reason', field: 'reason', required: true },
    ],
    ups: [
      { label: 'Tracking Number', field: 'trackingId', required: true },
      { label: 'Reference Number', field: 'referenceNumber', required: false },
      { label: 'Charge Amount', field: 'disputeAmount', required: true },
      { label: 'Ship Date', field: 'shipDate', required: true },
      { label: 'Service Type', field: 'serviceType', required: true },
      { label: 'Shipper Account', field: 'shipperAccount', required: true },
      { label: 'Package Weight', field: 'weight', required: true },
      { label: 'Dimensions (LxWxH)', field: 'dimensions', required: true },
      { label: 'Reason Code', field: 'reasonCode', required: true },
    ],
    usps: [
      { label: 'Tracking Number', field: 'trackingId', required: true },
      { label: 'Mailing Date', field: 'shipDate', required: true },
      { label: 'Dispute Amount', field: 'disputeAmount', required: true },
      { label: 'Service Class', field: 'serviceClass', required: true },
      { label: 'Weight (lbs)', field: 'weight', required: true },
      { label: 'Mailer Name', field: 'shipperName', required: true },
      { label: 'Destination ZIP', field: 'recipientZip', required: true },
      { label: 'Claim Type', field: 'claimType', required: true },
    ],
  };

  const currentMapping = selectedCarrier ? fieldMappings[selectedCarrier as keyof typeof fieldMappings] : [];

  const copyToClipboard = async (value: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedFields(prev => new Set(prev).add(fieldName));
      toast.success(`Copied ${fieldName} to clipboard`);
      setTimeout(() => {
        setCopiedFields(prev => {
          const next = new Set(prev);
          next.delete(fieldName);
          return next;
        });
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getFieldValue = (field: string): string => {
    if (!caseData) return '';
    
    const mapping: Record<string, any> = {
      trackingId: caseData.trackingId,
      invoiceNumber: caseData.invoiceNumber,
      disputeAmount: `$${caseData.disputeAmount?.toFixed(2)}`,
      shipDate: caseData.shipDate ? new Date(caseData.shipDate).toLocaleDateString() : '',
      shipperName: caseData.shipperName,
      shipperAddress: `${caseData.shipperAddress || ''} ${caseData.shipperCity || ''} ${caseData.shipperState || ''} ${caseData.shipperZip || ''}`.trim(),
      recipientName: caseData.recipientName,
      recipientAddress: `${caseData.recipientAddress || ''} ${caseData.recipientCity || ''} ${caseData.recipientState || ''} ${caseData.recipientZip || ''}`.trim(),
      recipientZip: caseData.recipientZip,
      weight: caseData.weight ? `${caseData.weight} lbs` : '',
      dimensions: caseData.dimensions || '',
      reason: caseData.reason,
      reasonCode: caseData.reasonCode,
      serviceType: caseData.serviceType,
      serviceClass: caseData.serviceClass,
      referenceNumber: caseData.referenceNumber,
      shipperAccount: caseData.shipperAccount,
      claimType: 'Dimensional Weight Adjustment',
    };

    return mapping[field] || '';
  };

  const carrierFormUrls = {
    fedex: 'https://www.fedex.com/en-us/customer-support/claims.html',
    ups: 'https://www.ups.com/us/en/support/file-a-claim.page',
    usps: 'https://www.usps.com/help/claims.htm',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dual-Screen Form Filler</h1>
          <p className="text-muted-foreground mt-2">
            Copy case data and paste into carrier dispute forms
          </p>
        </div>

        {/* Case & Carrier Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Case & Carrier</CardTitle>
            <CardDescription>Choose a case and carrier to begin filling the form</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Case</Label>
                <Select value={selectedCaseId?.toString()} onValueChange={(v) => setSelectedCaseId(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a case..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cases?.cases.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.caseNumber} - {c.carrier} - ${c.disputeAmount}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Carrier Form</Label>
                <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select carrier..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fedex">FedEx</SelectItem>
                    <SelectItem value="ups">UPS</SelectItem>
                    <SelectItem value="usps">USPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedCarrier && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(carrierFormUrls[selectedCarrier as keyof typeof carrierFormUrls], '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open {selectedCarrier.toUpperCase()} Dispute Form
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Split View */}
        {selectedCaseId && selectedCarrier && (
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Field Mapping */}
            <Card>
              <CardHeader>
                <CardTitle>Case Data</CardTitle>
                <CardDescription>Click to copy each field to clipboard</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentMapping.map((mapping) => {
                    const value = getFieldValue(mapping.field);
                    const isCopied = copiedFields.has(mapping.field);
                    
                    return (
                      <div key={mapping.field} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium">{mapping.label}</Label>
                            {mapping.required && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1 font-mono">
                            {value || <span className="italic">No data</span>}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(value, mapping.label)}
                          disabled={!value}
                        >
                          {isCopied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Right: Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Form Filling Instructions</CardTitle>
                <CardDescription>Step-by-step guide for {selectedCarrier.toUpperCase()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Open the carrier form</p>
                      <p className="text-sm text-muted-foreground">Click the button above to open the dispute form in a new tab</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Copy each field</p>
                      <p className="text-sm text-muted-foreground">Click the copy button next to each field to copy its value</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Paste into carrier form</p>
                      <p className="text-sm text-muted-foreground">Paste the copied value into the corresponding field on the carrier's website</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Fill required fields</p>
                      <p className="text-sm text-muted-foreground">Make sure all fields marked as "Required" are filled in the carrier form</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      5
                    </div>
                    <div>
                      <p className="font-medium">Submit the form</p>
                      <p className="text-sm text-muted-foreground">Review all information and submit the dispute to the carrier</p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-400">💡 Pro Tip</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Keep this window open while filling the carrier form. You can quickly switch between tabs to copy additional fields as needed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
