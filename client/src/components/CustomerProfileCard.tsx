import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  Star, 
  MessageSquare, 
  Mail,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface CustomerProfileCardProps {
  customerEmail: string;
}

export default function CustomerProfileCard({ customerEmail }: CustomerProfileCardProps) {
  const { data: profile, isLoading } = trpc.dataEnrichment.getCustomerProfile.useQuery({
    customerEmail,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-gray-200 rounded" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Customer profile not found
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "low":
        return <TrendingDown className="w-4 h-4" />;
      case "medium":
        return <Minus className="w-4 h-4" />;
      case "high":
      case "critical":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const { identity, reamaze, klaviyo, riskScore } = profile;

  return (
    <Card className="overflow-hidden">
      {/* Header with Risk Badge */}
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {identity.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{identity.name || "Unknown"}</CardTitle>
              <p className="text-sm text-muted-foreground">{identity.email}</p>
            </div>
          </div>
          
          <Badge 
            className={`${getRiskColor(riskScore.riskLevel)} flex items-center gap-1 px-3 py-1`}
          >
            {getRiskIcon(riskScore.riskLevel)}
            <span className="font-semibold">{riskScore.overallScore}/100</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <DollarSign className="w-3 h-3" />
              <span>Lifetime Value</span>
            </div>
            <p className="text-2xl font-bold">
              ${((identity.lifetimeValue || 0) / 100).toFixed(2)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Package className="w-3 h-3" />
              <span>Total Orders</span>
            </div>
            <p className="text-2xl font-bold">{identity.totalOrders || 0}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <AlertTriangle className="w-3 h-3" />
              <span>Disputes</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {identity.disputeCount || 0}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Star className="w-3 h-3" />
              <span>Avg Review</span>
            </div>
            <p className="text-2xl font-bold">
              {klaviyo?.stats?.averageReviewRating 
                ? (klaviyo.stats.averageReviewRating / 100).toFixed(1) 
                : "N/A"}
              {klaviyo?.stats?.averageReviewRating && (
                <span className="text-sm text-muted-foreground">/5</span>
              )}
            </p>
          </div>
        </div>

        {/* Support History */}
        {reamaze && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm">Support History</h4>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1">
                <span className="font-medium">{reamaze.stats.totalTickets}</span>
                <span className="text-muted-foreground">tickets</span>
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="flex items-center gap-1">
                <span className="font-medium">{reamaze.stats.averageResolutionTimeHours}h</span>
                <span className="text-muted-foreground">avg resolution</span>
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                <span className="font-medium">{reamaze.stats.averageSatisfactionScore}</span>
                <span className="text-muted-foreground">/5 satisfaction</span>
              </span>
            </div>
          </div>
        )}

        {/* Email Engagement */}
        {klaviyo && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm">Email Engagement</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Open Rate</span>
                  <span className="font-medium">
                    {klaviyo.stats.emailOpenRate}%
                  </span>
                </div>
                <Progress value={klaviyo.stats.emailOpenRate} className="h-1" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Click Rate</span>
                  <span className="font-medium">
                    {klaviyo.stats.emailClickRate}%
                  </span>
                </div>
                <Progress value={klaviyo.stats.emailClickRate} className="h-1" />
              </div>
            </div>
          </div>
        )}

        {/* Risk Factor Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            Risk Factor Breakdown
          </h4>
          <div className="space-y-2">
            {Object.entries(riskScore.factorBreakdown).map(([factor, data]: [string, any]) => (
              <div key={factor} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize text-muted-foreground">
                    {factor.replace(/_/g, " ")}
                  </span>
                  <span className="font-medium">{data.score}/100</span>
                </div>
                <Progress 
                  value={data.score} 
                  className="h-1.5"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {riskScore.recommendations && riskScore.recommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm text-blue-900">
              Recommendations
            </h4>
            <ul className="space-y-1">
              {riskScore.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <User className="w-4 h-4 mr-2" />
            View Full Profile
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <MessageSquare className="w-4 h-4 mr-2" />
            View Tickets
          </Button>
        </div>

        {/* Confidence Score */}
        <div className="text-center text-xs text-muted-foreground pt-2 border-t">
          Data confidence: {riskScore.confidence}% • Last updated: {new Date().toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
