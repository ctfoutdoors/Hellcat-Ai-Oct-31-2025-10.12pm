import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Check, X } from "lucide-react";

interface EditableFieldProps {
  label: string;
  value: string | number;
  onSave: (value: string) => Promise<void>;
  type?: "text" | "textarea" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export function EditableField({ 
  label, 
  value, 
  onSave, 
  type = "text",
  options = [],
  placeholder 
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(String(value));
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="group flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-sm text-muted-foreground mb-1">{label}</div>
          <div className="text-foreground">{value || <span className="text-muted-foreground italic">Not set</span>}</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">{label}</div>
      
      {type === "text" && (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
        />
      )}
      
      {type === "textarea" && (
        <Textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={placeholder}
          rows={4}
          autoFocus
        />
      )}
      
      {type === "select" && (
        <Select value={editValue} onValueChange={setEditValue}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Check className="h-4 w-4 mr-1" />
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
