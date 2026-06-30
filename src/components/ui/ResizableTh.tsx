import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ResizableThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  tableId?: string; // Tương thích ngược
  columnId?: string;
  initialWidth?: number | string;
  
  // Controlled mode props
  width?: number | string;
  onResize?: (newWidth: number) => void;
  isPinned?: boolean;
  pinOffset?: number;
}

export function ResizableTh({ 
  tableId, 
  columnId, 
  initialWidth, 
  width: controlledWidth,
  onResize,
  isPinned,
  pinOffset,
  children, 
  className = '', 
  style,
  ...props 
}: ResizableThProps) {
  const [internalWidth, setInternalWidth] = useState<number | string>(initialWidth || 'auto');
  const thRef = useRef<HTMLTableCellElement>(null);

  // Uncontrolled mode behavior
  useEffect(() => {
    if (controlledWidth === undefined && tableId && columnId) {
      const saved = localStorage.getItem(`table_${tableId}_col_${columnId}`);
      if (saved) {
        setInternalWidth(Number(saved));
      }
    }
  }, [tableId, columnId, controlledWidth]);

  const activeWidth = controlledWidth !== undefined ? controlledWidth : internalWidth;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Ngăn sự kiện sort (nếu có)
    
    const startX = e.pageX;
    const startWidth = thRef.current?.getBoundingClientRect().width || 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(50, startWidth + (moveEvent.pageX - startX));
      if (onResize) {
        onResize(newWidth);
      } else {
        setInternalWidth(newWidth);
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      const finalWidth = Math.max(50, startWidth + (upEvent.pageX - startX));
      if (onResize) {
        onResize(finalWidth);
      } else {
        setInternalWidth(finalWidth);
        if (tableId && columnId) {
          localStorage.setItem(`table_${tableId}_col_${columnId}`, String(finalWidth));
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [tableId, columnId, onResize]);

  // Handle sticky positioning
  const stickyStyle: React.CSSProperties = isPinned ? {
    position: 'sticky',
    left: pinOffset || 0,
    zIndex: 10,
    backgroundColor: 'inherit',
    boxShadow: 'inset -1px 0 0 rgba(0,0,0,0.1)' // border right
  } : {};

  return (
    <th 
      ref={thRef}
      style={{ 
        ...style,
        ...stickyStyle,
        width: typeof activeWidth === 'number' ? `${activeWidth}px` : activeWidth,
        minWidth: typeof activeWidth === 'number' ? `${activeWidth}px` : undefined,
        maxWidth: typeof activeWidth === 'number' ? `${activeWidth}px` : undefined,
      }}
      className={`relative group select-none ${className}`}
      {...props}
    >
      {children}
      <div 
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()} // Prevent sort trigger
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize opacity-0 group-hover:opacity-100 bg-orange-400 hover:bg-orange-600 transition-opacity z-20"
        title="Kéo để thay đổi kích thước"
      />
    </th>
  );
}
