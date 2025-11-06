import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, BarChart3, PieChart } from "lucide-react";
import ProgressDashboard from "@/components/ProgressDashboard";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, Area, AreaChart } from 'recharts';

export default function Dashboard() {
  const { data: metrics, isLoading } = trpc.dashboard.metrics.useQuery();

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const stats = [
    {
      title: "Total Claimed",
      value: metrics ? formatCurrency(metrics.totalClaimed) : "$0.00",
      icon: DollarSign,
      description: "Total amount claimed in disputes",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Recovered",
      value: metrics ? formatCurrency(metrics.totalRecovered) : "$0.00",
      icon: TrendingUp,
      description: "Successfully recovered amount",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Open Exposure",
      value: metrics ? formatCurrency(metrics.openExposure) : "$0.00",
      icon: AlertCircle,
      description: "Pending dispute amount",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Success Rate",
      value: metrics ? `${metrics.successRate.toFixed(1)}%` : "0%",
      icon: CheckCircle,
      description: `${metrics?.resolvedCases || 0} of ${metrics?.totalCases || 0} cases resolved`,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your carrier dispute cases and financial metrics
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? "..." : stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Analytics Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Case Status Distribution
              </CardTitle>
              <CardDescription>Breakdown of cases by current status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={[
                      { name: 'Open', value: metrics?.openCases || 0, color: '#3b82f6' },
                      { name: 'In Progress', value: metrics?.inProgressCases || 0, color: '#f59e0b' },
                      { name: 'Resolved', value: metrics?.resolvedCases || 0, color: '#10b981' },
                      { name: 'Rejected', value: metrics?.rejectedCases || 0, color: '#ef4444' },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Open', value: metrics?.openCases || 0, color: '#3b82f6' },
                      { name: 'In Progress', value: metrics?.inProgressCases || 0, color: '#f59e0b' },
                      { name: 'Resolved', value: metrics?.resolvedCases || 0, color: '#10b981' },
                      { name: 'Rejected', value: metrics?.rejectedCases || 0, color: '#ef4444' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Carriers by Claims
              </CardTitle>
              <CardDescription>Carriers with most dispute cases</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={metrics?.carrierStats || []}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="carrier" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="Cases" />
                  <Bar dataKey="amount" fill="#10b981" name="Amount ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>
              Cases filed and amounts recovered over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={metrics?.monthlyTrends || []}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cases"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorCases)"
                  name="Cases Filed"
                />
                <Area
                  type="monotone"
                  dataKey="recovered"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorRecovered)"
                  name="Amount Recovered ($)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Progress Dashboard */}
        <div className="col-span-full">
          <ProgressDashboard />
        </div>

        {/* Recent Activity Section */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates on your dispute cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {metrics.recentActivity.map((activity: any, index: number) => (
                  <div key={index} className="flex items-start gap-4 border-l-2 border-border pl-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No recent activity to display</p>
                <p className="text-sm mt-2">Create your first case to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
