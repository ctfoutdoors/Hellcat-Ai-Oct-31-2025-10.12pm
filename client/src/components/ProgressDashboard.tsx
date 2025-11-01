import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronRight,
  MessageSquare,
  Edit,
  Save,
  X
} from "lucide-react";

interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  comment?: string;
}

interface TaskSection {
  id: string;
  title: string;
  description: string;
  tasks: TaskItem[];
  expanded: boolean;
}

export default function ProgressDashboard() {
  const [sections, setSections] = useState<TaskSection[]>([
    {
      id: "audit",
      title: "Step 1: System Audit & Mapping",
      description: "Complete audit of existing pages, database, and services",
      expanded: true,
      tasks: [
        { id: "audit-1", title: "Create complete site map of all 31 existing pages", completed: false },
        { id: "audit-2", title: "Document all navigation paths and cross-links", completed: false },
        { id: "audit-3", title: "Map all database tables and relationships", completed: false },
        { id: "audit-4", title: "Document all backend services and APIs", completed: false },
        { id: "audit-5", title: "Create AI command mapping for all features", completed: false },
      ]
    },
    {
      id: "dashboard",
      title: "Step 2: Interactive Checklist Dashboard",
      description: "Build real-time progress tracking system",
      expanded: true,
      tasks: [
        { id: "dash-1", title: "Create ProgressDashboard component", completed: true },
        { id: "dash-2", title: "Add to Dashboard page", completed: false },
        { id: "dash-3", title: "Implement check-off functionality", completed: true },
        { id: "dash-4", title: "Add comment/note system", completed: false },
        { id: "dash-5", title: "Persist state in database", completed: false },
      ]
    },
    {
      id: "links",
      title: "Step 3: Fix Existing Page Links",
      description: "Ensure all navigation is properly connected",
      expanded: false,
      tasks: [
        { id: "links-1", title: "Ensure all menu items link to correct pages", completed: false },
        { id: "links-2", title: "Add breadcrumb navigation to all pages", completed: false },
        { id: "links-3", title: "Add cross-links between related pages", completed: false },
        { id: "links-4", title: "Fix any broken navigation", completed: false },
      ]
    },
    {
      id: "crm-db",
      title: "Step 4: CRM Database Schema",
      description: "Add 20 new tables for CRM, Intelligence, and Agents",
      expanded: false,
      tasks: [
        { id: "db-1", title: "Add contacts table", completed: false },
        { id: "db-2", title: "Add companies table", completed: false },
        { id: "db-3", title: "Add deals table", completed: false },
        { id: "db-4", title: "Add distributors table", completed: false },
        { id: "db-5", title: "Add vendors table", completed: false },
        { id: "db-6", title: "Add rawDataPool table", completed: false },
        { id: "db-7", title: "Add intelligence graph tables (nodes, edges, relationships)", completed: false },
        { id: "db-8", title: "Add predictions & prescriptions tables", completed: false },
        { id: "db-9", title: "Add autonomous agents tables", completed: false },
        { id: "db-10", title: "Add competitors tables", completed: false },
        { id: "db-11", title: "Run pnpm db:push", completed: false },
        { id: "db-12", title: "Insert sample data", completed: false },
      ]
    },
    {
      id: "crm-api",
      title: "Step 5: CRM Backend API",
      description: "Create tRPC routers and database helpers",
      expanded: false,
      tasks: [
        { id: "api-1", title: "Create CRM database helper functions", completed: false },
        { id: "api-2", title: "Create server/routers/crm.ts", completed: false },
        { id: "api-3", title: "Add contacts CRUD endpoints", completed: false },
        { id: "api-4", title: "Add companies CRUD endpoints", completed: false },
        { id: "api-5", title: "Add deals CRUD endpoints", completed: false },
        { id: "api-6", title: "Register CRM router in main routers.ts", completed: false },
        { id: "api-7", title: "Test all API endpoints", completed: false },
      ]
    },
    {
      id: "crm-pages",
      title: "Step 6: CRM Pages Implementation",
      description: "Build all CRM and Intelligence pages with tRPC integration",
      expanded: false,
      tasks: [
        { id: "pages-1", title: "Create Contacts List page", completed: false },
        { id: "pages-2", title: "Create Contact Detail page (ultra-refined)", completed: false },
        { id: "pages-3", title: "Create Companies List page", completed: false },
        { id: "pages-4", title: "Create Company Detail page", completed: false },
        { id: "pages-5", title: "Create Deals Pipeline (Kanban)", completed: false },
        { id: "pages-6", title: "Create Deal Detail page", completed: false },
        { id: "pages-7", title: "Create Distributors page", completed: false },
        { id: "pages-8", title: "Create Vendors page", completed: false },
        { id: "pages-9", title: "Create Raw Data Pool page", completed: false },
      ]
    },
    {
      id: "intelligence",
      title: "Step 7: Intelligence Pages",
      description: "Build Intelligence Graph, Predictions, and Agents pages",
      expanded: false,
      tasks: [
        { id: "intel-1", title: "Create Graph Explorer page", completed: false },
        { id: "intel-2", title: "Create Predictions Dashboard", completed: false },
        { id: "intel-3", title: "Create Prescriptions page", completed: false },
        { id: "intel-4", title: "Create Agents Dashboard", completed: false },
        { id: "intel-5", title: "Create Competitors Tracking page", completed: false },
        { id: "intel-6", title: "Create Competitive Alerts page", completed: false },
      ]
    },
    {
      id: "navigation",
      title: "Step 8: Navigation Updates",
      description: "Update menu and register all routes",
      expanded: false,
      tasks: [
        { id: "nav-1", title: "Update DashboardLayout with CRM section", completed: false },
        { id: "nav-2", title: "Add Intelligence section to menu", completed: false },
        { id: "nav-3", title: "Register all routes in App.tsx", completed: false },
        { id: "nav-4", title: "Test all navigation links", completed: false },
      ]
    },
    {
      id: "ai-commands",
      title: "Step 9: AI Command Layer",
      description: "Enable AI control via text, voice, and image",
      expanded: false,
      tasks: [
        { id: "ai-1", title: "Create AI command parser service", completed: false },
        { id: "ai-2", title: "Map all features to AI commands", completed: false },
        { id: "ai-3", title: "Enable text commands", completed: false },
        { id: "ai-4", title: "Enable voice commands (speech-to-text)", completed: false },
        { id: "ai-5", title: "Enable image commands (OCR + AI)", completed: false },
        { id: "ai-6", title: "Add command history", completed: false },
      ]
    },
  ]);

  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const toggleSection = (sectionId: string) => {
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, expanded: !section.expanded }
        : section
    ));
  };

  const toggleTask = (sectionId: string, taskId: string) => {
    setSections(sections.map(section => 
      section.id === sectionId
        ? {
            ...section,
            tasks: section.tasks.map(task =>
              task.id === taskId
                ? { ...task, completed: !task.completed }
                : task
            )
          }
        : section
    ));
  };

  const startEditComment = (taskId: string, currentComment?: string) => {
    setEditingComment(taskId);
    setCommentText(currentComment || "");
  };

  const saveComment = (sectionId: string, taskId: string) => {
    setSections(sections.map(section => 
      section.id === sectionId
        ? {
            ...section,
            tasks: section.tasks.map(task =>
              task.id === taskId
                ? { ...task, comment: commentText }
                : task
            )
          }
        : section
    ));
    setEditingComment(null);
    setCommentText("");
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setCommentText("");
  };

  const calculateProgress = () => {
    const totalTasks = sections.reduce((sum, section) => sum + section.tasks.length, 0);
    const completedTasks = sections.reduce(
      (sum, section) => sum + section.tasks.filter(t => t.completed).length, 
      0
    );
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const progress = calculateProgress();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Implementation Progress</CardTitle>
            <CardDescription>
              Track all features, check off completed items, and add notes
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {progress}% Complete
            </Badge>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-3 mt-4">
          <div 
            className="bg-primary h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section) => {
          const sectionProgress = section.tasks.filter(t => t.completed).length;
          const sectionTotal = section.tasks.length;
          const sectionPercent = Math.round((sectionProgress / sectionTotal) * 100);

          return (
            <Card key={section.id} className="border-2">
              <CardHeader className="pb-3">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {section.expanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={sectionPercent === 100 ? "default" : "secondary"}
                    className="ml-4"
                  >
                    {sectionProgress}/{sectionTotal} ({sectionPercent}%)
                  </Badge>
                </div>
              </CardHeader>
              
              {section.expanded && (
                <CardContent className="space-y-2 pt-0">
                  {section.tasks.map((task) => (
                    <div key={task.id} className="space-y-2">
                      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(section.id, task.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {task.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                              {task.title}
                            </span>
                          </div>
                          {task.comment && editingComment !== task.id && (
                            <div className="mt-2 p-2 bg-muted rounded text-sm flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <span className="flex-1">{task.comment}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => startEditComment(task.id, task.comment)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {editingComment === task.id && (
                            <div className="mt-2 space-y-2">
                              <Textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Add a comment or note..."
                                className="min-h-[80px]"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveComment(section.id, task.id)}
                                >
                                  <Save className="h-3 w-3 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEdit}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        {!task.comment && editingComment !== task.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => startEditComment(task.id)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
