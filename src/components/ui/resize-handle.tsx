"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  className?: string;
}

export function ResizeHandle({ direction, onResize, className }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const startPosition = direction === 'horizontal' ? e.clientX : e.clientY;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentPosition = direction === 'horizontal' ? moveEvent.clientX : moveEvent.clientY;
      const delta = currentPosition - startPosition;
      onResize(delta);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <div
      className={cn(
        'resize-handle',
        direction === 'horizontal' 
          ? 'w-2 cursor-col-resize hover:bg-primary/10 active:bg-primary/20' 
          : 'h-2 cursor-row-resize hover:bg-primary/10 active:bg-primary/20',
        isDragging ? 'bg-primary/20' : 'bg-transparent',
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    />
  );
} 