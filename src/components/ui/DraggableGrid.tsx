import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Responsive as ResponsiveGridLayoutNative, useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { cn } from "../../lib/utils";
import { GripHorizontal } from "lucide-react";

export function DraggableGrid({ 
  children, 
  columns = 4, 
  rowHeight = 120, 
  gap = 24,
  className = ""
}: { 
  children: React.ReactNode, 
  columns?: number, 
  rowHeight?: number, 
  gap?: number,
  className?: string
}) {
  const { width, containerRef } = useContainerWidth();
  const [layout, setLayout] = useState<any[]>([]);

  useEffect(() => {
    const items = React.Children.toArray(children).filter(React.isValidElement);
    const newLayout = items.map((child: any, i: number) => {
      let w = 1;
      let h = 2; // Default height

      // Extract col-span from className
      if (child.props.className) {
        const spanMatch = child.props.className.match(/col-span-(\\d+)/);
        if (spanMatch) w = parseInt(spanMatch[1], 10);
        
        // Approximate height based on content or classes if possible
        if (child.props.className.includes("h-full") || child.props.className.includes("min-h-")) {
            h = 3;
        }
      }
      // Or use explicit data attributes if provided
      if (child.props['data-col-span']) w = parseInt(child.props['data-col-span'], 10);
      if (child.props['data-row-span']) h = parseInt(child.props['data-row-span'], 10);

      // Ensure w doesn't exceed max columns
      w = Math.min(w, columns);

      return {
        i: child.key || `item-\${i}`,
        x: (i * w) % columns, // Rough calculation, RGL will pack it
        y: Math.floor((i * w) / columns) * h,
        w: w,
        h: h,
        minW: 1,
        minH: 1
      };
    });
    setLayout(newLayout);
  }, [children, columns]);

  return (
    <div ref={containerRef} className={cn("w-full relative", className)}>
      <ResponsiveGridLayoutNative
        width={width || 1200}
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: columns, md: Math.max(1, columns - 1), sm: 2, xs: 1, xxs: 1 }}
        rowHeight={rowHeight}
        margin={[gap, gap]}
        {...({draggableHandle: ".custom-drag-handle"} as any)}
        onLayoutChange={(l: any[]) => setLayout(l)}
        isResizable={true}
        isDraggable={true}
      >
        {React.Children.map(children, (child: any, i: number) => {
          if (!React.isValidElement(child)) return child;
          
          return (
            <div key={child.key || `item-\${i}`} className="h-full relative group">
               {/* Custom Drag Handle */}
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 cursor-move custom-drag-handle p-1.5 bg-slate-900/80 backdrop-blur-sm text-white rounded-md shadow-sm">
                  <GripHorizontal className="w-4 h-4" />
               </div>
               <div className="h-full w-full overflow-hidden [&>div]:h-full [&>div]:w-full">
                  {child}
               </div>
            </div>
          );
        })}
      </ResponsiveGridLayoutNative>
    </div>
  );
}
