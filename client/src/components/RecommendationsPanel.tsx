import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Archive,
  BarChart,
  Bell,
  Box,
  CheckCircle,
  Clock,
  Copy,
  Database,
  Edit,
  Eye,
  FileDown,
  FileSpreadsheet,
  FileText,
  Filter,
  Flag,
  HardDrive,
  Info,
  LayoutDashboard,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Monitor,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Search,
  SearchCheck,
  Send,
  Settings,
  Share2,
  Sparkles,
  Tag,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TrendingUp,
  UserPlus,
  Video,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface RecommendationsPanelProps {
  page: string;
  entityType?: string;
  entityId?: number;
  entityData?: any;
  onActionExecute?: (actionId: string) => void;
  className?: string;
}

const iconMap: Record<string, any> = {
  Eye,
  Edit,
  Plus,
  Monitor,
  LayoutDashboard,
  BarChart,
  Package,
  Box,
  SearchCheck,
  Settings,
  Copy,
  Archive,
  Trash2,
  RefreshCw,
  Flag,
  UserPlus,
  Tag,
  CheckCircle,
  Clock,
  FileDown,
  FileSpreadsheet,
  FileText,
  Mail,
  MessageSquare,
  MessageCircle,
  Phone,
  Video,
  HardDrive,
  Bell,
  Database,
  TrendingUp,
  Zap,
  MapPin,
  Send,
  Info,
  Filter,
  Search,
  Share2,
};

export function RecommendationsPanel({
  page,
  entityType,
  entityId,
  entityData,
  onActionExecute,
  className,
}: RecommendationsPanelProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const { data: recommendations, isLoading } = trpc.recommendations.getRecommendations.useQuery({
    page,
    entityType,
    entityId,
    entityData,
  });

  const visibleRecommendations = recommendations?.filter((rec) => !dismissedIds.has(rec.actionId));

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!visibleRecommendations || visibleRecommendations.length === 0) {
    return null;
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-base">Suggested Actions</CardTitle>
        </div>
        <CardDescription className="text-xs">AI-powered recommendations for you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {visibleRecommendations.map((rec) => {
          const Icon = iconMap[rec.icon] || Plus;
          const confidenceColor =
            rec.confidence >= 80
              ? "text-green-600 dark:text-green-400"
              : rec.confidence >= 60
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-gray-600 dark:text-gray-400";

          return (
            <div
              key={rec.actionId}
              className="group flex items-start gap-3 p-3 rounded-lg border hover:border-blue-500 hover:bg-accent/50 transition-all cursor-pointer"
              onClick={() => {
                if (onActionExecute) {
                  onActionExecute(rec.actionId);
                }
                toast.success(`Executing: ${rec.label}`);
              }}
            >
              <div className="shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">{rec.label}</h4>
                  <span className={cn("text-xs font-medium", confidenceColor)}>
                    {rec.confidence}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{rec.reason}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                    {rec.category}
                  </span>
                  <span className="text-xs text-muted-foreground">Priority: {rec.priority}</span>
                </div>
              </div>
              <div className="shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.success("Thanks for your feedback!");
                  }}
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDismissedIds((prev) => new Set(prev).add(rec.actionId));
                    toast.info("Recommendation dismissed");
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
