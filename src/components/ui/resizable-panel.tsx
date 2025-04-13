"use client";

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ResizeHandle } from './resize-handle';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultSize: number;
  minSize?: number;
  maxSize?: number;
  side: 'left' | 'right';
  className?: string;
  onResize?: (newSize: number) => void;
}

export function ResizablePanel({
  children,
  defaultSize,
  minSize = 200,
  maxSize = 500,
  side,
  className,
  onResize
}: ResizablePanelProps) {
  const [size, setSize] = useState(defaultSize);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Store the size in localStorage
  const storageKey = `simplebuilder-${side}-panel-size`;
  
  // Load saved size on mount
  useEffect(() => {
    const savedSize = localStorage.getItem(storageKey);
    if (savedSize) {
      const parsedSize = parseInt(savedSize);
      if (!isNaN(parsedSize) && parsedSize >= minSize && parsedSize <= maxSize) {
        setSize(parsedSize);
      }
    }
  }, [storageKey, minSize, maxSize]);
  
  // Save size when it changes
  useEffect(() => {
    localStorage.setItem(storageKey, size.toString());
  }, [size, storageKey]);
  
  const handleResize = (delta: number) => {
    const newSize = side === 'left' 
      ? size + delta 
      : size - delta;
    
    if (newSize >= minSize && newSize <= maxSize) {
      setSize(newSize);
      if (onResize) {
        onResize(newSize);
      }
    }
  };
  
  return (
    <div 
      ref={panelRef}
      className={cn(
        'h-full flex-shrink-0 relative',
        className
      )}
      style={{ width: `${size}px` }}
    >
      {children}
      <div className={cn(
        'absolute top-0 bottom-0 h-full z-10',
        side === 'left' ? 'right-0' : 'left-0'
      )}>
        <ResizeHandle 
          direction="horizontal" 
          onResize={handleResize}
          className={cn(
            'h-full',
            side === 'left' ? '-right-1' : '-left-1'
          )}
        />
      </div>
    </div>
  );
} 