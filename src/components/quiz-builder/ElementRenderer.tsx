"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
import { 
  Trash, 
  Copy, 
  Clipboard, 
  Group, 
  Ungroup, 
  AlignLeft, 
  Type, 
  Square, 
  Radio, 
  CheckSquare, 
  ListFilter,
  Link as LinkIcon,
  Image,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  PaintBucket,
  Sparkles,
  RefreshCw,
  Scissors,
  SquareStack,
  Palette,
  Boxes
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ElementRendererProps {
  element: QuizElement;
  isViewMode?: boolean;
  onSelectElement?: (id: string) => void;
}

export function ElementRenderer({ element, isViewMode, onSelectElement }: ElementRendererProps) {
  const { 
    quiz,
    selectedElementIds,
    clipboard,
    updateElement,
    selectElement,
    removeStyleClass,
    applyThemeToElements,
    removeElement,
    copySelectedElements,
    pasteElements,
    groupSelectedElements,
    ungroupElements,
    reorderElement
  } = useQuizStore();
  
  // State for hover effect
  const [isHovered, setIsHovered] = useState<boolean>(false);
  
  // State for editing
  const [editText, setEditText] = useState(element.content);
  const editableRef = useRef<HTMLDivElement>(null);
  
  // Track editing state for text elements
  const [isEditing, setIsEditing] = useState(false);
  
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
    // If not in a group, always return true to make it interactive
    if (!element.groupId) return true;
    
    // If the parent group is selected, return true
    if (selectedElementIds.includes(element.groupId)) {
      return true;
    }
    
    // Optimization: cache the siblings found in the same group to avoid redundant lookups
    let hasSelectedSibling = false;
    
    // Find current screen for faster lookup
    const currentScreen = quiz.screens[quiz.currentScreenIndex];
    
    // Search through sections of the current screen
    for (const sectionKey of Object.keys(currentScreen.sections) as SectionType[]) {
      const section = currentScreen.sections[sectionKey];
      
      // Helper function to find if any sibling is selected in this group
      const findSelectedSiblingInGroup = (group: QuizElement): boolean => {
        if (group.isGroup && group.id === element.groupId && group.children) {
          // Check if any child of this group is selected
          return group.children.some(child => selectedElementIds.includes(child.id));
        }
        return false;
      };
      
      // Check all top-level groups in this section
      for (const groupEl of section.elements) {
        if (findSelectedSiblingInGroup(groupEl)) {
          hasSelectedSibling = true;
          break;
        }
        
        // Also check nested groups (if any)
        if (groupEl.isGroup && groupEl.children) {
          for (const nestedGroup of groupEl.children) {
            if (nestedGroup.isGroup && findSelectedSiblingInGroup(nestedGroup)) {
              hasSelectedSibling = true;
              break;
            }
          }
          if (hasSelectedSibling) break;
        }
      }
      
      if (hasSelectedSibling) break;
    }
    
    return hasSelectedSibling;
  }, [element.groupId, selectedElementIds, quiz.screens, quiz.currentScreenIndex]);
  
  // Track parent selection state for hover management
  const isParentSelected = element.groupId ? selectedElementIds.includes(element.groupId) : true;
  
  // Track hover state with useEffect cleanup to avoid stuck hover states
  React.useEffect(() => {
    // When component unmounts or parent selection changes, clear hover state
    return () => {
      setIsHovered(false);
    };
  }, [element.id, isParentSelected]);
  
  // Make the element draggable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform
  } = useDraggable({
    id: element.id,
    data: {
      type: element.type,
      sectionId: element.sectionId,
      element,
    },
    disabled: isViewMode || isEditing,
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
    backgroundImage: element.styles?.backgroundImage,
    backgroundSize: element.styles?.backgroundImage ? (element.styles?.backgroundSize || 'cover') : undefined,
    backgroundPosition: element.styles?.backgroundImage ? 'center' : undefined,
    backgroundRepeat: element.styles?.backgroundImage ? 'no-repeat' : undefined,
    color: element.styles?.color,
    padding: element.styles?.padding,
    border: element.styles?.border,
    borderRadius: element.styles?.borderRadius,
    margin: element.styles?.margin,
    // Apply appropriate shadow based on whether the element has a background
    boxShadow: element.styles?.backgroundColor ? element.styles?.boxShadow : undefined,
    textShadow: !element.styles?.backgroundColor ? element.styles?.textShadow : undefined,
    boxSizing: 'border-box' as const,
    // Add zIndex for selected elements to ensure proper layering
    zIndex: selectedElementIds.includes(element.id) ? 30 : undefined,
    // Set border-width CSS variable for dynamic selection outline positioning
    ...(element.styles?.border && element.styles.border !== 'none' ? 
      { '--border-width': element.styles.border.toString().split(' ')[0] } : 
      { '--border-width': '0px' })
  };
  
  // Handle click with hierarchical selection
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop propagation to prevent section selection
    
    // Special handling for product element
    if (element.type === 'product' && element.isGroup) {
      // Only select the product container if it's directly clicked
      // This check ensures clicks on child elements will select those instead
      const isDirectClick = e.target === e.currentTarget || 
                          (e.currentTarget as HTMLElement).contains(e.target as HTMLElement) &&
                          !(e.target as HTMLElement).closest('.element-renderer');
      
      if (isDirectClick) {
        selectElement(element.id);
      }
      
      // Let the click continue to child elements
      return;
    }
    
    // Special handling for group element (not product)
    if (element.type === 'group' && element.isGroup) {
      // Similar behavior but marked specifically as a group
      const isDirectClick = e.target === e.currentTarget || 
                          (e.currentTarget as HTMLElement).contains(e.target as HTMLElement) &&
                          !(e.target as HTMLElement).closest('.element-renderer');
      
      if (isDirectClick) {
        selectElement(element.id);
      }
      
      return;
    }
    
    // If this element is in a group and the group is not selected,
    // select the group first
    if (element.groupId && !isParentGroupSelected) {
      selectElement(element.groupId);
      return;
    }
    
    // Allow selecting individual child elements with Ctrl key
    // or shift key (for multiple selection) when parent group is selected
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
  
  const handleResetToTheme = () => {
    // If multiple elements are selected, apply theme defaults to all of them
    if (selectedElementIds.length > 1) {
      // First remove any style classes
      removeStyleClass(selectedElementIds);
      // Then apply theme defaults
      applyThemeToElements({ elementIds: selectedElementIds, resetAll: true });
    } else {
      // First remove any style class
      removeStyleClass([element.id]);
      // Then apply theme defaults to just this element
      applyThemeToElements({ elementIds: [element.id], resetAll: true });
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
  
  // Only show hover state if the element is interactive (parent group is selected or not in a group)
  const showHoverState = isHovered && (element.type === 'group' || isParentSelected);
  
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
      case 'product': return <Boxes className="h-3 w-3" />;
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
    // Check if the element is a group and has children
    if (!element.isGroup || !element.children) return null;
    
    // Check if the container should use grid-like layout
    const isGridLayout = element.layout?.direction === "grid" as any;
    
    // Special rendering for product element
    if (element.type === 'product') {
    return (
      <div 
          id={`element-${element.id}`}
          className={`element-renderer product-element ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
        style={{
            ...style,
          display: 'flex',
            flexDirection: element.layout?.direction || 'column',
            flexWrap: element.layout?.wrap || 'nowrap',
            justifyContent: element.layout?.justifyContent || 'flex-start',
            alignItems: element.layout?.alignItems || 'stretch',
            alignContent: element.layout?.alignContent || 'flex-start',
            gap: element.layout?.gap || '12px',
            pointerEvents: isViewMode ? 'auto' : 'auto',
            cursor: isViewMode ? 'pointer' : 'default',
            backgroundImage: element.styles?.backgroundImage,
            backgroundSize: element.styles?.backgroundImage ? (element.styles?.backgroundSize || 'cover') : undefined,
            backgroundPosition: element.styles?.backgroundImage ? 'center' : undefined,
            backgroundRepeat: element.styles?.backgroundImage ? 'no-repeat' : undefined,
            position: 'relative',
            ...dataAttrs
          }}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          data-element-id={element.id}
          data-element-type="product"
          {...dataAttrs}
        >
          {element.children.map(childElement => (
            <ElementRenderer key={childElement.id} element={childElement} />
          ))}
          
          {/* Product overlay when hovered in edit mode */}
          {!isViewMode && isHovered && !isSelected && (
            <div className="product-overlay" style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              borderRadius: 'inherit',
              pointerEvents: 'none',
              border: '1px dashed #4F46E5'
            }}/>
          )}
        </div>
      );
    }
    
    // Regular group element rendering
    return (
      <div
        id={`element-${element.id}`}
        className={`element-renderer group-element ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
        style={{
          ...style,
          display: isGridLayout ? 'grid' : 'flex',
          ...(isGridLayout ? {
            gridTemplateColumns: (element.layout as any)?.gridColumns || 'repeat(2, 1fr)',
            gridTemplateRows: (element.layout as any)?.gridRows || 'auto',
            gridGap: element.layout?.gap || '8px',
          } : {
          flexDirection: element.layout?.direction || 'row',
          flexWrap: element.layout?.wrap || 'wrap',
          justifyContent: element.layout?.justifyContent || 'flex-start',
          alignItems: element.layout?.alignItems || 'center',
          alignContent: element.layout?.alignContent || 'flex-start',
            gap: element.layout?.gap || '8px',
          }),
          pointerEvents: isSelected ? 'auto' : 'none',
          position: 'relative',
          backgroundImage: element.styles?.backgroundImage,
          backgroundSize: element.styles?.backgroundImage ? (element.styles?.backgroundSize || 'cover') : undefined,
          backgroundPosition: element.styles?.backgroundImage ? 'center' : undefined,
          backgroundRepeat: element.styles?.backgroundImage ? 'no-repeat' : undefined,
          ...dataAttrs
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
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
    // Always allow hover on groups
    if (element.type === 'group') {
      setIsHovered(true);
      // We don't want to stop propagation for groups to allow proper event bubbling
      return;
    }
    
    // For child elements, only allow hover if parent group is selected
    if (isParentSelected) {
      setIsHovered(true);
    }
    
    // Don't stop propagation to allow proper event bubbling for nested elements
  };
  
  // Optimized mouse leave handler for better hover state responsiveness
  const handleMouseLeave = (e: React.MouseEvent) => {
    // For groups, we need special handling to avoid flickering
    if (element.type === 'group') {
      // Check if the mouse is still over a child element
      const relatedTarget = e.relatedTarget as Node;
      const elementNode = document.getElementById(`element-${element.id}`);
      
      // Only clear hover if we've actually left the group and all its children
      if (elementNode && !elementNode.contains(relatedTarget)) {
        setIsHovered(false);
      }
      return;
    }
    
    // For regular elements, clear hover state immediately
    setIsHovered(false);
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
  
  // Handle double click for editing text
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Only allow editing text elements
    if (element.type === 'text' || element.type === 'button' || element.type === 'link') {
      setIsEditing(true);
      setEditText(element.content);
    }
  };

  // Handle text editing save
  const handleTextSave = useCallback(() => {
    if (isEditing) {
      updateElement(element.id, { content: editText });
      setIsEditing(false);
    }
  }, [isEditing, element.id, editText, updateElement]);

  // Handle keydown events when editing
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    // Save on Enter key press (unless Shift key is also pressed)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSave();
    }
    // Cancel on Escape key press
    else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(element.content); // Reset to original content
    }
  };

  // Focus the editable element when entering edit mode
  useEffect(() => {
    if (isEditing && editableRef.current) {
      editableRef.current.focus();
      
      // Place cursor at the end of the text
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(editableRef.current);
      range.collapse(false); // Collapse to end
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  // Handle click outside to save text
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isEditing && editableRef.current && !editableRef.current.contains(e.target as Node)) {
        handleTextSave();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, editText, handleTextSave]);
  
  // Get default action type based on element type
  function getDefaultActionType(type: string): string {
    switch (type) {
      case 'button':
        return 'next-screen';
      case 'link':
        return 'open-url';
      case 'image':
        return 'none';
      case 'text':
        return 'none';
      default:
        return 'none';
    }
  }
  
  // Get interactive attributes for elements that can have actions
  const interactiveAttributes = useMemo(() => {
    if (['button', 'link', 'text', 'image'].includes(element.type)) {
      const actionType = element.attributes?.actionType || getDefaultActionType(element.type);
      // If action type is brand-page, treat it the same as open-url for interaction
      const finalActionType = actionType === 'brand-page' ? 'open-url' : actionType;
      
      return {
        onClick: (e: any) => {
          if (isEditing) {
            e.preventDefault();
            e.stopPropagation();
          }
        },
        'data-action-type': finalActionType,
        'data-target-screen-id': element.attributes?.targetScreenId || '',
        'data-url': element.attributes?.url || '',
        'data-target-window': element.attributes?.targetWindow || '_blank',
        style: {
          cursor: isEditing ? 'inherit' : (actionType === 'none' ? 'default' : 'pointer')
        }
      };
    }
    
    return {};
  }, [element.type, element.attributes, isEditing]);
  
  // Render element content
  const renderElementContent = (element: QuizElement) => {
    // Don't render content for groups or products, as they just contain other elements
    if (element.type === 'group' || element.type === 'product') {
      return null;
    }
    
    // Special handling for editable text elements
    if (isEditing && (element.type === 'text' || element.type === 'button' || element.type === 'link')) {
      return (
        <div
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          className="w-full h-full outline-none editable-content"
          style={{ 
            borderRadius: 'inherit',
            minHeight: '1em',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            userSelect: 'text',
            WebkitUserSelect: 'text',
            MozUserSelect: 'text',
            msUserSelect: 'text',
            pointerEvents: 'auto'
          }}
          onInput={(e) => setEditText(e.currentTarget.textContent || '')}
          onKeyDown={handleEditKeyDown}
          onBlur={handleTextSave}
        >
          {element.content}
        </div>
      );
    }
    
    // Build attributes for the element
    const interactiveAttributes = {
      // Add data attributes for interaction handling - only for preview mode
      'data-action-type': element.attributes?.actionType || getDefaultActionType(element.type),
      'data-target-screen-id': element.attributes?.targetScreenId || '',
      'data-url': element.attributes?.url || '',
    };
    
    switch (element.type) {
      case 'text':
        return (
          <p style={{ borderRadius: 'inherit' }} {...interactiveAttributes}>{element.content}</p>
        );
        
      case 'button':
        return (
          <button 
            className="cursor-pointer"
            {...interactiveAttributes}
          >
            {element.content}
          </button>
        );
      
      case 'image':
        return (
          <img 
            src={element.attributes?.src || ''} 
            alt={element.attributes?.alt || ''}
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: (element.styles?.objectFit as 'fill' | 'contain' | 'cover') || 'cover',
              borderRadius: 'inherit',
              display: 'block',
              // If background styles are applied, they will take precedence
              backgroundColor: element.styles?.backgroundColor || '',
              backgroundImage: element.styles?.backgroundImage ? element.styles.backgroundImage : 'none',
              backgroundSize: element.styles?.backgroundImage ? (element.styles?.backgroundSize || 'cover') : undefined,
              backgroundPosition: element.styles?.backgroundImage ? 'center' : undefined,
              backgroundRepeat: element.styles?.backgroundImage ? 'no-repeat' : undefined
            }}
            {...interactiveAttributes}
          />
        );
        
      case 'link':
        return (
          <a 
            href={element.attributes?.url || '#'} 
            target={element.attributes?.target || '_blank'}
            style={{ borderRadius: 'inherit' }}
            data-link-element="true"
            {...interactiveAttributes}
          >
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
          className={`quiz-element ${element.type === 'group' ? 'group' : element.type} ${isViewMode ? 'view-mode' : ''} ${
            // Show hover class only if it should be showing hover state
            isHovered && (isParentSelected || element.type === 'group') && !isSelected ? 'hovered' : ''
          } ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}
          id={`element-${element.id}`}
          {...(isEditing ? {} : listeners)}
          {...(isEditing ? {} : enhancedAttributes)}
          {...dataAttrs}
          onMouseEnter={isEditing ? undefined : handleMouseEnter}
          onMouseLeave={isEditing ? undefined : handleMouseLeave}
          onClick={isEditing ? undefined : handleClick}
          onDoubleClick={handleDoubleClick}
        >
          {/* Selection UI - Show only if selected or hovered and not in editing mode */}
          {(isHovered || isSelected) && !isViewMode && !isEditing && (
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
              className={`group-children-container relative w-full h-full ${isHovered && !isSelected ? 'hovered' : ''} ${isSelected ? 'selected' : ''}`}
              style={{
                display: 'flex',
                flexDirection: element.layout?.direction || 'row',
                flexWrap: element.layout?.wrap || 'wrap',
                justifyContent: element.layout?.justifyContent || 'flex-start',
                alignItems: element.layout?.alignItems || 'center',
                alignContent: element.layout?.alignContent || 'flex-start',
                gap: element.layout?.gap || '8px',
                // Only block pointer events on children when group is not selected
                pointerEvents: isSelected ? 'auto' : 'none',
                backgroundImage: element.styles?.backgroundImage,
                backgroundSize: element.styles?.backgroundImage ? (element.styles?.backgroundSize || 'cover') : undefined,
                backgroundPosition: element.styles?.backgroundImage ? 'center' : undefined,
                backgroundRepeat: element.styles?.backgroundImage ? 'no-repeat' : undefined,
                // Set border-width CSS variable for dynamic selection outline positioning
                ...(element.styles?.border && element.styles.border !== 'none' ? 
                  { '--border-width': element.styles.border.toString().split(' ')[0] } : 
                  { '--border-width': '0px' })
              }}
              onClick={(e) => {
                // If the group is not selected, we want to select it
                if (!isSelected) {
                  e.stopPropagation();
                  selectElement(element.id);
                }
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
          {/* Build menu items dynamically */}
          {(() => {
            // Define menu items in logical groups
            const menuItems = [];
            let hasPreviousGroup = false;
            
            // Group 1: Copy/Paste
            const copyPasteGroup = [];
            
            // Copy is always available
            copyPasteGroup.push(
              <ContextMenuItem key="copy" onClick={handleCopy} className="cursor-pointer">
                <Copy className="mr-2 h-4 w-4" />
                Copy
                <ContextMenuShortcut>⌘C</ContextMenuShortcut>
              </ContextMenuItem>
            );
            
            // Paste only when clipboard has content
            if (clipboard.length > 0) {
              copyPasteGroup.push(
                <ContextMenuItem key="paste" onClick={handlePaste} className="cursor-pointer">
                  <Clipboard className="mr-2 h-4 w-4" />
                  Paste
                  <ContextMenuShortcut>⌘V</ContextMenuShortcut>
                </ContextMenuItem>
              );
            }
            
            // Add copy/paste group
            if (copyPasteGroup.length > 0) {
              menuItems.push(...copyPasteGroup);
              hasPreviousGroup = true;
            }
            
            // Group 2: Group/Ungroup
            const groupingItems = [];
            
            if (element.isGroup) {
              // Ungroup option for groups
              groupingItems.push(
                <ContextMenuItem key="ungroup" onClick={handleUngroup} className="cursor-pointer">
                  <Ungroup className="mr-2 h-4 w-4" />
                  Ungroup elements
                  <ContextMenuShortcut>⌘⇧G</ContextMenuShortcut>
                </ContextMenuItem>
              );
            } else if (selectedElementIds.length > 1) {
              // Group with selected for non-groups when multiple elements are selected
              groupingItems.push(
                <ContextMenuItem key="group" onClick={handleGroup} className="cursor-pointer">
                  <Group className="mr-2 h-4 w-4" />
                  Group elements
                  <ContextMenuShortcut>⌘G</ContextMenuShortcut>
                </ContextMenuItem>
              );
            }
            
            // Add separator before grouping items if needed
            if (groupingItems.length > 0 && hasPreviousGroup) {
              menuItems.push(<ContextMenuSeparator key="sep1" />);
            }
            
            // Add grouping items
            if (groupingItems.length > 0) {
              menuItems.push(...groupingItems);
              hasPreviousGroup = true;
            }
            
            // Group 3: Style reset
            const styleItems = [];
            
            // Always show Reset style option without any conditions
            styleItems.push(
              <ContextMenuItem key="reset" onClick={handleResetToTheme} className="cursor-pointer">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset style
              </ContextMenuItem>
            );
            
            // Add separator before style items if needed
            if (styleItems.length > 0 && hasPreviousGroup) {
              menuItems.push(<ContextMenuSeparator key="sep2" />);
            }
            
            // Add style items
            if (styleItems.length > 0) {
              menuItems.push(...styleItems);
              hasPreviousGroup = true;
            }
            
            // Group 4: Delete (always shown)
            if (hasPreviousGroup) {
              menuItems.push(<ContextMenuSeparator key="sep3" />);
            }
            
            menuItems.push(
              <ContextMenuItem key="delete" onClick={handleDelete} className="cursor-pointer text-destructive hover:text-destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete
                <ContextMenuShortcut>⌫</ContextMenuShortcut>
              </ContextMenuItem>
            );
            
            return menuItems;
          })()}
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}