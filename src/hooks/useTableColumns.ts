import { useState, useEffect, useCallback } from 'react';

export interface ColumnDef {
  id: string;
  label: string;
  initialWidth: number;
  isPinned?: boolean;
  pinPosition?: 'left' | 'right';
  minWidth?: number;
  currentWidth?: number;
}

export function useTableColumns(tableId: string, defaultColumns: ColumnDef[]) {
  const [columns, setColumns] = useState<ColumnDef[]>([]);

  const defaultColsStr = JSON.stringify(defaultColumns);

  useEffect(() => {
    // Load from localStorage
    const savedStateStr = localStorage.getItem(`vcomm_table_width_${tableId}`);
    let savedState: Record<string, number> = {};
    if (savedStateStr) {
      try {
        savedState = JSON.parse(savedStateStr);
      } catch (e) {
        console.error('Failed to parse table widths', e);
      }
    }

    const mergedColumns = defaultColumns.map(col => ({
      ...col,
      width: savedState[col.id] || col.initialWidth,
      currentWidth: savedState[col.id] || col.initialWidth
    }));

    setColumns(mergedColumns);
  }, [tableId, defaultColsStr]);

  const handleResize = useCallback((columnId: string, newWidth: number) => {
    setColumns(prev => {
      const updated = prev.map(col => 
        col.id === columnId ? { ...col, currentWidth: newWidth } : col
      );
      
      // Save to local storage
      const stateToSave = updated.reduce((acc, col) => {
        acc[col.id] = col.currentWidth;
        return acc;
      }, {} as Record<string, number>);
      
      localStorage.setItem(`vcomm_table_width_${tableId}`, JSON.stringify(stateToSave));
      return updated;
    });
  }, [tableId]);

  // Calculate left offsets for pinned columns
  const getPinOffset = useCallback((columnId: string) => {
    const colIndex = columns.findIndex(c => c.id === columnId);
    if (colIndex === -1 || !columns[colIndex].isPinned) return undefined;

    let offset = 0;
    for (let i = 0; i < colIndex; i++) {
      if (columns[i].isPinned) {
        offset += columns[i].currentWidth as number;
      }
    }
    return offset;
  }, [columns]);

  return { columns, handleResize, getPinOffset };
}
