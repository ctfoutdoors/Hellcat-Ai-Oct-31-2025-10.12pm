import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calendar, User, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionPriority = "urgent" | "high" | "medium" | "low";

export interface NextAction {
  id: number;
  title: string;
  priority: ActionPriority;
  description: string;
  dueDate: Date;
  linkedEntityType?: string;
  linkedEntityId?: number;
  assignedUserId?: number;
  assignedUserName?: string;
  completed: boolean;
}

interface NextActionsProps {
  entityType: "vendor" | "customer" | "partner" | "manufacturer";
  entityId: number;
  actions: NextAction[];
  onAddAction?: () => void;
  onEditAction?: (actionId: number) => void;
  onDeleteAction?: (actionId: number) => void;
  className?: string;
}

export function NextActions({
  entityType,
  entityId,
  actions,
  onAddAction,
  onEditAction,
  onDeleteAction,
  className,
}: NextActionsProps) {
  const getPriorityColor = (priority: ActionPriority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/20 text-red-300 border-red-500/50";
      case "high":
        return "bg-orange-500/20 text-orange-300 border-orange-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
      case "low":
        return "bg-blue-500/20 text-blue-300 border-blue-500/50";
    }
  };

  const getPriorityIcon = (priority: ActionPriority) => {
    if (priority === "urgent" || priority === "high") {
      return <AlertCircle className="h-3 w-3" />;
    }
    return null;
  };

  const isOverdue = (dueDate: Date) => {
    return new Date(dueDate) < new Date();
  };

  const sortedActions = [...actions].sort((a, b) => {
    // Sort by: completed status, priority, due date
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <Card className={cn("bg-slate-900 border-slate-700", className)}>
      <CardHeader className="bg-gradient-to-r from-purple-600/20 to-blue-600/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-white">
            Next Actions
          </CardTitle>
          {onAddAction && (
            <Button
              size="sm"
              onClick={onAddAction}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Action
            </Button>
          )}
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Pending Tasks & Follow-ups
        </p>
      </CardHeader>

      <CardContent className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
        {sortedActions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-slate-400 mb-2">No pending actions</p>
            <p className="text-sm text-slate-500">
              Create a new action to get started
            </p>
          </div>
        ) : (
          sortedActions.map((action) => (
            <Card
              key={action.id}
              className={cn(
                "bg-slate-800/50 border-slate-700 transition-all hover:bg-slate-800",
                action.completed && "opacity-60"
              )}
            >
              <CardContent className="p-4">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn(
                        "font-semibold text-white",
                        action.completed && "line-through text-slate-500"
                      )}>
                        {action.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", getPriorityColor(action.priority))}
                      >
                        <span className="flex items-center gap-1">
                          {getPriorityIcon(action.priority)}
                          {action.priority}
                        </span>
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {onEditAction && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditAction(action.id)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {onDeleteAction && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteAction(action.id)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Description */}
                {action.description && (
                  <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                    {action.description}
                  </p>
                )}

                {/* Metadata Row */}
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  {/* Due Date */}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className={cn(
                      isOverdue(action.dueDate) && !action.completed && "text-red-400 font-semibold"
                    )}>
                      {new Date(action.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                      {isOverdue(action.dueDate) && !action.completed && " (Overdue)"}
                    </span>
                  </div>

                  {/* Assigned User */}
                  {action.assignedUserName && (
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span>{action.assignedUserName}</span>
                    </div>
                  )}

                  {/* Linked Entity */}
                  {action.linkedEntityType && action.linkedEntityType !== entityType && (
                    <Badge variant="outline" className="text-xs bg-slate-700/50 text-slate-300 border-slate-600">
                      {action.linkedEntityType}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
}
