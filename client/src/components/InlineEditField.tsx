import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface InlineEditFieldProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  label?: string;
  type?: 'text' | 'email' | 'tel' | 'number';
  className?: string;
  editable?: boolean;
  prefix?: string; // For currency symbols like '$'
}

const InlineEditField: React.FC<InlineEditFieldProps> = ({
  value,
  onSave,
  label,
  type = 'text',
  className = '',
  editable = true,
  prefix,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    // Update editValue when value prop changes (after successful save)
    setEditValue(value);
  }, [value]);

  const validateInput = (value: string): { valid: boolean; error?: string } => {
    // Allow empty values
    if (!value || value.trim() === '') {
      return { valid: true };
    }

    switch (type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return { valid: false, error: 'Please enter a valid email address' };
        }
        break;
      
      case 'tel':
        // Remove common phone formatting characters
        const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
        // Check if it contains only digits and is reasonable length (7-15 digits)
        if (!/^\d{7,15}$/.test(cleanPhone)) {
          return { valid: false, error: 'Please enter a valid phone number (7-15 digits)' };
        }
        break;
      
      case 'number':
        const num = parseFloat(value);
        if (isNaN(num)) {
          return { valid: false, error: 'Please enter a valid number' };
        }
        if (num < 0) {
          return { valid: false, error: 'Please enter a positive number' };
        }
        break;
    }

    return { valid: true };
  };

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    // Validate input
    const validation = validateInput(editValue);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid input');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
      
      // Show success animation
      setShowSuccess(true);
      toast.success(`${label || 'Field'} updated successfully`);
      
      // Hide success indicator after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error(`Failed to update ${label || 'field'}. Please try again.`);
      setEditValue(value); // Revert on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!editable) {
    return <span className={className}>{value}</span>;
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
        {prefix && <span className="text-sm">{prefix}</span>}
        <input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          disabled={isSaving}
          step={type === 'number' ? '0.01' : undefined}
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-3 w-3 text-blue-600 animate-spin" />
          ) : (
            <Check className="h-3 w-3 text-green-600" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    );
  }

  const displayValue = value ?? '';
  const isEmpty = !displayValue || displayValue.trim() === '' || displayValue === 'N/A';

  return (
    <div className="flex items-center gap-1 group">
      <span className={`${className} ${isEmpty ? 'text-muted-foreground italic' : ''}`}>
        {displayValue || 'Click to add'}
      </span>
      
      {/* Success indicator */}
      {showSuccess && (
        <CheckCircle2 className="h-3 w-3 text-green-600 animate-in zoom-in duration-300" />
      )}
      
      {/* Edit button */}
      {!showSuccess && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
          title={`Edit ${label || 'field'}`}
        >
          <Edit2 className="h-3 w-3 text-gray-500" />
        </button>
      )}
    </div>
  );
};

export default InlineEditField;
