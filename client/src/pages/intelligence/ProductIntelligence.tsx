import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle, CheckCircle2, Clock, Rocket } from "lucide-react";
import { toast } from "sonner";

/**
 * Product Intelligence Page
 * Lifecycle state management and readiness tracking
 */

const lifecycleStates = [
  { value: "concept", label: "Concept", color: "bg-gray-500" },
  { value: "development", label: "Development", color: "bg-blue-500" },
  { value: "pre_launch", label: "Pre-Launch", color: "bg-yellow-500" },
  { value: "active_launch", label: "Active Launch", color: "bg-green-500" },
  { value: "post_launch", label: "Post-Launch", color: "bg-purple-500" },
  { value: "cruise", label: "Cruise", color: "bg-teal-500" },
  { value: "end_of_life", label: "End of Life", color: "bg-red-500" },
];

export default function ProductIntelligence() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const { data: products, isLoading, refetch } = trpc.intelligence.products.list.useQuery();
  const updateStateMutation = trpc.intelligence.products.updateState.useMutation({
    onSuccess: () => {
      toast.success("Product state updated");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredProducts = selectedState
    ? products?.filter((p) => p.lifecycleState === selectedState)
    : products;

  const getReadinessColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const getReadinessIcon = (score: number) => {
    if (score >= 90) return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (score >= 75) return <Clock className="w-5 h-5 text-yellow-600" />;
    return <AlertCircle className="w-5 h-5 text-red-600" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Intelligence</h1>
          <p className="text-muted-foreground mt-2">
            Lifecycle state management and readiness tracking
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">Filter by state:</span>
          <Select value={selectedState || "all"} onValueChange={(v) => setSelectedState(v === "all" ? null : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {lifecycleStates.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lifecycle State Overview */}
      <div className="grid grid-cols-7 gap-4">
        {lifecycleStates.map((state) => {
          const count = products?.filter((p) => p.lifecycleState === state.value).length || 0;
          return (
            <Card key={state.value} className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedState(state.value)}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">{state.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{count}</div>
                <div className={`h-2 ${state.color} rounded mt-2`} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Product List */}
      <div className="grid gap-4">
        {filteredProducts && filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const readinessScore = product.intelligenceMetadata?.readinessScore || 0;
            const currentState = lifecycleStates.find((s) => s.value === product.lifecycleState);

            return (
              <Card key={product.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3">
                        {product.name}
                        <Badge variant="outline" className={currentState?.color}>
                          {currentState?.label}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">SKU: {product.sku}</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {getReadinessIcon(readinessScore)}
                          <span className={`text-2xl font-bold ${getReadinessColor(readinessScore)}`}>
                            {readinessScore}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Readiness Score</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6">
                    {/* Assets */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Assets</h4>
                      {product.intelligenceMetadata?.assets && product.intelligenceMetadata.assets.length > 0 ? (
                        <div className="space-y-1">
                          {product.intelligenceMetadata.assets.map((asset, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              {asset.status === "completed" ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <Clock className="w-4 h-4 text-yellow-600" />
                              )}
                              <span>{asset.type}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No assets tracked</p>
                      )}
                    </div>

                    {/* Requirements */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Requirements</h4>
                      {product.intelligenceMetadata?.requirements && product.intelligenceMetadata.requirements.length > 0 ? (
                        <div className="space-y-1">
                          {product.intelligenceMetadata.requirements.map((req, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              {req.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <Clock className="w-4 h-4 text-yellow-600" />
                              )}
                              <span>{req.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No requirements defined</p>
                      )}
                    </div>

                    {/* Blockers */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Blockers</h4>
                      {product.intelligenceMetadata?.blockers && product.intelligenceMetadata.blockers.length > 0 ? (
                        <div className="space-y-1">
                          {product.intelligenceMetadata.blockers.map((blocker, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle className="w-4 h-4" />
                              <span>{blocker}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-green-600 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          No blockers
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Variant Summary */}
                  {product.variantSummary && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Variants:</span>{" "}
                          <span className="font-semibold">{product.variantSummary.total || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Ready:</span>{" "}
                          <span className="font-semibold text-green-600">{product.variantSummary.ready || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Blocked:</span>{" "}
                          <span className="font-semibold text-red-600">{product.variantSummary.blocked || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg Readiness:</span>{" "}
                          <span className="font-semibold">{product.variantSummary.avgReadiness || 0}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Rocket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {selectedState ? "No products in this state" : "No products found"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
