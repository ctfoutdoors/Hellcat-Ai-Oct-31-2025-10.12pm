import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Plus, DollarSign, Calendar, Package } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Case card component
function CaseCard({ caseItem, isDragging }: { caseItem: any; isDragging?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: caseItem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getCarrierColor = (carrier: string) => {
    const colors: Record<string, string> = {
      FEDEX: 'bg-purple-100 text-purple-800',
      UPS: 'bg-yellow-100 text-yellow-800',
      USPS: 'bg-blue-100 text-blue-800',
      DHL: 'bg-red-100 text-red-800',
    };
    return colors[carrier] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      HIGH: 'bg-red-100 text-red-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-3"
    >
      <Card className="cursor-move hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="font-semibold text-sm mb-1">
                {caseItem.trackingNumber || `Case #${caseItem.id}`}
              </div>
              <div className="text-xs text-muted-foreground line-clamp-2">
                {caseItem.issueType || 'No description'}
              </div>
            </div>
            <Badge className={`text-xs ${getPriorityColor(caseItem.priority || 'LOW')}`}>
              {caseItem.priority || 'LOW'}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className={getCarrierColor(caseItem.carrier)}>
              {caseItem.carrier}
            </Badge>
            {caseItem.claimedAmount && (
              <div className="flex items-center text-muted-foreground">
                <DollarSign className="h-3 w-3 mr-1" />
                ${caseItem.claimedAmount.toFixed(2)}
              </div>
            )}
          </div>

          {caseItem.filedDate && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(caseItem.filedDate).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Kanban column component
function KanbanColumn({ title, status, cases, count }: {
  title: string;
  status: string;
  cases: any[];
  count: number;
}) {
  const caseIds = useMemo(() => cases.map(c => c.id), [cases]);

  const getColumnColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'border-gray-300',
      FILED: 'border-blue-300',
      AWAITING_RESPONSE: 'border-yellow-300',
      RESOLVED: 'border-green-300',
      DENIED: 'border-red-300',
      APPEALING: 'border-purple-300',
    };
    return colors[status] || 'border-gray-300';
  };

  return (
    <div className={`flex-shrink-0 w-80 border-t-4 ${getColumnColor(status)}`}>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <Badge variant="secondary">{count}</Badge>
          </div>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-250px)] overflow-y-auto">
          <SortableContext items={caseIds} strategy={verticalListSortingStrategy}>
            {cases.length > 0 ? (
              cases.map((caseItem) => (
                <CaseCard key={caseItem.id} caseItem={caseItem} />
              ))
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">
                No cases
              </div>
            )}
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
}

export default function KanbanBoard() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [filterCarrier, setFilterCarrier] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  const utils = trpc.useUtils();

  // Fetch all cases
  const { data: allCases, isLoading } = trpc.cases.list.useQuery({});

  // Update case status mutation
  const updateStatusMutation = trpc.cases.update.useMutation({
    onSuccess: () => {
      toast.success('Case status updated');
      utils.cases.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update case: ${error.message}`);
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Define Kanban columns
  const columns = [
    { id: 'DRAFT', title: 'Draft', status: 'DRAFT' },
    { id: 'FILED', title: 'Filed', status: 'FILED' },
    { id: 'AWAITING_RESPONSE', title: 'Awaiting Response', status: 'AWAITING_RESPONSE' },
    { id: 'RESOLVED', title: 'Resolved', status: 'RESOLVED' },
    { id: 'DENIED', title: 'Denied', status: 'DENIED' },
    { id: 'APPEALING', title: 'Appealing', status: 'APPEALING' },
  ];

  // Filter and group cases by status
  const filteredCases = useMemo(() => {
    if (!allCases) return [];

    return allCases.filter((c: any) => {
      if (filterCarrier !== 'ALL' && c.carrier !== filterCarrier) return false;
      if (filterPriority !== 'ALL' && c.priority !== filterPriority) return false;
      return true;
    });
  }, [allCases, filterCarrier, filterPriority]);

  const groupedCases = useMemo(() => {
    const groups: Record<string, any[]> = {};
    columns.forEach(col => {
      groups[col.status] = [];
    });

    filteredCases.forEach((caseItem: any) => {
      const status = caseItem.status || 'DRAFT';
      if (groups[status]) {
        groups[status].push(caseItem);
      }
    });

    return groups;
  }, [filteredCases, columns]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const caseId = active.id as number;
    const targetStatus = over.id as string;

    // Find the case being dragged
    const draggedCase = filteredCases.find((c: any) => c.id === caseId);

    if (draggedCase && draggedCase.status !== targetStatus) {
      // Update case status
      updateStatusMutation.mutate({
        id: caseId,
        status: targetStatus,
      });
    }

    setActiveId(null);
  };

  const activeCase = activeId ? filteredCases.find((c: any) => c.id === activeId) : null;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Case Board</h1>
            <p className="text-sm text-muted-foreground">Drag and drop cases to update status</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterCarrier}
            onChange={(e) => setFilterCarrier(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="ALL">All Carriers</option>
            <option value="FEDEX">FedEx</option>
            <option value="UPS">UPS</option>
            <option value="USPS">USPS</option>
            <option value="DHL">DHL</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <div className="ml-auto text-sm text-muted-foreground">
            {filteredCases.length} cases
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full">
            {columns.map((column) => (
              <SortableContext
                key={column.id}
                id={column.status}
                items={groupedCases[column.status]?.map(c => c.id) || []}
                strategy={verticalListSortingStrategy}
              >
                <KanbanColumn
                  title={column.title}
                  status={column.status}
                  cases={groupedCases[column.status] || []}
                  count={groupedCases[column.status]?.length || 0}
                />
              </SortableContext>
            ))}
          </div>

          <DragOverlay>
            {activeCase ? <CaseCard caseItem={activeCase} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
