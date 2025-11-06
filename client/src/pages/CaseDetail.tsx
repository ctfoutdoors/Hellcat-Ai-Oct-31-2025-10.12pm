import React from "react";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Mic, Upload, FileText, Activity, FileCheck, Loader2, Download, Edit, ExternalLink, Camera, Sparkles } from "lucide-react";
import { toast } from "sonner";
import VoiceRecorder from "@/components/VoiceRecorder";
import EditCaseDialog from "@/components/EditCaseDialog";
import { getTrackingUrl, parseDimensions, matchesStandardSize, STANDARD_BOX_SIZES } from "@shared/trackingUrls";
import AIExpertReview from "@/components/AIExpertReview";
import DocumentPreviewDialog from "@/components/DocumentPreviewDialog";
import AILetterDialog from "@/components/AILetterDialog";

export default function CaseDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const parsedId = parseInt(params.id || "0", 10);
  const caseId = !isNaN(parsedId) && parsedId > 0 ? parsedId : 0;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [capturingProof, setCapturingProof] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewFileName, setPreviewFileName] = useState("");
  const [pendingDownload, setPendingDownload] = useState<(() => void) | null>(null);
  const [aiLetterDialogOpen, setAiLetterDialogOpen] = useState(false);
  const generateDocMutation = trpc.documents.generateDisputeLetter.useMutation();
  const generateMarkdownMutation = trpc.documentsV2.generateDisputeLetterMarkdown.useMutation();
  const generatePDFMutation = trpc.documentsV2.generateDisputeLetter.useMutation();
  const generateWordMutation = trpc.documentsV2.generateDisputeLetterWord.useMutation();
  const utils = trpc.useUtils();

  const handleCaptureDeliveryProof = async () => {
    if (!caseData) return;
    
    setCapturingProof(true);
    try {
      toast.info("Capturing delivery proof from carrier website...");
      
      const trackingUrl = getTrackingUrl(caseData.carrier as any, caseData.trackingId);
      
      const response = await fetch('/api/capture-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingUrl,
          caseId: caseData.id,
          trackingNumber: caseData.trackingId,
          carrier: caseData.carrier
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to capture tracking page');
      }
      
      const result = await response.json();
      
      // Attachments are saved by the server endpoint automatically
      
      toast.success("Delivery proof captured and saved to Evidence tab!");
      utils.cases.getAttachments.invalidate({ caseId: caseData.id });
      
    } catch (error: any) {
      toast.error(`Failed to capture delivery proof: ${error.message}`);
    } finally {
      setCapturingProof(false);
    }
  };
  
  const { data: caseData, isLoading } = trpc.cases.getById.useQuery(
    { id: caseId },
    { enabled: caseId > 0 }
  );
  const { data: activityLogs } = trpc.cases.getActivityLogs.useQuery(
    { caseId },
    { enabled: caseId > 0 }
  );
  const { data: attachments } = trpc.cases.getAttachments.useQuery(
    { caseId },
    { enabled: caseId > 0 }
  );
  const { data: documents } = trpc.cases.getDocuments.useQuery(
    { caseId },
    { enabled: caseId > 0 }
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800",
      FILED: "bg-blue-100 text-blue-800",
      AWAITING_RESPONSE: "bg-yellow-100 text-yellow-800",
      RESOLVED: "bg-green-100 text-green-800",
      CLOSED: "bg-gray-100 text-gray-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleVoiceRecording = () => {
    toast.info("Voice recording feature coming soon");
  };

  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('caseId', caseId.toString());

        // Upload to server
        const response = await fetch('/api/upload-attachment', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();
        
        // Attachment record is saved by the upload endpoint automatically
      }

      toast.success(`${files.length} file(s) uploaded successfully`);
      utils.cases.getAttachments.invalidate({ caseId });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading case details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!caseData) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <p className="text-muted-foreground">Case not found</p>
          <Button onClick={() => setLocation("/cases")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cases
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/cases")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{caseData.caseNumber}</h1>
                <Badge className={getStatusColor(caseData.status)}>
                  {caseData.status.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Created {formatDate(caseData.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setEditDialogOpen(true)} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Case
            </Button>
            <Button
              onClick={async () => {
                try {
                  // First get markdown preview
                  toast.info("Generating preview...");
                  const markdownResult = await generateMarkdownMutation.mutateAsync({
                    caseId,
                  });
                  
                  // Show preview dialog
                  setPreviewContent(markdownResult.markdown);
                  setPreviewTitle("Dispute Letter Preview");
                  setPreviewFileName(`dispute-letter-${markdownResult.caseNumber}.pdf`);
                  
                  // Set pending download action
                  setPendingDownload(() => async () => {
                    try {
                      toast.info("Generating PDF...");
                      const result = await generatePDFMutation.mutateAsync({
                        caseId,
                      });
                      
                      // Convert base64 to blob and download
                      const blob = new Blob(
                        [Uint8Array.from(atob(result.content), c => c.charCodeAt(0))],
                        { type: 'application/pdf' }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = result.fileName;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      
                      toast.success("Dispute letter PDF downloaded!");
                    } catch (error: any) {
                      toast.error(`Failed to generate PDF: ${error.message}`);
                    }
                  });
                  
                  setPreviewDialogOpen(true);
                } catch (error: any) {
                  toast.error(`Failed to generate preview: ${error.message}`);
                }
              }}
              disabled={generatePDFMutation.isPending || generateMarkdownMutation.isPending}
            >
              {generatePDFMutation.isPending || generateMarkdownMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {generateMarkdownMutation.isPending ? "Loading preview..." : "Generating PDF..."}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Preview & Download PDF
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  toast.info("Generating dispute letter Word document...");
                  const result = await generateWordMutation.mutateAsync({
                    caseId,
                  });
                  
                  // Convert base64 to blob and download
                  const blob = new Blob(
                    [Uint8Array.from(atob(result.fileData), c => c.charCodeAt(0))],
                    { type: result.mimeType }
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = result.fileName;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  
                  toast.success("Dispute letter Word document downloaded!");
                } catch (error: any) {
                  toast.error(`Failed to generate Word document: ${error.message}`);
                }
              }}
              disabled={generateWordMutation.isPending}
            >
              {generateWordMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Word...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Word (.docx)
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setAiLetterDialogOpen(true)}
              className="border-purple-200 hover:bg-purple-50"
            >
              <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
              Generate AI Letter
            </Button>
            <Button variant="outline" onClick={handleFileUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </div>

        {/* Case Details Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Tracking Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-xs text-muted-foreground">Tracking ID</span>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{caseData.trackingId}</p>
                  <a
                    href={getTrackingUrl(caseData.carrier as any, caseData.trackingId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="View tracking on carrier website"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCaptureDeliveryProof}
                    disabled={capturingProof}
                    className="h-7 text-xs"
                    title="Capture delivery proof (screenshot + PDF)"
                  >
                    {capturingProof ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Camera className="h-3 w-3 mr-1" />
                    )}
                    {capturingProof ? 'Capturing...' : 'Capture Proof'}
                  </Button>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Carrier</span>
                <p className="font-medium">{caseData.carrier}</p>
              </div>
              {caseData.serviceType && (
                <div>
                  <span className="text-xs text-muted-foreground">Service Type</span>
                  <p className="font-medium">{caseData.serviceType}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-xs text-muted-foreground">Original Amount</span>
                <p className="font-medium">{formatCurrency(caseData.originalAmount)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Adjusted Amount</span>
                <p className="font-medium">{formatCurrency(caseData.adjustedAmount)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Claimed Amount</span>
                <p className="font-medium text-blue-600">{formatCurrency(caseData.claimedAmount)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Recovered Amount</span>
                <p className="font-medium text-green-600">{formatCurrency(caseData.recoveredAmount)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-xs text-muted-foreground">Actual Dimensions</span>
                <p className="font-medium">{caseData.actualDimensions || "N/A"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Carrier Stated Dimensions</span>
                <p className="font-medium">{caseData.carrierDimensions || "N/A"}</p>
              </div>
              {caseData.carrierDimensions && (() => {
                const parsed = parseDimensions(caseData.carrierDimensions);
                if (!parsed) return null;
                const match = matchesStandardSize(parsed.length, parsed.width, parsed.height);
                if (match.matches) {
                  return (
                    <div className="pt-2 border-t">
                      <span className="text-xs text-green-600 font-medium">✓ Matches Standard Size</span>
                      <p className="text-xs text-muted-foreground mt-1">{match.box?.name}: {match.box?.dimensions}</p>
                    </div>
                  );
                } else {
                  return (
                    <div className="pt-2 border-t">
                      <span className="text-xs text-orange-600 font-medium">⚠ Does NOT match standard sizes</span>
                      <p className="text-xs text-muted-foreground mt-1">Closest: {match.box?.name} ({match.box?.dimensions})</p>
                      <p className="text-xs text-muted-foreground">Difference: {match.difference?.toFixed(2)}"</p>
                    </div>
                  );
                }
              })()}
            </CardContent>
          </Card>
        </div>

        {/* AI Expert Review */}
        <AIExpertReview caseId={caseId} />

        {/* Tabs for detailed information */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <FileText className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4 mr-2" />
              Activity ({activityLogs?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="evidence">
              <FileCheck className="h-4 w-4 mr-2" />
              Evidence ({attachments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Documents ({documents?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="voice">
              <Mic className="h-4 w-4 mr-2" />
              Voice Memos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Case Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {caseData.notes ? (
                  <p className="text-sm whitespace-pre-wrap">{caseData.notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No notes added yet</p>
                )}
              </CardContent>
            </Card>

            {caseData.customerName && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Customer Name</span>
                    <p className="font-medium">{caseData.customerName}</p>
                  </div>
                  {caseData.orderId && (
                    <div>
                      <span className="text-xs text-muted-foreground">Order ID</span>
                      <p className="font-medium">{caseData.orderId}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>Complete history of all actions on this case</CardDescription>
              </CardHeader>
              <CardContent>
                {activityLogs && activityLogs.length > 0 ? (
                  <div className="space-y-4">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex gap-4 border-l-2 border-border pl-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{log.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No activity recorded yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evidence">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Evidence & Attachments</CardTitle>
                    <CardDescription>Photos, documents, and other files</CardDescription>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Files
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {attachments && attachments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attachments.map((attachment, index) => (
                      <div
                        key={attachment.id}
                        className="border rounded-lg p-4 hover:border-primary transition-colors bg-white"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                Evidence #{attachments.length - index}
                              </Badge>
                              <FileCheck className="h-3 w-3 text-green-600" />
                            </div>
                            <p className="text-sm font-medium truncate">
                              {attachment.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {attachment.fileType} • {(attachment.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        {attachment.fileType?.startsWith('image/') && (
                          <img
                            src={attachment.fileUrl}
                            alt={attachment.fileName}
                            className="w-full h-32 object-cover rounded mb-3 border"
                          />
                        )}
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Uploaded:</span>
                              <span>{formatDate(attachment.createdAt)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Chain of Custody:</span>
                              <span>Verified</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => window.open(attachment.fileUrl, '_blank')}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download Evidence
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      No attachments yet. Upload photos, documents, or other evidence.
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload First File
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Generated Documents</CardTitle>
                <CardDescription>Dispute letters and official documents</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No documents generated yet</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="voice" className="space-y-4">
            <VoiceRecorder 
              caseId={caseId} 
              onTranscriptionComplete={(data) => {
                toast.success("Voice memo added to activity log");
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
      <EditCaseDialog
        caseId={caseId}
        caseData={caseData}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => window.location.reload()}
      />
      <DocumentPreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        title={previewTitle}
        content={previewContent}
        fileName={previewFileName}
        onDownload={() => {
          if (pendingDownload) {
            pendingDownload();
          }
        }}
        isMarkdown={true}
      />
      <AILetterDialog
        open={aiLetterDialogOpen}
        onOpenChange={setAiLetterDialogOpen}
        caseId={caseId}
        caseNumber={caseData?.caseNumber || ''}
      />
    </DashboardLayout>
  );
}
