import { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  NodeChange,
  EdgeChange,
  Connection,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Play, Trash2, Copy } from 'lucide-react';

const nodeTypes = [
  { value: 'START', label: 'Start', color: '#10b981', category: 'TRIGGER' },
  { value: 'GENERATE_LETTER', label: 'Generate Letter', color: '#3b82f6', category: 'ACTION' },
  { value: 'FILE_CLAIM', label: 'File Claim', color: '#3b82f6', category: 'ACTION' },
  { value: 'SEND_EMAIL', label: 'Send Email', color: '#3b82f6', category: 'ACTION' },
  { value: 'UPDATE_STATUS', label: 'Update Status', color: '#3b82f6', category: 'ACTION' },
  { value: 'GENERATE_EVIDENCE_PACKAGE', label: 'Generate Evidence', color: '#3b82f6', category: 'ACTION' },
  { value: 'CREATE_REMINDER', label: 'Create Reminder', color: '#3b82f6', category: 'ACTION' },
  { value: 'WAIT', label: 'Wait/Delay', color: '#f59e0b', category: 'UTILITY' },
  { value: 'CONDITION', label: 'Condition', color: '#8b5cf6', category: 'CONDITION' },
  { value: 'END', label: 'End', color: '#ef4444', category: 'TRIGGER' },
];

export default function WorkflowBuilder() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowType, setWorkflowType] = useState<'CASE_LIFECYCLE' | 'APPEAL_PROCESS' | 'ESCALATION' | 'CUSTOM'>('CUSTOM');

  const utils = trpc.useUtils();

  // Queries
  const { data: workflows, isLoading: workflowsLoading } = trpc.workflows.list.useQuery({});
  const { data: templates, isLoading: templatesLoading } = trpc.workflows.getTemplates.useQuery();

  // Mutations
  const createWorkflowMutation = trpc.workflows.create.useMutation({
    onSuccess: () => {
      toast.success('Workflow saved successfully');
      setIsSaveDialogOpen(false);
      utils.workflows.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to save workflow: ${error.message}`);
    },
  });

  const initializeTemplatesMutation = trpc.workflows.initializeTemplates.useMutation({
    onSuccess: () => {
      toast.success('Templates initialized');
      utils.workflows.getTemplates.invalidate();
    },
  });

  const createFromTemplateMutation = trpc.workflows.createFromTemplate.useMutation({
    onSuccess: () => {
      toast.success('Workflow created from template');
      setIsTemplateDialogOpen(false);
      utils.workflows.list.invalidate();
    },
  });

  // React Flow handlers
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  const onNodeClick = useCallback((_event: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Add new node
  const addNode = (type: string) => {
    const nodeConfig = nodeTypes.find(nt => nt.value === type);
    if (!nodeConfig) return;

    const newNode: Node = {
      id: `${type.toLowerCase()}-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        label: nodeConfig.label,
        nodeType: type,
      },
      style: {
        background: nodeConfig.color,
        color: 'white',
        border: '1px solid #222',
        borderRadius: '8px',
        padding: '10px',
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  // Load workflow
  const loadWorkflow = (workflow: any) => {
    setNodes(workflow.nodes);
    setEdges(workflow.edges);
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description || '');
    setWorkflowType(workflow.type);
    toast.success(`Loaded workflow: ${workflow.name}`);
  };

  // Load template
  const loadTemplate = (template: any) => {
    setNodes(template.nodes);
    setEdges(template.edges);
    setWorkflowName(`${template.name} (Copy)`);
    setWorkflowDescription(template.description || '');
    setWorkflowType(template.type);
    setIsTemplateDialogOpen(false);
    toast.success(`Loaded template: ${template.name}`);
  };

  // Save workflow
  const handleSaveWorkflow = () => {
    if (!workflowName) {
      toast.error('Please enter a workflow name');
      return;
    }

    if (nodes.length === 0) {
      toast.error('Workflow must have at least one node');
      return;
    }

    createWorkflowMutation.mutate({
      name: workflowName,
      description: workflowDescription,
      type: workflowType,
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.data.nodeType,
        data: n.data,
        position: n.position,
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
      triggerType: 'MANUAL',
      isActive: true,
    });
  };

  // Clear canvas
  const clearCanvas = () => {
    if (confirm('Are you sure you want to clear the canvas?')) {
      setNodes([]);
      setEdges([]);
      setWorkflowName('');
      setWorkflowDescription('');
      setSelectedNode(null);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Workflow Builder</h1>
            <p className="text-sm text-muted-foreground">Design automated workflows for claim processing</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Copy className="mr-2 h-4 w-4" />
                  Templates
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Workflow Templates</DialogTitle>
                  <DialogDescription>
                    Start with a pre-built workflow template
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {!templates || templates.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No templates available</p>
                      <Button onClick={() => initializeTemplatesMutation.mutate()}>
                        Initialize Default Templates
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {templates.map((template) => (
                        <Card key={template.id} className="cursor-pointer hover:border-primary" onClick={() => loadTemplate(template)}>
                          <CardHeader>
                            <CardTitle>{template.name}</CardTitle>
                            <CardDescription>{template.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>{template.type}</span>
                              <span>Used {template.usageCount} times</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={clearCanvas}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>

            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Workflow
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Workflow</DialogTitle>
                  <DialogDescription>
                    Save this workflow for future use
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Workflow Name</Label>
                    <Input
                      id="name"
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                      placeholder="e.g., Standard Claim Filing"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={workflowDescription}
                      onChange={(e) => setWorkflowDescription(e.target.value)}
                      placeholder="Describe what this workflow does"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Workflow Type</Label>
                    <Select value={workflowType} onValueChange={(value: any) => setWorkflowType(value)}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASE_LIFECYCLE">Case Lifecycle</SelectItem>
                        <SelectItem value="APPEAL_PROCESS">Appeal Process</SelectItem>
                        <SelectItem value="ESCALATION">Escalation</SelectItem>
                        <SelectItem value="CUSTOM">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveWorkflow} disabled={createWorkflowMutation.isPending}>
                    {createWorkflowMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Node Palette */}
        <div className="w-64 border-r bg-muted/50 p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Node Types</h3>
          <div className="space-y-2">
            {nodeTypes.map((nodeType) => (
              <Button
                key={nodeType.value}
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode(nodeType.value)}
              >
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: nodeType.color }}
                />
                {nodeType.label}
              </Button>
            ))}
          </div>

          {workflows && workflows.length > 0 && (
            <>
              <h3 className="font-semibold mt-6 mb-4">Saved Workflows</h3>
              <div className="space-y-2">
                {workflows.slice(0, 5).map((workflow) => (
                  <Button
                    key={workflow.id}
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    onClick={() => loadWorkflow(workflow)}
                  >
                    {workflow.name}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div className="w-80 border-l bg-muted/50 p-4 overflow-y-auto">
            <h3 className="font-semibold mb-4">Node Properties</h3>
            <div className="space-y-4">
              <div>
                <Label>Node Type</Label>
                <p className="text-sm text-muted-foreground">{selectedNode.data.nodeType}</p>
              </div>
              <div>
                <Label>Node ID</Label>
                <p className="text-sm text-muted-foreground font-mono">{selectedNode.id}</p>
              </div>
              <div>
                <Label htmlFor="node-label">Label</Label>
                <Input
                  id="node-label"
                  value={selectedNode.data.label || ''}
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === selectedNode.id
                          ? { ...n, data: { ...n.data, label: e.target.value } }
                          : n
                      )
                    );
                    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, label: e.target.value } });
                  }}
                />
              </div>
              {/* Add more node-specific configuration fields here */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
