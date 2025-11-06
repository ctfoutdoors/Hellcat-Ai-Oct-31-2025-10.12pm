import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { GripVertical, Trash2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface Column {
  id: string;
  label: string;
  visible: boolean;
  sortable?: boolean;
  width?: number;
}

interface ColumnCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: Column[];
  onColumnsChange: (columns: Column[]) => void;
  onReset: () => void;
}

export function ColumnCustomizer({
  open,
  onOpenChange,
  columns,
  onColumnsChange,
  onReset,
}: ColumnCustomizerProps) {
  const [localColumns, setLocalColumns] = useState<Column[]>(columns);

  const handleToggleColumn = (columnId: string) => {
    setLocalColumns(
      localColumns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleRemoveColumn = (columnId: string) => {
    setLocalColumns(
      localColumns.map((col) =>
        col.id === columnId ? { ...col, visible: false } : col
      )
    );
  };

  const handleSave = () => {
    onColumnsChange(localColumns);
    onOpenChange(false);
    toast.success("Column preferences saved");
  };

  const handleReset = () => {
    onReset();
    setLocalColumns(columns);
    toast.success("Columns reset to default");
  };

  const visibleColumns = localColumns.filter((col) => col.visible);
  const hiddenColumns = localColumns.filter((col) => !col.visible);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Customize Columns</DialogTitle>
          <DialogDescription>
            Show, hide, and reorder columns to customize your view
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Visible Columns */}
          <div>
            <h3 className="font-semibold mb-3">Visible Columns</h3>
            <div className="space-y-2">
              {visibleColumns.map((column) => (
                <div
                  key={column.id}
                  className="flex items-center gap-2 p-2 border rounded hover:bg-accent"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <Checkbox
                    checked={column.visible}
                    onCheckedChange={() => handleToggleColumn(column.id)}
                  />
                  <Label className="flex-1 cursor-pointer">
                    {column.label}
                  </Label>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveColumn(column.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Hidden Columns */}
          {hiddenColumns.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Hidden Columns</h3>
              <div className="space-y-2">
                {hiddenColumns.map((column) => (
                  <div
                    key={column.id}
                    className="flex items-center gap-2 p-2 border rounded hover:bg-accent opacity-60"
                  >
                    <Checkbox
                      checked={column.visible}
                      onCheckedChange={() => handleToggleColumn(column.id)}
                    />
                    <Label className="flex-1 cursor-pointer">
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
