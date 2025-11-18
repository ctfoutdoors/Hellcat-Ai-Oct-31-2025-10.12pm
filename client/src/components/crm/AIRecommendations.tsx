import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, ArrowRight, TrendingUp, MessageSquare, DollarSign, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export type RecommendationType = "action" | "insight" | "opportunity" | "risk";

export interface Recommendation {
  id: number;
  type: RecommendationType;
  text: string;
  confidence: number; // 0-100
  source: string; // e.g., "Recent activity logs", "Order volume", "Communication patterns"
}

interface AIRecommendationsProps {
  entityType: "vendor" | "customer" | "partner" | "manufacturer";
  entityId: number;
  recommendations: Recommendation[];
  onRegenerate?: () => void;
  isGenerating?: boolean;
  className?: string;
}

export function AIRecommendations({
  entityType,
  entityId,
  recommendations,
  onRegenerate,
  isGenerating = false,
  className,
}: AIRecommendationsProps) {
  const getTypeIcon = (type: RecommendationType) => {
    switch (type) {
      case "action":
        return <ArrowRight className="h-4 w-4 text-blue-400" />;
      case "insight":
        return <TrendingUp className="h-4 w-4 text-purple-400" />;
      case "opportunity":
        return <DollarSign className="h-4 w-4 text-green-400" />;
      case "risk":
        return <MessageSquare className="h-4 w-4 text-amber-400" />;
    }
  };

  const getTypeColor = (type: RecommendationType) => {
    switch (type) {
      case "action":
        return "border-l-blue-500 bg-blue-500/5";
      case "insight":
        return "border-l-purple-500 bg-purple-500/5";
      case "opportunity":
        return "border-l-green-500 bg-green-500/5";
      case "risk":
        return "border-l-amber-500 bg-amber-500/5";
    }
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 90) return "Very High";
    if (confidence >= 75) return "High";
    if (confidence >= 60) return "Medium";
    if (confidence >= 40) return "Low";
    return "Very Low";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 75) return "text-green-400";
    if (confidence >= 50) return "text-yellow-400";
    return "text-orange-400";
  };

  return (
    <Card className={cn("bg-slate-900 border-slate-700", className)}>
      <CardHeader className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white">
                AI Recommendations
              </CardTitle>
              <p className="text-sm text-slate-400 mt-0.5">
                Data-driven next steps
              </p>
            </div>
          </div>
          {onRegenerate && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRegenerate}
              disabled={isGenerating}
              className="bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isGenerating && "animate-spin")} />
              {isGenerating ? "Generating..." : "Regenerate"}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-indigo-400 animate-pulse" />
            </div>
            <p className="text-slate-400">Analyzing data and generating recommendations...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-slate-400 mb-2">No recommendations available</p>
            <p className="text-sm text-slate-500">
              Generate recommendations based on recent activity
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Data Sources */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Analysis Sources
              </h4>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(recommendations.map(r => r.source))).map((source, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 rounded-md bg-slate-700/50 text-slate-300 border border-slate-600"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>

            {/* Recommendations List */}
            <div className="space-y-3">
              {recommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className={cn(
                    "border-l-4 rounded-lg p-4 transition-all hover:shadow-lg",
                    getTypeColor(recommendation.type)
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getTypeIcon(recommendation.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-slate-200 leading-relaxed">
                          {recommendation.text}
                        </p>
                        <span className={cn(
                          "text-xs font-semibold whitespace-nowrap",
                          getConfidenceColor(recommendation.confidence)
                        )}>
                          {getConfidenceLabel(recommendation.confidence)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="capitalize">{recommendation.type}</span>
                        <span>•</span>
                        <span>{recommendation.source}</span>
                        <span>•</span>
                        <span>{recommendation.confidence}% confidence</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Note */}
            <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
              <p className="text-xs text-indigo-300 leading-relaxed">
                <strong>Note:</strong> These recommendations are generated based on historical data, 
                activity patterns, and predictive analytics. They should be reviewed in context with 
                your business goals and current strategy.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
