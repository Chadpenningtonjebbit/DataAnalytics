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
  isCollapsed?: boolean;
}

export function ResizablePanel({
  children,
  defaultSize,
  minSize = 200,
  maxSize = 500,
  side,
  className,
  onResize,
  isCollapsed = false
}: ResizablePanelProps) {
  const [size, setSize] = useState(defaultSize);
  const [prevSize, setPrevSize] = useState(defaultSize); // Store previous size for when uncollapsing
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
        setPrevSize(parsedSize);
      }
    }
  }, [storageKey, minSize, maxSize]);
  
  // Save size when it changes (but not when collapsed)
  useEffect(() => {
    if (!isCollapsed) {
      localStorage.setItem(storageKey, size.toString());
    }
  }, [size, storageKey, isCollapsed]);
  
  // Handle collapse state changes
  useEffect(() => {
    if (isCollapsed) {
      // Store current size before collapsing
      setPrevSize(size);
    } else {
      // Restore previous size when uncollapsing
      setSize(prevSize);
    }
  }, [isCollapsed]);
  
  const handleResize = (delta: number) => {
    // Don't allow resize when collapsed
    if (isCollapsed) return;
    
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
  
  // Calculate actual width based on collapsed state
  const actualWidth = isCollapsed ? 52 : size;
  
  return (
    <div 
      ref={panelRef}
      className={cn(
        'h-full flex-shrink-0 relative',
        className
      )}
      style={{ width: `${actualWidth}px` }}
    >
      {children}
      {!isCollapsed && (
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
      )}
    </div>
  );
} 