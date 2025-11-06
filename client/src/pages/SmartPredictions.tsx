import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  DollarSign,
  Package,
  Calendar,
  Sparkles
} from "lucide-react";

interface PredictionItem {
  sku: string;
  name: string;
  currentStock: number;
  avgDailyUsage: number;
  predictedStockoutDate: string;
  recommendedReorderQty: number;
  recommendedReorderDate: string;
  confidence: number;
  potentialSavings: number;
  priority: "high" | "medium" | "low";
}

export default function SmartPredictions() {
  const [selectedPriority, setSelectedPriority] = useState<string>("all");

  // Mock AI predictions data
  const predictions: PredictionItem[] = [
    {
      sku: "TAPE-2IN-CLR",
      name: "Packing Tape 2in Clear",
      currentStock: 85,
      avgDailyUsage: 12.3,
      predictedStockoutDate: "2025-11-09",
      recommendedReorderQty: 250,
      recommendedReorderDate: "2025-11-05",
      confidence: 94,
      potentialSavings: 145,
      priority: "high"
    },
    {
      sku: "BUBBLE-12X100",
      name: "Bubble Wrap 12x100ft",
      currentStock: 45,
      avgDailyUsage: 8.7,
      predictedStockoutDate: "2025-11-07",
      recommendedReorderQty: 150,
      recommendedReorderDate: "2025-11-04",
      confidence: 91,
      potentialSavings: 89,
      priority: "high"
    },
    {
      sku: "LABEL-4X6",
      name: "Shipping Labels 4x6",
      currentStock: 234,
      avgDailyUsage: 15.2,
      predictedStockoutDate: "2025-11-17",
      recommendedReorderQty: 500,
      recommendedReorderDate: "2025-11-12",
      confidence: 88,
      potentialSavings: 67,
      priority: "medium"
    },
    {
      sku: "BOX-12X12X12",
      name: "Shipping Box 12x12x12",
      currentStock: 450,
      avgDailyUsage: 18.5,
      predictedStockoutDate: "2025-11-26",
      recommendedReorderQty: 600,
      recommendedReorderDate: "2025-11-20",
      confidence: 92,
      potentialSavings: 234,
      priority: "medium"
    },
    {
      sku: "ENVELOPE-10X13",
      name: "Poly Mailer 10x13",
      currentStock: 1200,
      avgDailyUsage: 45.3,
      predictedStockoutDate: "2025-11-28",
      recommendedReorderQty: 2000,
      recommendedReorderDate: "2025-11-22",
      confidence: 85,
      potentialSavings: 312,
      priority: "low"
    }
  ];

  const filteredPredictions = selectedPriority === "all" 
    ? predictions 
    : predictions.filter(p => p.priority === selectedPriority);

  const totalPotentialSavings = predictions.reduce((sum, p) => sum + p.potentialSavings, 0);
  const highPriorityCount = predictions.filter(p => p.priority === "high").length;
  const avgConfidence = Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 text-red-300 border-red-500/50";
      case "medium": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
      case "low": return "bg-green-500/20 text-green-300 border-green-500/50";
      default: return "bg-gray-500/20 text-gray-300";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-500";
    if (confidence >= 80) return "text-yellow-500";
    return "text-orange-500";
  };

  const getDaysUntilStockout = (date: string) => {
    const stockoutDate = new Date(date);
    const today = new Date();
    const diffTime = stockoutDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleCreatePO = (item: PredictionItem) => {
    console.log("Creating PO for:", item.sku);
    // TODO: Navigate to PO creation with pre-filled data
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-500" />
            <h1 className="text-3xl font-bold">Smart Inventory Predictions</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            AI-powered reorder recommendations based on demand forecasting
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedPriority === "all" ? "default" : "outline"}
            onClick={() => setSelectedPriority("all")}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={selectedPriority === "high" ? "default" : "outline"}
            onClick={() => setSelectedPriority("high")}
            size="sm"
          >
            High Priority
          </Button>
          <Button
            variant={selectedPriority === "medium" ? "default" : "outline"}
            onClick={() => setSelectedPriority("medium")}
            size="sm"
          >
            Medium
          </Button>
          <Button
            variant={selectedPriority === "low" ? "default" : "outline"}
            onClick={() => setSelectedPriority("low")}
            size="sm"
          >
            Low
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ${totalPotentialSavings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From optimized ordering
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{highPriorityCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{avgConfidence}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              AI prediction accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recommendations</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{predictions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active predictions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insight Banner */}
      <Card className="border-purple-500/50 bg-purple-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">AI Analysis Summary</h3>
              <p className="text-sm text-muted-foreground">
                Based on historical data from the last 90 days, our AI model has identified {predictions.length} items 
                that require reordering within the next 30 days. By following these recommendations, you can save an 
                estimated <span className="text-green-500 font-semibold">${totalPotentialSavings}</span> through optimized 
                bulk ordering and avoid {highPriorityCount} potential stockouts. The model considers seasonal trends, 
                lead times, and order frequency patterns to maximize efficiency.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predictions List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Reorder Recommendations</h2>
        {filteredPredictions.map((item, index) => {
          const daysUntilStockout = getDaysUntilStockout(item.predictedStockoutDate);
          const daysUntilReorder = getDaysUntilStockout(item.recommendedReorderDate);
          
          return (
            <Card key={index} className="hover:border-purple-500/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <Badge variant="outline" className={getPriorityColor(item.priority)}>
                        {item.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <span className="font-mono">{item.sku}</span>
                      <span>•</span>
                      <span>Current Stock: <span className="font-semibold">{item.currentStock}</span> units</span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-sm font-medium ${getConfidenceColor(item.confidence)}`}>
                      {item.confidence}% confidence
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Daily Usage
                    </div>
                    <div className="text-lg font-semibold">{item.avgDailyUsage} units/day</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Stockout In
                    </div>
                    <div className={`text-lg font-semibold ${
                      daysUntilStockout <= 7 ? 'text-red-500' : 
                      daysUntilStockout <= 14 ? 'text-yellow-500' : 
                      'text-green-500'
                    }`}>
                      {daysUntilStockout} days
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Recommended Qty
                    </div>
                    <div className="text-lg font-semibold text-purple-500">
                      {item.recommendedReorderQty} units
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Potential Savings
                    </div>
                    <div className="text-lg font-semibold text-green-500">
                      ${item.potentialSavings}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Recommended reorder date: 
                      <span className="font-medium text-foreground ml-1">
                        {new Date(item.recommendedReorderDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                      <span className="ml-2">
                        ({daysUntilReorder} days from now)
                      </span>
                    </span>
                  </div>
                  <Button onClick={() => handleCreatePO(item)} className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Create PO
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPredictions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No predictions found for the selected priority level.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
