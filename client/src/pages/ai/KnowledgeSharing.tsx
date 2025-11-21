import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, Users, Brain, Share2, Filter } from 'lucide-react';
import { Streamdown } from 'streamdown';

export default function KnowledgeSharing() {
  const [searchTopic, setSearchTopic] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>();
  
  // Query shared knowledge
  const { data: knowledge, isLoading } = trpc.aiAgents.queryKnowledge.useQuery({
    topic: searchTopic || undefined,
    department: selectedDepartment,
    limit: 50,
  });

  // Get all agents for department filtering
  const { data: agents } = trpc.aiAgents.listAgents.useQuery();

  const departments = agents 
    ? Array.from(new Set(agents.map(a => a.department).filter(Boolean)))
    : [];

  const handleSearch = () => {
    // Trigger refetch with current filters
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              Knowledge Sharing Hub
            </h1>
            <p className="text-muted-foreground mt-1">
              Cross-agent collaboration and collective intelligence
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Share2 className="h-4 w-4 mr-2" />
            {knowledge?.length || 0} Insights
          </Badge>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Knowledge Base</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Search by topic or keyword..."
                  value={searchTopic}
                  onChange={(e) => setSearchTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
              <div className="flex gap-2 items-center">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={selectedDepartment || ''}
                  onChange={(e) => setSelectedDepartment(e.target.value || undefined)}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="insights">
              <TrendingUp className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="departments">
              <Users className="h-4 w-4 mr-2" />
              By Department
            </TabsTrigger>
            <TabsTrigger value="agents">
              <Brain className="h-4 w-4 mr-2" />
              By Agent
            </TabsTrigger>
          </TabsList>

          {/* Insights View */}
          <TabsContent value="insights" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Loading knowledge base...
                </CardContent>
              </Card>
            ) : knowledge && knowledge.length > 0 ? (
              knowledge.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{item.topic}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Badge variant="secondary">{item.department}</Badge>
                          <span className="text-sm">
                            by {item.agentName} ({item.agentRole})
                          </span>
                          <span className="text-xs text-muted-foreground">
                            • {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={item.confidence > 0.8 ? 'default' : 'outline'}
                        className="ml-4"
                      >
                        {Math.round(item.confidence * 100)}% confidence
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <Streamdown>{item.insights}</Streamdown>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Knowledge Shared Yet</h3>
                  <p className="text-muted-foreground">
                    Agents will share insights as they collaborate on tasks
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Department View */}
          <TabsContent value="departments" className="space-y-4">
            {departments.map((dept) => {
              const deptKnowledge = knowledge?.filter(k => k.department === dept) || [];
              return (
                <Card key={dept}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{dept}</span>
                      <Badge variant="secondary">{deptKnowledge.length} insights</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {deptKnowledge.length > 0 ? (
                      <div className="space-y-3">
                        {deptKnowledge.slice(0, 3).map((item) => (
                          <div key={item.id} className="border-l-2 border-primary pl-4 py-2">
                            <div className="font-medium">{item.topic}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.agentName} • {new Date(item.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No insights shared yet</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Agent View */}
          <TabsContent value="agents" className="space-y-4">
            {agents && agents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agents
                  .filter(agent => agent.level >= 4) // Specialists only
                  .map((agent) => {
                    const agentKnowledge = knowledge?.filter(k => k.agentId === agent.id) || [];
                    return (
                      <Card key={agent.id}>
                        <CardHeader>
                          <CardTitle className="text-base">{agent.name}</CardTitle>
                          <CardDescription>
                            {agent.department} • {agent.role}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Contributions
                            </span>
                            <Badge variant="outline">{agentKnowledge.length}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No agents found
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
