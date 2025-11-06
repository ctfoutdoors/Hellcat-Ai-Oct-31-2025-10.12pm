import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/lib/trpc';
import { 
  Sparkles, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Truck,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PrioritySuggestionProps {
  disputeAmount: number;
  carrier: string;
  createdAt?: Date;
  deadline?: Date;
  currentPriority?: string;
  onAccept?: (priority: string) => void;
  showDetails?: boolean;
}

export function PrioritySuggestion({
  disputeAmount,
  carrier,
  createdAt,
  deadline,
  currentPriority,
  onAccept,
  showDetails = true,
}: PrioritySuggestionProps) {
  const { data: suggestion, isLoading } = trpc.prioritySuggestions.suggest.useQuery({
    disputeAmount,
    carrier,
    createdAt,
    deadline,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span>Analyzing case priority...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!suggestion) return null;

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-blue-100 text-blue-800 border-blue-200',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
      URGENT: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'URGENT') return <AlertTriangle className="h-4 w-4" />;
    if (priority === 'HIGH') return <TrendingUp className="h-4 w-4" />;
    if (priority === 'MEDIUM') return <Info className="h-4 w-4" />;
    return <CheckCircle2 className="h-4 w-4" />;
  };

  const isDifferentFromCurrent = currentPriority && currentPriority !== suggestion.suggestedPriority;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Priority Suggestion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Suggested Priority */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={`${getPriorityColor(suggestion.suggestedPriority)} px-4 py-2 text-base font-semibold border`}>
              {getPriorityIcon(suggestion.suggestedPriority)}
              <span className="ml-2">{suggestion.suggestedPriority}</span>
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>{(suggestion.confidence * 100).toFixed(0)}% confident</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI confidence level based on available data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {onAccept && isDifferentFromCurrent && (
            <Button
              size="sm"
              onClick={() => onAccept(suggestion.suggestedPriority)}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Accept Suggestion
            </Button>
          )}
        </div>

        {/* Current vs Suggested Alert */}
        {isDifferentFromCurrent && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Current priority is <strong>{currentPriority}</strong>. AI suggests changing to{' '}
              <strong>{suggestion.suggestedPriority}</strong> based on case analysis.
            </AlertDescription>
          </Alert>
        )}

        {/* Score Breakdown */}
        {showDetails && (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-muted-foreground">
              Analysis Score: {suggestion.score}/100
            </div>

            {/* Factor Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              {/* Amount Score */}
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{suggestion.factors.amountScore}/30</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full mt-1">
                    <div
                      className="h-full bg-green-600 rounded-full"
                      style={{ width: `${(suggestion.factors.amountScore / 30) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Carrier History Score */}
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carrier History</span>
                    <span className="font-medium">{suggestion.factors.carrierHistoryScore}/30</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full mt-1">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${(suggestion.factors.carrierHistoryScore / 30) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Age Score */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-orange-600" />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Case Age</span>
                    <span className="font-medium">{suggestion.factors.ageScore}/25</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full mt-1">
                    <div
                      className="h-full bg-orange-600 rounded-full"
                      style={{ width: `${(suggestion.factors.ageScore / 25) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Deadline Score */}
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="font-medium">{suggestion.factors.deadlineScore}/15</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full mt-1">
                    <div
                      className="h-full bg-red-600 rounded-full"
                      style={{ width: `${(suggestion.factors.deadlineScore / 15) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Reasoning */}
            <div className="space-y-2 pt-2 border-t">
              <div className="text-sm font-semibold text-muted-foreground">Reasoning:</div>
              <ul className="space-y-1 text-sm">
                {suggestion.reasoning.map((reason, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span className="flex-1">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for case cards
 */
export function PrioritySuggestionBadge({
  caseId,
  currentPriority,
}: {
  caseId: number;
  currentPriority?: string;
}) {
  const { data: suggestion } = trpc.prioritySuggestions.suggestForCase.useQuery({ caseId });

  if (!suggestion || !currentPriority) return null;

  const isDifferent = currentPriority !== suggestion.suggestedPriority;

  if (!isDifferent) return null;

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-blue-100 text-blue-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="gap-1 border-primary/50">
            <Sparkles className="h-3 w-3" />
            AI suggests: {suggestion.suggestedPriority}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-2">
            <p className="font-semibold">
              AI recommends changing priority to{' '}
              <span className={getPriorityColor(suggestion.suggestedPriority)}>
                {suggestion.suggestedPriority}
              </span>
            </p>
            <p className="text-sm">
              Confidence: {(suggestion.confidence * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {suggestion.reasoning[0]}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
