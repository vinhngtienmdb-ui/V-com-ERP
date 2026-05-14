import React, { useState, useEffect, useMemo } from 'react';
// @ts-ignore
import { Responsive as ResponsiveGridLayoutNative, useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { cn } from "../../lib/utils";
import { GripHorizontal, Save, RotateCcw } from "lucide-react";

export function DraggableGrid({ 
  children, 
  columns = 4, 
  rowHeight = 120, 
  gap = 24,
  className = "",
  id
}: { 
  children: React.ReactNode, 
  columns?: number, 
  rowHeight?: number, 
  gap?: number,
  className?: string,
  id?: string
}) {
  const { width, containerRef } = useContainerWidth();
  const [layouts, setLayouts] = useState<any>({ lg: [] });
  const [originalLayouts, setOriginalLayouts] = useState<any>({ lg: [] });
  const [isDirty, setIsDirty] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const items = React.Children.toArray(children).filter(React.isValidElement);
  const itemKeys = useMemo(() => items.map((c: any) => c.key).join(','), [items]);
  
  const gridId = id || useMemo(() => {
    const strToHash = className + itemKeys;
    let hash = 0;
    for (let i = 0; i < strToHash.length; i++) {
        hash = Math.imul(31, hash) + strToHash.charCodeAt(i) | 0;
    }
    return `grid-${Math.abs(hash)}`;
  }, [className, itemKeys]);

  useEffect(() => {
    const defaultLayout = items.map((child: any, i: number) => {
      let w = 1;
      let h = 2; // Default height

      if (child.props.className) {
        const spanMatch = child.props.className.match(/col-span-(\d+)/);
        if (spanMatch) w = parseInt(spanMatch[1], 10);
        
        if (child.props.className.includes("h-full") || child.props.className.includes("min-h-")) {
            h = 3;
        }
      }
      if (child.props['data-col-span']) w = parseInt(child.props['data-col-span'], 10);
      if (child.props['data-row-span']) h = parseInt(child.props['data-row-span'], 10);

      w = Math.min(w, columns);

      return {
        i: child.key || `item-${i}`,
        x: (i * w) % columns,
        y: Math.floor((i * w) / columns) * h,
        w: w,
        h: h,
        minW: 1,
        minH: 1
      };
    });

    let currentLayouts: any = { lg: defaultLayout };

    try {
      const savedPath = window.location.pathname;
      const savedKey = `rgl-${savedPath}-${gridId}`;
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.lg) {
          // Merge saved layout with default layout to handle dynamic additions/removals
          const mergedLg = defaultLayout.map(defaultItem => {
             const savedItem = parsed.lg.find((p: any) => p.i === defaultItem.i);
             return savedItem ? { ...defaultItem, x: savedItem.x, y: savedItem.y, w: savedItem.w, h: savedItem.h } : defaultItem;
          });
          currentLayouts = { ...parsed, lg: mergedLg };
        }
      }
    } catch(e) {}

    setLayouts(currentLayouts);
    setOriginalLayouts(JSON.parse(JSON.stringify(currentLayouts)));
    setIsLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridId, columns]); 

  const handleLayoutChange = (currentLayout: any[], allLayouts: any) => {
    if (!isLoaded) return;
    
    // Clean up layouts to only store necessary properties for deep comparison
    const optimize = (layoutsObj: any) => {
        const res: any = {};
        if (!layoutsObj) return res;
        for (const bp in layoutsObj) {
            if (!layoutsObj[bp]) continue;
            res[bp] = layoutsObj[bp].map((item: any) => ({i: String(item.i), x: item.x, y: item.y, w: item.w, h: item.h}));
        }
        return res;
    };

    const currentOptimized = optimize(allLayouts);
    const originalOptimized = optimize(originalLayouts);
    
    const hasChanged = JSON.stringify(currentOptimized) !== JSON.stringify(originalOptimized);
    setLayouts(allLayouts);
    setIsDirty(hasChanged);
  };

  const handleSave = () => {
    try {
      const savedPath = window.location.pathname;
      const savedKey = `rgl-${savedPath}-${gridId}`;
      localStorage.setItem(savedKey, JSON.stringify(layouts));
      setOriginalLayouts(JSON.parse(JSON.stringify(layouts))); // Deep clone to prevent reference issues
      setIsDirty(false);
    } catch(e) {}
  };

  const handleCancel = () => {
    setLayouts(JSON.parse(JSON.stringify(originalLayouts)));
    setIsDirty(false);
  };

  return (
    <div ref={containerRef} className={cn("w-full relative", className, isDirty && "pb-16")}>
      {isLoaded && width > 0 && (
        <ResponsiveGridLayoutNative
          width={width || 1200}
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: columns, md: Math.max(1, columns - 1), sm: 2, xs: 1, xxs: 1 }}
          rowHeight={rowHeight}
          margin={[gap, gap]}
          {...({draggableHandle: ".custom-drag-handle"} as any)}
          onLayoutChange={handleLayoutChange}
          isResizable={true}
          isDraggable={true}
        >
          {items.map((child: any, i: number) => {
            return (
              <div key={child.key || `item-${i}`} className="h-full relative group">
                 <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 cursor-move custom-drag-handle p-1.5 bg-slate-900/80 backdrop-blur-sm text-white rounded-md shadow-sm border border-slate-700">
                    <GripHorizontal className="w-4 h-4" />
                 </div>
                 <div className="h-full w-full overflow-hidden [&>div]:h-full [&>div]:w-full">
                    {child}
                 </div>
              </div>
            );
          })}
        </ResponsiveGridLayoutNative>
      )}

      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] bg-slate-900/95 backdrop-blur-md rounded-full px-6 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-700/50 flex items-center gap-4 animate-in slide-in-from-bottom-5">
           <p className="text-[#FAF9F5] text-sm font-semibold tracking-wide m-0">
             Giao diện đã thay đổi
           </p>
           <div className="flex items-center gap-2">
             <button
               onClick={handleCancel}
               className="px-4 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-xs font-bold flex items-center gap-2 m-0"
             >
               <RotateCcw className="w-3.5 h-3.5" /> Hủy
             </button>
             <button
               onClick={handleSave}
               className="px-4 py-1.5 rounded-full bg-primary-600 text-[#FAF9F5] hover:bg-primary-500 transition-all shadow-sm shadow-primary-500/20 text-xs font-bold flex items-center gap-2 m-0"
             >
               <Save className="w-3.5 h-3.5" /> Lưu giao diện
             </button>
           </div>
        </div>
      )}
    </div>
  );
}
