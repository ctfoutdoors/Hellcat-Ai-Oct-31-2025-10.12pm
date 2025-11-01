import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface BulkActionSnapshot {
  action: string;
  caseIds: number[];
  previousValues: Map<number, any>;
  timestamp: number;
}

export function useBulkActionUndo() {
  const [undoStack, setUndoStack] = useState<BulkActionSnapshot[]>([]);
  const [isUndoing, setIsUndoing] = useState(false);

  /**
   * Save a snapshot before bulk action
   */
  const saveSnapshot = useCallback((
    action: string,
    caseIds: number[],
    previousValues: Map<number, any>
  ) => {
    const snapshot: BulkActionSnapshot = {
      action,
      caseIds,
      previousValues,
      timestamp: Date.now(),
    };

    setUndoStack(prev => [...prev, snapshot]);

    // Auto-expire snapshots after 5 minutes
    setTimeout(() => {
      setUndoStack(prev => prev.filter(s => s.timestamp !== snapshot.timestamp));
    }, 5 * 60 * 1000);
  }, []);

  /**
   * Undo the last bulk action
   */
  const undo = useCallback(async (
    restoreFunction: (caseId: number, previousValue: any) => Promise<void>
  ) => {
    if (undoStack.length === 0) {
      toast.error('No actions to undo');
      return false;
    }

    const lastSnapshot = undoStack[undoStack.length - 1];
    setIsUndoing(true);

    try {
      // Restore all cases to previous values
      const restorePromises = Array.from(lastSnapshot.previousValues.entries()).map(
        ([caseId, previousValue]) => restoreFunction(caseId, previousValue)
      );

      await Promise.all(restorePromises);

      // Remove snapshot from stack
      setUndoStack(prev => prev.slice(0, -1));

      toast.success(`Undid ${lastSnapshot.action} for ${lastSnapshot.caseIds.length} case(s)`);
      return true;
    } catch (error: any) {
      toast.error(`Failed to undo: ${error.message}`);
      return false;
    } finally {
      setIsUndoing(false);
    }
  }, [undoStack]);

  /**
   * Clear undo history
   */
  const clearHistory = useCallback(() => {
    setUndoStack([]);
  }, []);

  /**
   * Get the last action that can be undone
   */
  const getLastAction = useCallback(() => {
    if (undoStack.length === 0) return null;
    return undoStack[undoStack.length - 1];
  }, [undoStack]);

  return {
    saveSnapshot,
    undo,
    clearHistory,
    getLastAction,
    canUndo: undoStack.length > 0,
    isUndoing,
    undoCount: undoStack.length,
  };
}
