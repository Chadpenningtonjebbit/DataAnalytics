"use client";

import React, { useEffect } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { useQuizStore } from '@/store/useQuizStore';
import { ElementType, SectionType } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { Type, Square, Link as LinkIcon, Image, Boxes } from 'lucide-react';

interface DndProviderProps {
  children: React.ReactNode;
}

export function DndProvider({ children }: DndProviderProps) {
  const { addElement, moveElement } = useQuizStore();
  
  // Configure sensors for mouse and touch
  const mouseSensor = useSensor(MouseSensor, {
    // Require the mouse to move by 5 pixels before activating
    activationConstraint: {
      distance: 5,
    },
  });
  
  const touchSensor = useSensor(TouchSensor, {
    // Press delay of 250ms, with tolerance of 5px of movement
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });
  
  const sensors = useSensors(mouseSensor, touchSensor);
  
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [activeType, setActiveType] = React.useState<ElementType | null>(null);
  const [isFromSidebar, setIsFromSidebar] = React.useState<boolean>(false);
  
  const handleDragStart = (event: DragStartEvent) => {
    // Add a class to the body to indicate dragging state
    document.body.classList.add('dragging');
    
    // Store the active element info
    setActiveId(event.active.id.toString());
    setActiveType(event.active.data.current?.type as ElementType || null);
    
    // Check if this is a template from the sidebar
    setIsFromSidebar(event.active.id.toString().includes('-template'));
    
    // Change cursor to indicate dragging
    document.body.style.cursor = 'grabbing';
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    // Remove the dragging class from the body
    document.body.classList.remove('dragging');
    
    // Clear active element
    setActiveId(null);
    setActiveType(null);
    setIsFromSidebar(false);
    
    // Reset cursor
    document.body.style.cursor = '';
    
    const { active, over } = event;
    
    if (!over) return;
    
    // Check if this is a new element being added to a section
    if (over.id.toString().startsWith('section-')) {
      const sectionId = over.id.toString().replace('section-', '') as SectionType;
      const type = active.data.current?.type as ElementType;
      const isFromSidebar = active.id.toString().includes('-template');
      
      // If this is a new element from the sidebar (has -template in the ID)
      if (type && isFromSidebar) {
        addElement(type, sectionId);
      } 
      // If this is an existing element being moved between sections
      else if (active.data.current?.sectionId) {
        const elementId = active.id.toString();
        const sourceSectionId = active.data.current.sectionId as SectionType;
        
        // Only move if the target section is different from the source section
        if (sourceSectionId !== sectionId) {
          console.log(`Moving element ${elementId} from ${sourceSectionId} to ${sectionId}`);
          moveElement(elementId, sectionId);
        }
      }
    }
  };
  
  // Get icon for element type
  const getElementIcon = (type: ElementType | null) => {
    switch (type) {
      case 'text':
        return <Type className="h-4 w-4" />;
      case 'button':
        return <Square className="h-4 w-4" />;
      case 'link':
        return <LinkIcon className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'product':
        return <Boxes className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  // Add CSS to handle dragging state
  useEffect(() => {
    // Add a style tag to the document head
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      /* Make sure the dragged element is visible */
      body.dragging .left-sidebar,
      body.dragging .left-sidebar *,
      body.dragging [data-dragging="true"],
      body.dragging [data-dragging="true"] * {
        overflow: visible !important;
      }
      
      /* Ensure the dragged element is on top */
      body.dragging [data-dragging="true"] {
        z-index: 9999 !important;
        position: relative !important;
        pointer-events: none !important;
      }
      
      /* Set cursor for dragging */
      body.dragging {
        cursor: grabbing !important;
      }
      
      /* Ensure the DndOverlay is visible */
      .dnd-kit-overlay {
        z-index: 9999 !important;
        overflow: visible !important;
      }
    `;
    document.head.appendChild(styleTag);
    
    return () => {
      // Clean up the style tag when the component unmounts
      if (styleTag.parentNode) {
        styleTag.parentNode.removeChild(styleTag);
      }
    };
  }, []);
  
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      
      <DragOverlay className="z-[9999] overflow-visible" style={{ zIndex: 9999, overflow: 'visible' }}>
        {activeId && activeType && isFromSidebar && (
          <div className="opacity-80 pointer-events-none">
            <Card>
              <CardContent className="p-2 flex flex-col items-center justify-center text-center">
                {getElementIcon(activeType)}
                <span className="text-xs mt-1">{activeType}</span>
              </CardContent>
            </Card>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
} 