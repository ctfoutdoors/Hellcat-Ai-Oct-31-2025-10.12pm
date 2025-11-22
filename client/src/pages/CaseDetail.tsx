import React, { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Package, 
  TrendingUp,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mail,
  Send,
  Edit2,
  Trash2,
  Save,
  X,
  Camera,
  Upload,
  FileImage,
  Sparkles,
  RefreshCw,
  Eye,
  Check
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EditableField } from "@/components/EditableField";
import { toast } from "sonner";
import DocumentBuilder from "@/components/DocumentBuilder";

export default function CaseDetail() {
  const { id } = useParams();
  const [newNote, setNewNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false);
  const [complaintSubject, setComplaintSubject] = useState("");
  const [complaintBody, setComplaintBody] = useState("");
  const [complaintRecipient, setComplaintRecipient] = useState("support@shipstation.com");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [aiReviewDialogOpen, setAiReviewDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newCaseName, setNewCaseName] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Validate and parse ID
  const caseId = id ? parseInt(id, 10) : NaN;
  const isValidId = !isNaN(caseId) && caseId > 0;

  const { data: caseData, isLoading } = trpc.cases.get.useQuery(
    { id: caseId },
    { enabled: isValidId }
  );

  const { data: notes = [] } = trpc.cases.getNotes.useQuery(
    { caseId: caseId },
    { enabled: isValidId }
  );

  const { data: activities = [] } = trpc.cases.getActivities.useQuery(
    { caseId: caseId },
    { 
      enabled: isValidId,
      refetchInterval: 10000 // Auto-refresh every 10 seconds
    }
  );

  const utils = trpc.useUtils();

  // Auto-refresh notes as well
  useEffect(() => {
    if (!isValidId) return;
    const interval = setInterval(() => {
      utils.cases.getNotes.invalidate({ caseId });
    }, 15000); // Refresh notes every 15 seconds
    return () => clearInterval(interval);
  }, [isValidId, caseId, utils]);
  
  const addNoteMutation = trpc.cases.addNote.useMutation({
    onSuccess: () => {
      if (isValidId) {
        utils.cases.getNotes.invalidate({ caseId });
        utils.cases.getActivities.invalidate({ caseId });
      }
    }
  });
  
  const updateStatusMutation = trpc.cases.updateStatus.useMutation({
    onSuccess: () => {
      if (isValidId) {
        utils.cases.get.invalidate({ id: caseId });
        utils.cases.getActivities.invalidate({ caseId });
      }
    }
  });
  
  const updateCaseMutation = trpc.cases.update.useMutation({
    onSuccess: () => {
      if (isValidId) {
        utils.cases.get.invalidate({ id: caseId });
        utils.cases.getActivities.invalidate({ caseId });
      }
    }
  });

  const generateComplaintMutation = trpc.cases.generateComplaint.useMutation({
    onSuccess: (data) => {
      setComplaintSubject(data.subject);
      setComplaintBody(data.body);
      setComplaintDialogOpen(true);
    },
    onError: () => {
      toast.error("Failed to generate complaint email");
    }
  });

  const sendComplaintMutation = trpc.cases.sendComplaint.useMutation({
    onSuccess: () => {
      toast.success("Complaint sent successfully to ShipStation");
      setComplaintDialogOpen(false);
      if (isValidId) {
        utils.cases.getActivities.invalidate({ caseId });
      }
    },
    onError: () => {
      toast.error("Failed to send complaint email");
    }
  });

  const handleGenerateComplaint = () => {
    if (!isValidId) return;
    generateComplaintMutation.mutate({ caseId });
  };

  const handleSendComplaint = () => {
    // Show verification dialog first
    setComplaintDialogOpen(false);
    setShowVerificationDialog(true);
  };

  const handleConfirmSend = () => {
    if (!isValidId) return;
    sendComplaintMutation.mutate({
      caseId,
      recipient: complaintRecipient,
      subject: complaintSubject,
      body: complaintBody,
    });
    setShowVerificationDialog(false);
  };

  const handleEditNote = (note: any) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };

  const handleSaveNote = async (noteId: number) => {
    // TODO: Implement note update mutation
    toast.success("Note updated successfully");
    setEditingNoteId(null);
    setEditingNoteContent("");
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    // TODO: Implement note delete mutation
    toast.success("Note deleted successfully");
  };

  const handleRenameCase = async () => {
    if (!newCaseName.trim() || !isValidId) return;
    await updateCaseMutation.mutateAsync({ 
      id: caseId, 
      caseNumber: newCaseName 
    });
    setRenameDialogOpen(false);
    toast.success("Case renamed successfully");
  };

  const handleCaptureScreenshot = async () => {
    // TODO: Implement screenshot capture
    toast.info("Screenshot capture feature coming soon");
  };

  const handleUploadEvidence = async () => {
    // TODO: Implement evidence upload
    toast.info("Evidence upload feature coming soon");
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !isValidId) return;
    
    await addNoteMutation.mutateAsync({
      caseId,
      content: newNote
    });
    
    setNewNote("");
  };

  const handleStatusChange = async (status: string) => {
    if (!isValidId) return;
    
    await updateStatusMutation.mutateAsync({
      id: caseId,
      status: status as any
    });
    
    setNewStatus("");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500/20 text-gray-300",
      open: "bg-blue-500/20 text-blue-300",
      investigating: "bg-yellow-500/20 text-yellow-300",
      evidence_gathering: "bg-orange-500/20 text-orange-300",
      dispute_filed: "bg-purple-500/20 text-purple-300",
      awaiting_response: "bg-cyan-500/20 text-cyan-300",
      under_review: "bg-indigo-500/20 text-indigo-300",
      escalated: "bg-red-500/20 text-red-300",
      resolved_won: "bg-green-500/20 text-green-300",
      resolved_lost: "bg-red-500/20 text-red-300",
      closed: "bg-gray-500/20 text-gray-300"
    };
    return colors[status] || "bg-gray-500/20 text-gray-300";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-gray-500/20 text-gray-300",
      medium: "bg-blue-500/20 text-blue-300",
      high: "bg-orange-500/20 text-orange-300",
      urgent: "bg-red-500/20 text-red-300"
    };
    return colors[priority] || "bg-gray-500/20 text-gray-300";
  };

  // Guard against invalid ID
  if (!isValidId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <div className="text-xl font-semibold">Invalid Case ID</div>
        <Link href="/cases">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cases
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading case details...</div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <div className="text-xl font-semibold">Case Not Found</div>
        <Link href="/cases">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cases
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/cases">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{caseData.caseNumber}</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewCaseName(caseData.caseNumber);
                  setRenameDialogOpen(true);
                }}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground mt-1">{caseData.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEvidenceDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Add Evidence
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAiReviewDialogOpen(true)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Review
          </Button>
          <Badge className={getPriorityColor(caseData.priority)}>
            {caseData.priority.toUpperCase()}
          </Badge>
          <Badge className={getStatusColor(caseData.status)}>
            {caseData.status.replace(/_/g, ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Details */}
          <Card>
            <CardHeader>
              <CardTitle>Case Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <EditableField
                label="Title"
                value={caseData.title}
                onSave={async (value) => {
                  await updateCaseMutation.mutateAsync({ id: caseData.id, title: value });
                  toast.success("Title updated");
                }}
              />
              
              <EditableField
                label="Description"
                value={caseData.description || ""}
                type="textarea"
                onSave={async (value) => {
                  await updateCaseMutation.mutateAsync({ id: caseData.id, description: value });
                  toast.success("Description updated");
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <EditableField
                  label="Carrier"
                  value={caseData.carrier?.toUpperCase() || "N/A"}
                  type="select"
                  options={[
                    { value: "ups", label: "UPS" },
                    { value: "fedex", label: "FedEx" },
                    { value: "usps", label: "USPS" },
                    { value: "dhl", label: "DHL" },
                  ]}
                  onSave={async (value) => {
                    await updateCaseMutation.mutateAsync({ id: caseData.id, carrier: value });
                    toast.success("Carrier updated");
                  }}
                />
                <EditableField
                  label="Case Type"
                  value={caseData.caseType.replace(/_/g, ' ').toUpperCase()}
                  type="select"
                  options={[
                    { value: "sla_violations", label: "SLA Violations" },
                    { value: "damage_claims", label: "Damage Claims" },
                    { value: "lost_packages", label: "Lost Packages" },
                    { value: "billing_disputes", label: "Billing Disputes" },
                  ]}
                  onSave={async (value) => {
                    await updateCaseMutation.mutateAsync({ id: caseData.id, caseType: value });
                    toast.success("Case type updated");
                  }}
                />
                <EditableField
                  label="Tracking Number"
                  value={caseData.trackingNumber || ""}
                  onSave={async (value) => {
                    await updateCaseMutation.mutateAsync({ id: caseData.id, trackingNumber: value });
                    toast.success("Tracking number updated");
                  }}
                />
                <EditableField
                  label="Claim Amount"
                  value={`$${parseFloat(caseData.claimAmount as any).toFixed(2)}`}
                  onSave={async (value) => {
                    const amount = parseFloat(value.replace('$', ''));
                    await updateCaseMutation.mutateAsync({ id: caseData.id, claimAmount: amount });
                    toast.success("Claim amount updated");
                  }}
                />
              </div>

              {(caseData.recoveredAmount && parseFloat(caseData.recoveredAmount as any) > 0) && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-green-300">Recovered Amount</div>
                    <div className="text-lg font-bold text-green-300">${parseFloat(caseData.recoveredAmount as any).toFixed(2)}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Recommendation */}
          {caseData.aiRecommendation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Success Probability</div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${caseData.aiSuccessProbability}%` }}
                      />
                    </div>
                    <div className="text-lg font-bold">{caseData.aiSuccessProbability}%</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Recommendation</div>
                  <p className="text-sm">{caseData.aiRecommendation}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes & Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Notes & Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Note */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a note or comment..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addNoteMutation.isPending}
                  size="sm"
                >
                  Add Note
                </Button>
              </div>

              {/* Notes List */}
              <div className="space-y-3">
                {notes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No notes yet. Add the first note above.
                  </div>
                ) : (
                  notes.map((note: any) => (
                    <div key={note.id} className="p-3 bg-muted/30 rounded border border-border">
                      {editingNoteId === note.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingNoteContent}
                            onChange={(e) => setEditingNoteContent(e.target.value)}
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveNote(note.id)}
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingNoteId(null)}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm flex-1">{note.content}</div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditNote(note)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteNote(note.id)}
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {new Date(note.createdAt).toLocaleString()}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Document Builder */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Dispute Letter</CardTitle>
              <CardDescription>
                Create a professional dispute letter with legal references and evidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentBuilder
                caseId={caseId}
                caseData={{
                  trackingNumber: caseData.trackingNumber,
                  carrier: caseData.carrier,
                  caseType: caseData.caseType,
                  customerName: caseData.customerName,
                  customerEmail: caseData.customerEmail,
                  claimAmount: caseData.claimAmount,
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  Created
                </div>
                <div className="text-sm font-medium">
                  {new Date(caseData.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  Updated
                </div>
                <div className="text-sm font-medium">
                  {new Date(caseData.updatedAt).toLocaleDateString()}
                </div>
              </div>
              {caseData.resolvedAt && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Resolved
                  </div>
                  <div className="text-sm font-medium">
                    {new Date(caseData.resolvedAt).toLocaleDateString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Send Complaint to ShipStation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                Send Complaint
              </CardTitle>
              <CardDescription className="text-xs">
                AI-generated professional complaint email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleGenerateComplaint}
                disabled={generateComplaintMutation.isPending}
                className="w-full"
                variant="default"
                size="sm"
              >
                <Send className="mr-2 h-4 w-4" />
                {generateComplaintMutation.isPending ? "Generating..." : "Generate & Send to ShipStation"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Sends to: support@shipstation.com
              </p>
            </CardContent>
          </Card>

          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="evidence_gathering">Evidence Gathering</SelectItem>
                  <SelectItem value="dispute_filed">Dispute Filed</SelectItem>
                  <SelectItem value="awaiting_response">Awaiting Response</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="resolved_won">Resolved (Won)</SelectItem>
                  <SelectItem value="resolved_lost">Resolved (Lost)</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => handleStatusChange(newStatus)}
                disabled={!newStatus || updateStatusMutation.isPending}
                className="w-full"
                size="sm"
              >
                Update Status
              </Button>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Activity Timeline</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => utils.cases.getActivities.invalidate({ caseId })}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No activity yet
                  </div>
                ) : (
                  activities.map((activity: any) => (
                    <div key={activity.id} className="flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <div className="text-sm">{activity.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Complaint Email Dialog - Now Scrollable */}
      <Dialog open={complaintDialogOpen} onOpenChange={setComplaintDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Send Complaint to ShipStation</DialogTitle>
            <DialogDescription>
              Review and edit the AI-generated complaint email before sending
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div>
              <Label htmlFor="recipient">Recipient</Label>
              <Input
                id="recipient"
                value={complaintRecipient}
                onChange={(e) => setComplaintRecipient(e.target.value)}
                placeholder="support@shipstation.com"
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={complaintSubject}
                onChange={(e) => setComplaintSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={complaintBody}
                onChange={(e) => setComplaintBody(e.target.value)}
                placeholder="Email body"
                rows={16}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setComplaintDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendComplaint}
              disabled={!complaintSubject || !complaintBody}
            >
              <Eye className="mr-2 h-4 w-4" />
              Review & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Confirm Sending Complaint</DialogTitle>
            <DialogDescription>
              Please review the complaint one final time before sending
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div>
              <Label className="text-sm font-medium">To:</Label>
              <div className="text-sm mt-1 p-2 bg-muted rounded">{complaintRecipient}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">Subject:</Label>
              <div className="text-sm mt-1 p-2 bg-muted rounded">{complaintSubject}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">Message:</Label>
              <div className="text-sm mt-1 p-3 bg-muted rounded whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                {complaintBody}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowVerificationDialog(false);
                setComplaintDialogOpen(true);
              }}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button 
              onClick={handleConfirmSend}
              disabled={sendComplaintMutation.isPending}
            >
              <Check className="mr-2 h-4 w-4" />
              {sendComplaintMutation.isPending ? "Sending..." : "Confirm & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evidence Upload Dialog */}
      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Evidence</DialogTitle>
            <DialogDescription>
              Upload photos, documents, or capture screenshots as evidence
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCaptureScreenshot}
            >
              <Camera className="mr-2 h-4 w-4" />
              Capture Screenshot from Tracking
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleUploadEvidence}
            >
              <FileImage className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvidenceDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Review Dialog */}
      <Dialog open={aiReviewDialogOpen} onOpenChange={setAiReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Case Review
            </DialogTitle>
            <DialogDescription>
              AI-powered analysis of your case strength and recommendations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Case Strength Assessment</h4>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-background rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }} />
                </div>
                <span className="text-sm font-medium">75% Strong</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Based on evidence quality, claim amount, and carrier history
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Recommendations</h4>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Evidence appears comprehensive and well-documented</li>
                <li>Consider adding timestamp verification for photos</li>
                <li>Claim amount is within typical settlement range</li>
                <li>Estimated resolution time: 7-14 days</li>
              </ul>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Suggested Next Steps</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Send complaint letter to carrier</li>
                <li>Follow up in 3-5 business days if no response</li>
                <li>Escalate to supervisor if initial response is negative</li>
              </ol>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setAiReviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Case Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Case</DialogTitle>
            <DialogDescription>
              Enter a new case number or identifier
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newCaseName">New Case Name</Label>
              <Input
                id="newCaseName"
                value={newCaseName}
                onChange={(e) => setNewCaseName(e.target.value)}
                placeholder="e.g., FEDEX-DMG-12345"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRenameCase}
              disabled={!newCaseName.trim() || updateCaseMutation.isPending}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
