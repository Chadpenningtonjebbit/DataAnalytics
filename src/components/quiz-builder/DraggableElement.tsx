"use client";

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ElementType, SectionType } from '@/types';

interface DraggableElementProps {
  id: string;
  type: ElementType;
  sectionId: SectionType;
  children: React.ReactNode;
}

export function DraggableElement({ id, type, sectionId, children }: DraggableElementProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: {
      type,
      sectionId,
    },
  });
  
  const style = {
    transform: CSS.Translate.toString(transform),
    ...(isDragging ? { 
      zIndex: 9999,
      position: 'relative' as const,
      pointerEvents: 'none' as const,
    } : {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-move max-w-full overflow-visible ${isDragging ? 'draggable-overlay' : ''}`}
      data-dragging={isDragging ? "true" : "false"}
    >
      {children}
    </div>
  );
} 