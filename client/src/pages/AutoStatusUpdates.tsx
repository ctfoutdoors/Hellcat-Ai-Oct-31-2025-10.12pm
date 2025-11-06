import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Mail, CheckCircle2, XCircle, Clock, AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";

export default function AutoStatusUpdates() {
  const [rawEmail, setRawEmail] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  
  const analyzeMutation = trpc.autoStatusUpdates.analyzeResponse.useMutation();
  const processMutation = trpc.autoStatusUpdates.processResponse.useMutation();

  const handleAnalyze = async () => {
    if (!rawEmail.trim()) {
      toast.error("Please paste an email to analyze");
      return;
    }

    try {
      const result = await analyzeMutation.mutateAsync({ rawEmail });
      setAnalysis(result);
      toast.success("Email analyzed successfully");
    } catch (error: any) {
      toast.error(`Analysis failed: ${error.message}`);
    }
  };

  const handleProcess = async () => {
    if (!rawEmail.trim()) {
      toast.error("Please paste an email to process");
      return;
    }

    try {
      const result = await processMutation.mutateAsync({ rawEmail });
      
      if (result.updated) {
        toast.success(`Case ${result.caseId} updated successfully`);
      } else {
        toast.warning("No matching case found");
      }
      
      setAnalysis(result.analysis);
    } catch (error: any) {
      toast.error(`Processing failed: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-amber-500 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "REQUIRES_INFO":
        return (
          <Badge className="bg-blue-500 text-white">
            <AlertCircle className="h-3 w-3 mr-1" />
            Requires Info
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Unknown
          </Badge>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="h-8 w-8 text-yellow-500" />
            Auto-Status Updates
          </h1>
          <p className="text-gray-600 mt-2">
            Automatically analyze carrier response emails and update case statuses
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Carrier Response Email
              </CardTitle>
              <CardDescription>
                Paste the raw email content from the carrier (FedEx, UPS, USPS, DHL)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste carrier email here..."
                value={rawEmail}
                onChange={(e) => setRawEmail(e.target.value)}
                rows={15}
                className="font-mono text-sm"
              />
              
              <div className="flex gap-2">
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzeMutation.isPending || !rawEmail.trim()}
                  className="flex-1"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Analyze Only
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleProcess}
                  disabled={processMutation.isPending || !rawEmail.trim()}
                  variant="default"
                  className="flex-1"
                >
                  {processMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Process & Update Case
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>
                AI-powered email analysis and status determination
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!analysis ? (
                <div className="text-center py-12 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No analysis yet</p>
                  <p className="text-sm mt-2">Paste an email and click Analyze</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(analysis.status)}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Confidence</label>
                    <div className="mt-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${analysis.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{analysis.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {analysis.caseNumber && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Case Number</label>
                      <p className="mt-1 font-mono text-sm">{analysis.caseNumber}</p>
                    </div>
                  )}

                  {analysis.trackingNumber && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tracking Number</label>
                      <p className="mt-1 font-mono text-sm">{analysis.trackingNumber}</p>
                    </div>
                  )}

                  {analysis.extractedAmount && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Amount</label>
                      <p className="mt-1 text-lg font-semibold text-green-600">
                        ${(analysis.extractedAmount / 100).toFixed(2)}
                      </p>
                    </div>
                  )}

                  {analysis.responseDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Response Date</label>
                      <p className="mt-1">{analysis.responseDate}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-700">Reasoning</label>
                    <p className="mt-1 text-sm text-gray-600">{analysis.reasoning}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h3 className="font-semibold">Paste Email</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Copy and paste the carrier response email content
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold">2</span>
                  </div>
                  <h3 className="font-semibold">AI Analysis</h3>
                </div>
                <p className="text-sm text-gray-600">
                  AI extracts case number, status, amount, and reasoning
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold">3</span>
                  </div>
                  <h3 className="font-semibold">Auto-Update</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Case status is automatically updated with activity log
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
