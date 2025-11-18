import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, TrendingUp, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RelationshipHealthData {
  score: number; // 0-100
  narrative: string;
  strengths: string[];
  concerns: string[];
  auditLogs?: Array<{
    id: number;
    timestamp: Date;
    event: string;
    impact: "positive" | "negative" | "neutral";
  }>;
}

interface RelationshipHealthProps {
  entityType: "vendor" | "customer" | "partner" | "manufacturer";
  entityId: number;
  data: RelationshipHealthData;
  onRefresh?: () => void;
  className?: string;
}

export function RelationshipHealth({
  entityType,
  entityId,
  data,
  onRefresh,
  className,
}: RelationshipHealthProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-600/20 to-green-600/5";
    if (score >= 60) return "from-yellow-600/20 to-yellow-600/5";
    if (score >= 40) return "from-orange-600/20 to-orange-600/5";
    return "from-red-600/20 to-red-600/5";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Card className={cn("bg-slate-900 border-slate-700", className)}>
      <CardHeader className={cn("bg-gradient-to-r", getScoreGradient(data.score))}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-white">
            Relationship Health
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={cn("text-3xl font-bold", getScoreColor(data.score))}>
                {data.score}/100
              </div>
              <div className="text-xs text-slate-400">Health Score</div>
            </div>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="text-slate-400 hover:text-white"
              >
                <TrendingUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <Progress 
            value={data.score} 
            className="h-2 bg-slate-800"
            indicatorClassName={getProgressColor(data.score)}
          />
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* AI Narrative */}
        <div>
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
            Analysis
          </h4>
          <p className="text-slate-200 leading-relaxed">
            {data.narrative}
          </p>
        </div>

        {/* Strengths and Concerns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <h4 className="text-sm font-semibold text-green-400 uppercase tracking-wide">
                Strengths
              </h4>
            </div>
            <div className="space-y-2">
              {data.strengths.length > 0 ? (
                data.strengths.map((strength, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-sm text-slate-200 bg-green-500/10 border border-green-500/30 rounded-lg p-3"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                    <span>{strength}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 italic">No strengths identified yet</p>
              )}
            </div>
          </div>

          {/* Concerns */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">
                Concerns
              </h4>
            </div>
            <div className="space-y-2">
              {data.concerns.length > 0 ? (
                data.concerns.map((concern, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-sm text-slate-200 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
                    <span>{concern}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 italic">No concerns identified</p>
              )}
            </div>
          </div>
        </div>

        {/* Audit Logs Expansion */}
        {data.auditLogs && data.auditLogs.length > 0 && (
          <div className="border-t border-slate-700 pt-6">
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <span className="font-semibold">Full Audit Log ({data.auditLogs.length} events)</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {isExpanded && (
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {data.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                      log.impact === "positive" && "bg-green-500",
                      log.impact === "negative" && "bg-red-500",
                      log.impact === "neutral" && "bg-slate-500"
                    )}></div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-200">{log.event}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        log.impact === "positive" && "bg-green-500/20 text-green-300 border-green-500/50",
                        log.impact === "negative" && "bg-red-500/20 text-red-300 border-red-500/50",
                        log.impact === "neutral" && "bg-slate-500/20 text-slate-300 border-slate-500/50"
                      )}
                    >
                      {log.impact}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
