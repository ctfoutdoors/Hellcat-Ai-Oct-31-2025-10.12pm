import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, DollarSign, Package, Target, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CaseAnalytics() {
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});

  const { data: overallMetrics, isLoading: loadingOverall } = trpc.analytics.getOverallMetrics.useQuery(dateRange);
  const { data: carrierMetrics, isLoading: loadingCarrier } = trpc.analytics.getCarrierMetrics.useQuery(dateRange);
  const { data: caseTypeMetrics, isLoading: loadingCaseType } = trpc.analytics.getCaseTypeMetrics.useQuery(dateRange);

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Case Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track recovery rates, success metrics, and ROI across all dispute cases
          </p>
        </div>
        <Button variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          Filter by Date
        </Button>
      </div>

      {/* Overall Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {loadingOverall ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallMetrics?.totalCases || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {overallMetrics?.activeCases || 0} active, {overallMetrics?.resolvedCases || 0} resolved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallMetrics?.overallSuccessRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {overallMetrics?.wonCases || 0} won, {overallMetrics?.lostCases || 0} lost
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallMetrics?.overallRecoveryRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  ${overallMetrics?.totalRecovered.toLocaleString() || 0} recovered
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallMetrics?.avgResolutionDays || 0} days</div>
                <p className="text-xs text-muted-foreground">
                  ROI: {overallMetrics?.roi || 0}%
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="carriers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="carriers">By Carrier</TabsTrigger>
          <TabsTrigger value="caseTypes">By Case Type</TabsTrigger>
        </TabsList>

        <TabsContent value="carriers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Carrier Performance</CardTitle>
              <CardDescription>
                Compare recovery rates and success metrics across different carriers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCarrier ? (
                <div className="space-y-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              ) : (
                <div className="space-y-4">
                  {carrierMetrics?.map((carrier) => (
                    <div
                      key={carrier.carrier}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{carrier.carrier}</h3>
                        <p className="text-sm text-muted-foreground">
                          {carrier.totalCases} cases • {carrier.resolvedCases} resolved
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-8 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {carrier.successRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">Success Rate</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {carrier.recoveryRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">Recovery Rate</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{carrier.avgResolutionDays}d</div>
                          <div className="text-xs text-muted-foreground">Avg Resolution</div>
                        </div>
                      </div>
                      <div className="ml-8 text-right">
                        <div className="text-lg font-semibold">
                          ${carrier.totalRecovered.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          of ${carrier.totalClaimed.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caseTypes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Case Type Analysis</CardTitle>
              <CardDescription>
                Success rates and claim amounts by dispute type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCaseType ? (
                <div className="space-y-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              ) : (
                <div className="space-y-4">
                  {caseTypeMetrics?.map((caseType) => (
                    <div
                      key={caseType.caseType}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg capitalize">
                          {caseType.caseType.replace(/_/g, " ")}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {caseType.totalCases} cases • {caseType.wonCases} won
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-8 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {caseType.successRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">Success Rate</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            ${caseType.avgClaimAmount.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Avg Claim</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            ${caseType.avgRecoveredAmount.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Avg Recovered</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
