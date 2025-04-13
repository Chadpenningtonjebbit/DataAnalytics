"use client";

import React, { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { QuizElement, SectionType } from '@/types';
import { useQuizStore } from '@/store/useQuizStore';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import { Trash, Copy, Clipboard, Type, Square, Link as LinkIcon, Image, CheckSquare, Radio, ListFilter, AlignLeft, Group, Ungroup, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface ElementRendererProps {
  element: QuizElement;
  isViewMode?: boolean;
  onSelectElement?: (id: string) => void;
}

export function ElementRenderer({ element, isViewMode, onSelectElement }: ElementRendererProps) {
  const { 
    selectedElementIds, 
    selectElement,
    removeElement,
    copySelectedElements,
    pasteElements,
    groupSelectedElements,
    ungroupElements,
    reorderElement,
    quiz
  } = useQuizStore();
  
  // Track hover state
  const [isHovered, setIsHovered] = useState(false);
  
  // Add a lightweight global click handler to clear hover states
  // This helps ensure hover states don't persist when clicking elsewhere
  React.useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Only clear hover if we're not clicking on this element
      const elementNode = document.getElementById(`element-${element.id}`);
      if (elementNode && !elementNode.contains(e.target as Node)) {
        setIsHovered(false);
      }
    };
    
    // Use capture phase to ensure our handler runs before other handlers
    document.addEventListener('click', handleGlobalClick, true);
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [element.id]);
  
  // Check if this element's parent group is selected or if any element in the same group is selected
  const isParentGroupSelected = useMemo(() => {
    if (!element.groupId) return true; // Not in a group, so always interactive
    
    // Check if the parent group is selected
    if (selectedElementIds.includes(element.groupId)) {
      return true;
    }
    
    // Check if any element in the same group is selected
    // This allows selecting multiple elements within the same group
    for (const selectedId of selectedElementIds) {
      // Find the selected element
      for (const screen of quiz.screens) {
        for (const sectionKey of Object.keys(screen.sections) as SectionType[]) {
          const section = screen.sections[sectionKey as keyof typeof screen.sections];
          
          // Check if the selected element is in the same group as this element
          for (const groupEl of section.elements) {
            if (groupEl.isGroup && groupEl.id === element.groupId && groupEl.children) {
              // Check if any child of this group is selected
              const hasSelectedSibling = groupEl.children.some(
                (child: QuizElement) => selectedElementIds.includes(child.id)
              );
              
              if (hasSelectedSibling) {
                return true;
              }
            }
          }
        }
      }
    }
    
    return false;
  }, [element.groupId, selectedElementIds, quiz.screens]);
  
  // Make the element draggable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform
  } = useDraggable({
    id: element.id,
    data: {
      type: 'element',
      element,
    },
    disabled: isViewMode,
  });
  
  // Build the element style
  let style: React.CSSProperties = {};
  
  // Apply transform from drag operation if present
  if (transform) {
    style.transform = CSS.Translate.toString(transform);
  }
  
  // Track percentage dimensions to apply special handling
  let hasPercentWidth = false;
  let hasPercentHeight = false;
  
  // Add element's styles if they exist
  if (element.styles) {
    // Copy styles to our style object
    for (const [key, value] of Object.entries(element.styles)) {
      if (value !== undefined && value !== '') {
        // Track percentage dimensions for special handling
        if (key === 'width' && value.toString().includes('%')) {
          hasPercentWidth = true;
        }
        if (key === 'height' && value.toString().includes('%')) {
          hasPercentHeight = true;
        }
        
        // Type assertion for applying style properties
        (style as any)[key] = value;
      }
    }
  }
  
  // Create data attributes for easier styling with CSS
  let dataAttrs: Record<string, string> = {};
  
  // Add data attributes for percentage dimensions
  if (hasPercentWidth) {
    dataAttrs['data-percent-width'] = 'true';
  }
  if (hasPercentHeight) {
    dataAttrs['data-percent-height'] = 'true'; 
  }
  
  // We'll rely on CSS classes for hover and selection styles
  // instead of inline styles to avoid duplicating borders
  
  // Combine all styles
  const combinedStyle = {
    ...style,
    // Apply element's specific styling directly at top level
    fontFamily: element.styles?.fontFamily,
    fontSize: element.styles?.fontSize,
    fontWeight: element.styles?.fontWeight,
    textAlign: element.styles?.textAlign as any,
    lineHeight: element.styles?.lineHeight,
    backgroundColor: element.styles?.backgroundColor,
    color: element.styles?.color,
    padding: element.styles?.padding,
    border: element.styles?.border,
    borderRadius: element.styles?.borderRadius,
    margin: element.styles?.margin,
    boxSizing: 'border-box' as const,
    // Add zIndex for selected elements to ensure proper layering
    zIndex: selectedElementIds.includes(element.id) ? 30 : undefined
  };
  
  // Handle click with hierarchical selection
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop propagation to prevent section selection
    
    // If this element is in a group and the group is not selected,
    // and this isn't a direct click on this element, select the group instead
    if (element.groupId && !isParentGroupSelected && !e.ctrlKey && !e.shiftKey) {
      selectElement(element.groupId);
      return;
    }
    
    // Allow selecting individual child elements with Ctrl key
    // or shift key (for multiple selection)
    const isMultiSelect = e.shiftKey || (e.ctrlKey && selectedElementIds.includes(element.id));
    selectElement(element.id, isMultiSelect);
  };
  
  const handleDelete = () => {
    if (selectedElementIds.length > 1 && selectedElementIds.includes(element.id)) {
      // Delete all selected elements
      selectedElementIds.forEach(id => removeElement(id));
    } else {
      // Delete just this element
      removeElement(element.id);
    }
  };
  
  const handleCopy = () => {
    // If this element is not in the current selection, select it first
    if (!selectedElementIds.includes(element.id)) {
      selectElement(element.id);
    }
    copySelectedElements();
  };
  
  const handlePaste = () => {
    if (element.isGroup) {
      // If this is a group, paste into the group itself
      pasteElements(element.sectionId, element.id);
    } else {
      // Otherwise, paste into the section
      pasteElements(element.sectionId);
    }
  };
  
  const handleGroup = () => {
    // If this element is not in the current selection, select it first
    if (!selectedElementIds.includes(element.id)) {
      selectElement(element.id, true); // Multi-select
    }
    groupSelectedElements();
  };
  
  const handleUngroup = () => {
    if (element.isGroup) {
      ungroupElements(element.id);
    }
  };
  
  const isSelected = selectedElementIds.includes(element.id);
  
  // Determine if this element should be interactive
  const isInteractive = element.groupId ? isParentGroupSelected : true;
  
  // Create an overlay for group children to prevent interaction until group is selected
  const needsOverlay = element.groupId && !isParentGroupSelected;
  
  // Only show hover state if the element is interactive (parent group is selected or not in a group)
  const showHoverState = isHovered && isInteractive;
  
  // Determine if this element should show reordering controls
  const shouldShowReorderingControls = useMemo(() => {
    // Only show reordering controls if this element is selected
    if (!isSelected) return false;
    
    // If only one element is selected, show controls on that element
    if (selectedElementIds.length === 1) return true;
    
    // If multiple elements are selected, only show controls on the first selected element
    return selectedElementIds[0] === element.id;
  }, [isSelected, selectedElementIds, element.id]);
  
  // Get the appropriate icon for the element type
  const getElementIcon = () => {
    switch (element.type) {
      case 'text': return <Type className="h-3 w-3" />;
      case 'button': return <Square className="h-3 w-3" />;
      case 'link': return <LinkIcon className="h-3 w-3" />;
      case 'image': return <Image className="h-3 w-3" />;
      case 'input': return <Type className="h-3 w-3" />;
      case 'checkbox': return <CheckSquare className="h-3 w-3" />;
      case 'radio': return <Radio className="h-3 w-3" />;
      case 'select': return <ListFilter className="h-3 w-3" />;
      case 'textarea': return <AlignLeft className="h-3 w-3" />;
      case 'group': return <Group className="h-3 w-3" />;
      default: return <Square className="h-3 w-3" />;
    }
  };
  
  // Format element type for display
  const formatElementType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  // Determine the parent container's flex direction
  const getParentFlexDirection = (): 'row' | 'column' => {
    // For elements in a group
    if (element.groupId) {
      // Find the parent group
      for (const screen of quiz.screens) {
        for (const sectionKey of Object.keys(screen.sections) as SectionType[]) {
          const section = screen.sections[sectionKey as keyof typeof screen.sections];
          const parentGroup = section.elements.find((el: QuizElement) => 
            el.id === element.groupId && el.isGroup
          );
          
          if (parentGroup && parentGroup.layout) {
            return parentGroup.layout.direction.startsWith('row') ? 'row' : 'column';
          }
        }
      }
    }
    
    // For elements directly in a section
    if (element.sectionId) {
      const currentScreen = quiz.screens[quiz.currentScreenIndex];
      const section = currentScreen.sections[element.sectionId];
      
      if (section && section.layout) {
        return section.layout.direction.startsWith('row') ? 'row' : 'column';
      }
    }
    
    // Default to row if we can't determine
    return 'row';
  };
  
  // Handle moving multiple elements up
  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    
    // If multiple elements are selected, move all of them
    if (selectedElementIds.length > 1) {
      // Move each selected element
      selectedElementIds.forEach(id => {
        reorderElement(id, 'up');
      });
    } else {
      // Move just this element
      reorderElement(element.id, 'up');
    }
  };
  
  // Handle moving multiple elements down
  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    
    // If multiple elements are selected, move all of them
    if (selectedElementIds.length > 1) {
      // Move each selected element in reverse order to avoid index issues
      [...selectedElementIds].reverse().forEach(id => {
        reorderElement(id, 'down');
      });
    } else {
      // Move just this element
      reorderElement(element.id, 'down');
    }
  };
  
  // Handle moving multiple elements left
  const handleMoveLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    
    // If multiple elements are selected, move all of them
    if (selectedElementIds.length > 1) {
      // Move each selected element
      selectedElementIds.forEach(id => {
        reorderElement(id, 'left');
      });
    } else {
      // Move just this element
      reorderElement(element.id, 'left');
    }
  };
  
  // Handle moving multiple elements right
  const handleMoveRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    
    // If multiple elements are selected, move all of them
    if (selectedElementIds.length > 1) {
      // Move each selected element in reverse order to avoid index issues
      [...selectedElementIds].reverse().forEach(id => {
        reorderElement(id, 'right');
      });
    } else {
      // Move just this element
      reorderElement(element.id, 'right');
    }
  };
  
  // Determine which reordering controls to show based on flex direction
  const flexDirection = getParentFlexDirection();
  const showVerticalControls = flexDirection === 'column';
  const showHorizontalControls = flexDirection === 'row';
  
  // Render group container with improved hover handling
  const renderGroupContainer = () => {
    if (element.type !== 'group' || !element.children) return null;
    
    // Get width and height from styles, defaulting to 100% if not set
    const width = element.styles?.width || '100%';
    const height = element.styles?.height || '100%';
    
    return (
      <div 
        className="group-container"
        style={{
          display: 'flex',
          flexDirection: element.layout?.direction || 'row',
          flexWrap: element.layout?.wrap || 'wrap',
          justifyContent: element.layout?.justifyContent || 'flex-start',
          alignItems: element.layout?.alignItems || 'center',
          alignContent: element.layout?.alignContent || 'flex-start',
          gap: element.layout?.gap || '8px',
          width: width,
          height: height,
          position: 'relative',
          zIndex: 1
        }}
        onClick={(e) => {
          if (e.currentTarget === e.target) {
            e.stopPropagation();
          }
        }}
        onMouseLeave={(e) => {
          // Ensure hover state is cleared when mouse leaves the group
          setIsHovered(false);
          e.stopPropagation();
        }}
      >
        {element.children.map(childElement => (
          <ElementRenderer key={childElement.id} element={childElement} />
        ))}
      </div>
    );
  };
  
  // Optimized mouse enter handler for better hover state responsiveness
  const handleMouseEnter = (e: React.MouseEvent) => {
    // Only set hover if this is the direct target, not from bubbling
    // AND only if the parent group is selected (or not in a group)
    if (e.currentTarget === e.target && isInteractive) {
      setIsHovered(true);
    }
    e.stopPropagation();
  };
  
  // Optimized mouse leave handler for better hover state responsiveness
  const handleMouseLeave = (e: React.MouseEvent) => {
    // Only clear hover if this is the direct target, not from bubbling
    if (e.currentTarget === e.target) {
      setIsHovered(false);
    }
    e.stopPropagation();
  };
  
  // Determine if this element should show controls
  const showControls = isSelected || isHovered;
  
  // Handle keyboard events on focused elements
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Skip if inside an input or textarea
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    // Delete key
    if (e.key === 'Delete') {
      e.preventDefault();
      handleDelete();
    }
    
    // Copy: Ctrl+C
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      handleCopy();
    }
    
    // Paste: Ctrl+V
    if (e.ctrlKey && e.key === 'v') {
      e.preventDefault();
      handlePaste();
    }
    
    // Group: Ctrl+G
    if (e.ctrlKey && e.key === 'g' && !e.shiftKey && selectedElementIds.length > 1) {
      e.preventDefault();
      handleGroup();
    }
    
    // Ungroup: Ctrl+Shift+G
    if (e.ctrlKey && e.shiftKey && e.key === 'g' && element.isGroup) {
      e.preventDefault();
      handleUngroup();
    }
    
    // Arrow keys for movement
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      
      // Map arrow keys to directions
      const directionMap = {
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'ArrowLeft': 'left',
        'ArrowRight': 'right'
      };
      
      const direction = directionMap[e.key as keyof typeof directionMap];
      reorderElement(element.id, direction as 'up' | 'down' | 'left' | 'right');
    }
  };
  
  // Create enhanced attributes with key handlers after handleKeyDown is defined
  const enhancedAttributes = {
    ...attributes,
    onKeyDown: handleKeyDown,
  };
  
  // Inline renderElement function
  const renderElementContent = (element: QuizElement) => {
    // Don't render content for groups, as they just contain other elements
    if (element.type === 'group') {
      return null;
    }
    
    switch (element.type) {
      case 'text':
        return (
          <p style={{ borderRadius: 'inherit' }}>{element.content}</p>
        );
        
      case 'button':
        return (
          <button className="cursor-pointer" style={{ borderRadius: 'inherit' }}>
            {element.content}
          </button>
        );
      
      case 'image':
        return (
          <img 
            src={element.attributes?.src || ''} 
            alt={element.attributes?.alt || ''}
            style={{ 
              maxWidth: '100%', 
              height: 'auto', 
              display: 'block',
              margin: '0 auto',
              borderRadius: 'inherit'
            }}
          />
        );
        
      case 'link':
        return (
          <a href="#" style={{ borderRadius: 'inherit' }}>
            {element.content || 'Link'}
          </a>
        );
        
      // Add other element types as needed
      default:
        return <div style={{ borderRadius: 'inherit' }}>{element.content || `${element.type} element`}</div>;
    }
  };
  
  // The wrapped element with event listeners and drag behavior
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          style={combinedStyle}
          className={`quiz-element ${element.type === 'group' ? 'group' : element.type} ${isViewMode ? 'view-mode' : ''} ${isHovered && !isSelected ? 'hovered' : ''} ${isSelected ? 'selected' : ''}`}
          id={`element-${element.id}`}
          {...listeners}
          {...enhancedAttributes}
          {...dataAttrs}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          {/* Selection UI - Show only if selected or hovered */}
          {(isHovered || isSelected) && !isViewMode && (
            <>
              {/* Element type label */}
              <div className="type-label">
                <span className="flex items-center gap-1">
                  {getElementIcon()}
                  {formatElementType(element.type)}
                </span>
              </div>
              
              {/* Navigation arrows based on parent flex direction */}
              {isSelected && shouldShowReorderingControls && (
                <>
                  {showVerticalControls && (
                    <div className="direction-arrows vertical">
                      <button 
                        className="arrow-button"
                        onClick={handleMoveUp}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        title="Move Up"
                        type="button"
                      >
                        <ArrowUp />
                      </button>
                      <button 
                        className="arrow-button"
                        onClick={handleMoveDown}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        title="Move Down"
                        type="button"
                      >
                        <ArrowDown />
                      </button>
                    </div>
                  )}
                  
                  {showHorizontalControls && (
                    <div className="direction-arrows horizontal">
                      <button 
                        className="arrow-button"
                        onClick={handleMoveLeft}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        title="Move Left"
                        type="button"
                      >
                        <ArrowLeft />
                      </button>
                      <button 
                        className="arrow-button"
                        onClick={handleMoveRight}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        title="Move Right"
                        type="button"
                      >
                        <ArrowRight />
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          
          {/* Render the element content directly instead of using nested divs */}
          {renderElementContent(element)}
          
          {/* Group children - render directly inside parent */}
          {element.isGroup && element.children && (
            <div 
              className={`group-children-container relative w-full h-full`}
              style={{
                display: 'flex',
                flexDirection: element.layout?.direction || 'row',
                flexWrap: element.layout?.wrap || 'wrap',
                justifyContent: element.layout?.justifyContent || 'flex-start',
                alignItems: element.layout?.alignItems || 'center',
                alignContent: element.layout?.alignContent || 'flex-start',
                gap: element.layout?.gap || '8px',
              }}
            >
              {element.children.map(childElement => (
                <ElementRenderer 
                  key={childElement.id} 
                  element={childElement}
                  isViewMode={isViewMode} 
                  onSelectElement={selectElement} 
                />
              ))}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      
      {/* Context Menu Content - only show in edit mode */}
      {!isViewMode && (
        <ContextMenuContent className="w-64">
          <ContextMenuItem onClick={handleCopy} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4" />
            Copy
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
          
          <ContextMenuItem onClick={handlePaste} className="cursor-pointer">
            <Clipboard className="mr-2 h-4 w-4" />
            Paste
            <ContextMenuShortcut>⌘V</ContextMenuShortcut>
          </ContextMenuItem>
          
          <ContextMenuSeparator />
          
          {element.isGroup ? (
            <ContextMenuItem onClick={handleUngroup} className="cursor-pointer">
              <Ungroup className="mr-2 h-4 w-4" />
              Ungroup
              <ContextMenuShortcut>⌘⇧G</ContextMenuShortcut>
            </ContextMenuItem>
          ) : (
            <ContextMenuItem 
              onClick={handleGroup} 
              disabled={selectedElementIds.length <= 1} 
              className={`${selectedElementIds.length > 1 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
            >
              <Group className="mr-2 h-4 w-4" />
              Group with Selected
              <ContextMenuShortcut>⌘G</ContextMenuShortcut>
            </ContextMenuItem>
          )}
          
          <ContextMenuSeparator />
          
          <ContextMenuItem onClick={handleDelete} className="cursor-pointer text-destructive hover:text-destructive">
            <Trash className="mr-2 h-4 w-4" />
            Delete
            <ContextMenuShortcut>⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
} 