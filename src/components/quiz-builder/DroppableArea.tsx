"use client";

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useQuizStore } from '@/store/useQuizStore';
import { SectionType } from '@/types';
import { Layout, ArrowDown, AlignJustify } from 'lucide-react';

interface DroppableAreaProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  sectionId?: SectionType;
  style?: React.CSSProperties;
}

export function DroppableArea({ id, children, className = '', sectionId, style = {} }: DroppableAreaProps) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const { selectedSectionId, selectSection, quiz } = useQuizStore();
  const isSelected = selectedSectionId === sectionId;
  const [isHovered, setIsHovered] = useState(false);
  
  // Get the current section's layout and styles if this is a section
  const currentScreen = quiz.screens[quiz.currentScreenIndex];
  const section = sectionId ? currentScreen.sections[sectionId] : null;
  const sectionLayout = section?.layout;
  const sectionStyles = section?.styles || {};
  
  const handleSectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sectionId) {
      selectSection(sectionId);
    }
  };
  
  // Combine user styles with section styles
  const combinedStyles: React.CSSProperties = { 
    ...style,
    boxSizing: 'border-box',
    backgroundColor: sectionStyles.backgroundColor || '',
    padding: sectionStyles.padding || '',
    margin: sectionStyles.margin || '',
    border: sectionStyles.border !== 'none' ? sectionStyles.border : '',
    borderRadius: sectionStyles.borderRadius || '',
  };
  
  // Add overflow auto to body section
  if (sectionId === 'body') {
    combinedStyles.overflow = 'auto';
    combinedStyles.height = '100%';
    combinedStyles.display = 'flex';
    combinedStyles.flexDirection = 'column';
  }
  
  // Generate layout styles based on the section's flexbox configuration
  const layoutStyles: React.CSSProperties = {
    boxSizing: 'border-box',
  };
  
  if (sectionLayout) {
    // Apply flexbox layout styles
    layoutStyles.display = 'flex';
    layoutStyles.flexDirection = sectionLayout.direction;
    layoutStyles.flexWrap = sectionLayout.wrap;
    layoutStyles.justifyContent = sectionLayout.justifyContent;
    layoutStyles.alignItems = sectionLayout.alignItems;
    layoutStyles.alignContent = sectionLayout.alignContent;
    layoutStyles.gap = sectionLayout.gap;
    
    // For body section, make sure the content can scroll when needed
    if (sectionId === 'body') {
      layoutStyles.minHeight = 'min-content';
      layoutStyles.flexGrow = 1;
    }
  }
  
  return (
    <div
      ref={setNodeRef}
      className={`
        ${className} 
        ${sectionId ? 'quiz-section relative cursor-pointer' : ''}
        ${isSelected ? 'selected' : ''}
        ${isHovered && !isSelected ? 'hovered' : ''}
        ${isOver ? 'drop-target' : ''}
        ${sectionId === 'body' ? 'flex-1 h-full' : ''}
      `}
      onClick={sectionId ? handleSectionClick : undefined}
      onMouseEnter={() => sectionId && setIsHovered(true)}
      onMouseLeave={() => sectionId && setIsHovered(false)}
      data-section-id={sectionId}
      style={combinedStyles}
    >
      {/* Only keep drop indicator, remove section label and arrows */}
      {sectionId && isOver && (
        <div className="absolute inset-0 pointer-events-none bg-primary/10 z-0 flex items-center justify-center">
          <div className="text-primary font-medium text-sm bg-white/80 px-3 py-1 rounded-full shadow-sm">
            Drop here
          </div>
        </div>
      )}
      
      <div style={layoutStyles} className={`h-full ${sectionId === 'body' ? 'overflow-visible min-h-0' : ''}`}>
        {children}
      </div>
    </div>
  );
} 