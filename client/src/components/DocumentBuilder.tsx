import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Download, 
  Eye, 
  Plus, 
  X, 
  Upload, 
  Scale, 
  FileCheck,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface DocumentBuilderProps {
  caseId: number;
  caseData: {
    trackingNumber: string;
    carrier: string;
    caseType: string;
    customerName: string;
    customerEmail: string;
    claimAmount: number;
  };
}

export default function DocumentBuilder({ caseId, caseData }: DocumentBuilderProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [includeCertification, setIncludeCertification] = useState(true);
  const [includeAttestation, setIncludeAttestation] = useState(true);
  const [selectedLegalRefs, setSelectedLegalRefs] = useState<number[]>([]);
  const [selectedCarrierTerms, setSelectedCarrierTerms] = useState<number[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<number[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [addendums, setAddendums] = useState<Array<{ id: string; content: string }>>([]);

  // Fetch legal references from database
  const { data: legalReferences = [], isLoading: loadingLegalRefs } = trpc.legalReferences.list.useQuery({
    claimType: caseData.caseType,
    carrier: caseData.carrier,
    limit: 20,
  });

  // Fetch carrier terms from database
  const { data: carrierTerms = [], isLoading: loadingCarrierTerms } = trpc.carrierTerms.listByCarrier.useQuery({
    carrier: caseData.carrier,
    claimType: caseData.caseType,
  });

  // Fetch case documents (evidence)
  const { data: evidenceFiles = [], isLoading: loadingEvidence } = trpc.cases.getDocuments.useQuery(
    { caseId },
    { enabled: !!caseId }
  );

  // Mock templates - TODO: create templates router
  const templates = [
    { id: "1", name: "Late Delivery SLA", description: "SLA Violations" },
    { id: "2", name: "Damaged Package", description: "Package Damages" },
    { id: "3", name: "Lost Package", description: "Lost Packages" },
    { id: "4", name: "Billing Adjustment", description: "Billing Adjustments" },
  ];

  const isLoading = loadingLegalRefs || loadingCarrierTerms || loadingEvidence;

  const toggleLegalRef = (id: number) => {
    setSelectedLegalRefs(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleCarrierTerm = (id: number) => {
    setSelectedCarrierTerms(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleEvidence = (id: number) => {
    setSelectedEvidence(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const addNewAddendum = () => {
    const newAddendum = {
      id: `addendum-${Date.now()}`,
      content: "",
    };
    setAddendums(prev => [...prev, newAddendum]);
  };

  const removeAddendum = (id: string) => {
    setAddendums(prev => prev.filter(a => a.id !== id));
  };

  const updateAddendum = (id: string, content: string) => {
    setAddendums(prev =>
      prev.map(a => (a.id === id ? { ...a, content } : a))
    );
  };

  const handleGenerateDocument = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }

    setIsGenerating(true);
    try {
      // TODO: Call actual document generation endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Document generated successfully");
      setPreviewUrl("/mock-preview-url.pdf");
    } catch (error) {
      toast.error("Failed to generate document");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) {
      toast.error("No document to download");
      return;
    }
    toast.success("Downloading document...");
    // TODO: Implement actual download
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configuration Panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Template
            </CardTitle>
            <CardDescription>
              Choose a template for your dispute letter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-xs text-muted-foreground">{template.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Legal References */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Legal References
            </CardTitle>
            <CardDescription>
              Select applicable laws and regulations to cite
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLegalRefs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : legalReferences.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No legal references found for this case type
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {legalReferences.map(ref => (
                  <div
                    key={ref.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedLegalRefs.includes(ref.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => toggleLegalRef(ref.id)}
                  >
                    <Checkbox
                      checked={selectedLegalRefs.includes(ref.id)}
                      onCheckedChange={() => toggleLegalRef(ref.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{ref.citation}</span>
                        <Badge variant="secondary" className="text-xs">
                          {ref.relevanceScore}% relevant
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{ref.title}</p>
                    </div>
                  </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Carrier Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Carrier Terms & Conditions
            </CardTitle>
            <CardDescription>
              Reference specific carrier policies
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCarrierTerms ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : carrierTerms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No carrier terms found for {caseData.carrier}
              </div>
            ) : (
              <div className="space-y-3">
                {carrierTerms.map(term => (
                <div
                  key={term.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCarrierTerms.includes(term.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => toggleCarrierTerm(term.id)}
                >
                  <Checkbox
                    checked={selectedCarrierTerms.includes(term.id)}
                    onCheckedChange={() => toggleCarrierTerm(term.id)}
                  />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{term.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {term.termType.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{term.carrier}</p>
                    </div>
                </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evidence Attachments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Evidence Attachments
            </CardTitle>
            <CardDescription>
              Include supporting documents and photos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {evidenceFiles.map(file => (
                <div
                  key={file.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedEvidence.includes(file.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => toggleEvidence(file.id)}
                >
                  <Checkbox
                    checked={selectedEvidence.includes(file.id)}
                    onCheckedChange={() => toggleEvidence(file.id)}
                  />
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.type} • {file.size}
                    </p>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Upload More Files
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Document Options */}
        <Card>
          <CardHeader>
            <CardTitle>Document Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="certification"
                checked={includeCertification}
                onCheckedChange={(checked) => setIncludeCertification(checked as boolean)}
              />
              <Label htmlFor="certification" className="cursor-pointer">
                Include certification block with signature
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="attestation"
                checked={includeAttestation}
                onCheckedChange={(checked) => setIncludeAttestation(checked as boolean)}
              />
              <Label htmlFor="attestation" className="cursor-pointer">
                Include attestation under penalty of perjury
              </Label>
            </div>
            <Separator />
            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional information or special instructions..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Custom Addendums */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Custom Addendums
            </CardTitle>
            <CardDescription>
              Add custom sections with free-text content for specific scenarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {addendums.map((addendum, index) => (
              <div key={addendum.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Addendum {index + 1}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAddendum(addendum.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  placeholder="Enter addendum content (e.g., additional evidence, special circumstances, prior correspondence...)"                  value={addendum.content}
                  onChange={(e) => updateAddendum(addendum.id, e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addNewAddendum}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Addendum
            </Button>
            {addendums.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {addendums.length} addendum{addendums.length !== 1 ? 's' : ''} will be appended to the document
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview & Actions Panel */}
      <div className="space-y-6">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Document Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Template</p>
              <p className="font-medium">
                {selectedTemplate
                  ? templates.find(t => t.id === selectedTemplate)?.name
                  : "Not selected"}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Legal References</p>
              <p className="font-medium">{selectedLegalRefs.length} selected</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Carrier Terms</p>
              <p className="font-medium">{selectedCarrierTerms.length} selected</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Evidence Files</p>
              <p className="font-medium">{selectedEvidence.length} attached</p>
            </div>
            {addendums.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Custom Addendums</p>
                <p className="font-medium">{addendums.length} addendum{addendums.length !== 1 ? 's' : ''}</p>
              </div>
            )}
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Checkbox checked={includeCertification} disabled />
                <span className="text-muted-foreground">Certification</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Checkbox checked={includeAttestation} disabled />
                <span className="text-muted-foreground">Attestation</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={handleGenerateDocument}
              disabled={!selectedTemplate || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Document
                </>
              )}
            </Button>
            {previewUrl && (
              <>
                <Button variant="outline" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline" className="w-full" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-blue-700 dark:text-blue-400">
                  Document Builder Tips
                </p>
                <ul className="space-y-1 text-blue-600/80 dark:text-blue-400/80">
                  <li>• Select relevant legal references to strengthen your case</li>
                  <li>• Include carrier terms that support your claim</li>
                  <li>• Attach all supporting evidence and documentation</li>
                  <li>• Review the preview before downloading</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
