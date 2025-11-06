import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Loader2, Brain, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import { toast } from "sonner";

interface AIExpertReviewProps {
  caseId: number;
}

export default function AIExpertReview({ caseId }: AIExpertReviewProps) {
  const [review, setReview] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateReviewMutation = trpc.aiReview.generateReview.useMutation();

  const handleGenerateReview = async () => {
    setIsGenerating(true);
    try {
      toast.info("Generating AI expert review...");
      const result = await generateReviewMutation.mutateAsync({ caseId });
      setReview(result.review);
      toast.success("Expert review generated!");
    } catch (error: any) {
      toast.error(`Failed to generate review: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "Strong":
        return "bg-green-100 text-green-800 border-green-300";
      case "Moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Weak":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  if (!review) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle>AI Expert Review</CardTitle>
          </div>
          <CardDescription>
            Get an unbiased expert analysis of this case, checking against carrier tariffs and regulations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleGenerateReview} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing case...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate Expert Review
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            AI will analyze evidence, check regulations, and provide neutral assessment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle>AI Expert Review</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateReview}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Regenerate"
            )}
          </Button>
        </div>
        <CardDescription>
          Neutral, unbiased analysis by AI shipping dispute expert
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Claim Strength & Confidence */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Claim Strength</label>
            <Badge className={`mt-1 text-lg px-4 py-1 ${getStrengthColor(review.claimStrength)}`}>
              {review.claimStrength}
            </Badge>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Confidence Score</label>
            <div className={`text-3xl font-bold mt-1 ${getConfidenceColor(review.confidenceScore)}`}>
              {review.confidenceScore}%
            </div>
          </div>
        </div>

        {/* Summary */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {review.summary}
          </AlertDescription>
        </Alert>

        {/* Should File Decision */}
        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
          {review.shouldFile ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <XCircle className="h-6 w-6 text-red-600" />
          )}
          <div>
            <p className="font-medium">
              {review.shouldFile ? "Recommended to File" : "Not Recommended to File"}
            </p>
            <p className="text-sm text-muted-foreground">
              Probability of Success: {review.probabilityOfSuccess}%
            </p>
          </div>
        </div>

        {/* Red Flags */}
        {review.redFlags && review.redFlags.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Red Flags:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {review.redFlags.map((flag: string, i: number) => (
                  <li key={i}>{flag}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Fact-Checking Sections */}
        {(review.unitConversionCheck || review.physicalPossibilityCheck || review.standardSizeMatch) && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              Fact-Checking & Validation
            </h4>
            <div className="space-y-3">
              {review.unitConversionCheck && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Unit Conversion Check:</p>
                  <p className="text-sm text-blue-700 mt-1">{review.unitConversionCheck}</p>
                </div>
              )}
              {review.physicalPossibilityCheck && (
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-purple-900">Physical Possibility Check:</p>
                  <p className="text-sm text-purple-700 mt-1">{review.physicalPossibilityCheck}</p>
                </div>
              )}
              {review.standardSizeMatch && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-green-900">Standard Size Match:</p>
                  <p className="text-sm text-green-700 mt-1">{review.standardSizeMatch}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detailed Sections */}
        <div className="space-y-4">
          <Section title="Regulatory Analysis" content={review.regulatoryAnalysis} />
          <Section title="Evidence Evaluation" content={review.evidenceEvaluation} />
          <Section title="Dimensional Weight Analysis" content={review.dimensionalWeightAnalysis} />
          <Section title="Carrier-Specific Rules" content={review.carrierRules} />
          <Section title="Potential Counterarguments" content={review.counterarguments} />
          <Section title="Recommended Strategy" content={review.recommendedStrategy} />
          <Section title="Expert Opinion" content={review.expertOpinion} />
        </div>

        {/* Additional Evidence Needed */}
        {review.additionalEvidenceNeeded && review.additionalEvidenceNeeded.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Additional Evidence Needed:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {review.additionalEvidenceNeeded.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div className="border-l-4 border-purple-200 pl-4">
      <h4 className="font-medium text-sm mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>
    </div>
  );
}
