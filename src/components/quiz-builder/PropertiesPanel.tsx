"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useQuizStore } from '@/store/useQuizStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '@/components/ui/color-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QuizElement, SectionType, ElementType, FlexDirection, FlexWrap, JustifyContent, AlignItems, AlignContent, SectionLayout, StyleClass } from '@/types';
import { Badge } from '@/components/ui/badge';
import { PropertyGroup } from '@/components/ui/property-group';
import { 
  Type, 
  PaintBucket, 
  Layers, 
  Palette,
  Box,
  AlignLeft,
  Link as LinkIcon,
  Image,
  Maximize, 
  Minimize,
  BoxSelect,
  SlidersHorizontal, 
  SlidersVertical, 
  Plus,
  Minus,
  MinusCircle,
  ChevronRight,
  ArrowLeftRight,
  LayoutGrid,
  Paintbrush,
  Square,
  Layout,
  CloudLightning,
  X,
  Tag,
  Copy,
  Pencil,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { TextAlignButtonGroup } from '@/components/ui/text-align-button-group';
import { NumericInput } from '@/components/ui/numeric-input';
import { Button } from "@/components/ui/button";
import { FlexDirectionButtonGroup } from '@/components/ui/flex-direction-button-group';
import { JustifyContentButtonGroup } from '@/components/ui/justify-content-button-group';
import { AlignItemsButtonGroup } from '@/components/ui/align-items-button-group';
import { cn } from "@/lib/utils";
import { DropShadowControl } from "@/components/ui/dropshadow-control";
import {
  ArrowDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MediaPicker } from "@/components/ui/media-picker";
import { ImageInput } from "@/components/ui/image-input";

export function PropertiesPanel() {
  const { 
    quiz, 
    selectedElementIds, 
    updateElement,
    selectedSectionId,
    updateSectionStyles,
    updateSectionLayout,
    applyStyleClass,
    removeStyleClass,
    updateStyleClass,
    deleteStyleClass,
    createStyleClass,
    viewMode,
    saveBackgroundColor,
    restoreBackgroundColor,
    backgroundColors
  } = useQuizStore();
  
  // Get current screen
  const currentScreen = quiz.screens[quiz.currentScreenIndex];
  
  // Find all selected elements, including those inside groups
  const selectedElements = useMemo(() => {
    if (selectedElementIds.length === 0) return [];
    
    const elements: QuizElement[] = [];
    
    // Recursive function to find elements in nested groups
    const findElementsInGroup = (group: QuizElement, elementsToFind: string[]) => {
      if (group.isGroup && group.children) {
        // Check direct children of this group
        const foundElements = group.children.filter((child: QuizElement) => 
          elementsToFind.includes(child.id)
        );
        elements.push(...foundElements);
        
        // Check nested groups
        for (const childElement of group.children) {
          if (childElement.isGroup && childElement.children) {
            findElementsInGroup(childElement, elementsToFind);
          }
        }
      }
    };
    
    for (const screen of quiz.screens) {
      // Look for the elements in each section
      for (const sectionKey of Object.keys(screen.sections) as SectionType[]) {
        const section = screen.sections[sectionKey];
        
        // First check direct children of the section
        const foundElements = section.elements.filter((el: QuizElement) => 
          selectedElementIds.includes(el.id)
        );
        elements.push(...foundElements);
        
        // Then check elements inside groups recursively
        for (const groupElement of section.elements) {
          if (groupElement.isGroup && groupElement.children) {
            findElementsInGroup(groupElement, selectedElementIds);
          }
        }
      }
    }
    
    return elements;
  }, [quiz, selectedElementIds]);
  
  // Get the first selected element for single selection case
  const firstElement = selectedElements.length > 0 ? selectedElements[0] : null;
  
  // Determine if all selected elements are of the same type
  const allSameType = useMemo(() => {
    if (selectedElements.length <= 1) return true;
    const firstType = selectedElements[0].type;
    return selectedElements.every(el => el.type === firstType);
  }, [selectedElements]);
  
  // Determine which property groups are applicable to all selected elements
  const supportedGroups = useMemo(() => {
    if (selectedElements.length === 0) return {
      typography: false,
      colors: false,
      background: false,
      size: false,
      spacing: false,
      borders: false,
      effects: false,
      layout: false,
      content: false,
    };
    
    // Initialize with all potential property groups
    const groups = {
      typography: true,
      colors: true,
      background: true,
      size: true,
      spacing: true,
      borders: true,
      effects: true,
      layout: true,
      content: true,
    };
    
    // Define which element types support which property groups
    const typographyElements = ['text', 'button', 'link', 'heading', 'paragraph'];
    const backgroundElements = ['text', 'button', 'link', 'container', 'image', 'group', 'heading', 'paragraph'];
    const contentElements = ['text', 'button', 'link', 'heading', 'paragraph', 'image'];
    
    // Check if all selected elements support typography
    if (!selectedElements.every(el => typographyElements.includes(el.type))) {
      groups.typography = false;
    }
    
    // Check if all selected elements support background
    if (!selectedElements.every(el => backgroundElements.includes(el.type))) {
      groups.background = false;
    }
    
    // Check if all selected elements have editable content
    if (!selectedElements.every(el => contentElements.includes(el.type))) {
      groups.content = false;
    }
    
    return groups;
  }, [selectedElements]);
  
  // Get common properties among all selected elements
  const commonProperties = useMemo(() => {
    if (selectedElements.length === 0) return {};
    if (selectedElements.length === 1) return selectedElements[0];
    
    // Start with the first element's properties
    const result: Partial<QuizElement> = {
      type: selectedElements[0].type,
      styles: { ...(selectedElements[0].styles || {}) }
    };
    
    // If all elements have the same content, include it
    const allSameContent = selectedElements.every(el => el.content === selectedElements[0].content);
    if (allSameContent) {
      result.content = selectedElements[0].content;
    }
    
    // Check each style property
    const styleKeys = Object.keys(selectedElements[0].styles || {});
    for (const key of styleKeys) {
      const firstValue = selectedElements[0].styles[key];
      const allSameValue = selectedElements.every(el => el.styles && el.styles[key] === firstValue);
      
      if (!allSameValue && result.styles) {
        // If values differ, remove this property
        delete result.styles[key];
      }
    }
    
    // Check attributes
    if (selectedElements[0].attributes) {
      result.attributes = { ...selectedElements[0].attributes };
      const attrKeys = Object.keys(selectedElements[0].attributes || {});
      for (const key of attrKeys) {
        const firstValue = selectedElements[0].attributes[key];
        const allSameValue = selectedElements.every(el => 
          el.attributes && el.attributes[key] === firstValue
        );
        
        if (!allSameValue && result.attributes) {
          delete result.attributes[key];
        }
      }
    }
    
    return result;
  }, [selectedElements]);
  
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedElements.length === 0) return;
    
    // Update all selected elements
    selectedElements.forEach(element => {
      updateElement(element.id, {
        content: e.target.value,
      });
    });
  };
  
  const handleAttributeChange = (attribute: string, value: string) => {
    if (selectedElements.length === 0) return;
    
    // Update all selected elements
    selectedElements.forEach(element => {
      updateElement(element.id, {
        attributes: {
          ...element.attributes,
          [attribute]: value,
        },
      });
    });
  };
  
  const handleStyleChange = (property: string, value: string) => {
    if (selectedElements.length === 0) return;
    
    // Update all selected elements
    selectedElements.forEach(element => {
      updateElement(element.id, {
        styles: {
          ...element.styles,
          [property]: value,
        },
      });
      
      // If this element has a style class, update the class as well
      if (element.styleClass && quiz.styleClasses) {
        const styleClass = quiz.styleClasses.find(c => c.id === element.styleClass);
        if (styleClass) {
          // Update the class with the new style property
          updateStyleClass(element.styleClass, {
            styles: {
              ...styleClass.styles,
              [property]: value,
            }
          });
        }
      }
    });
  };
  
  // Function to update layout properties for group elements
  const handleLayoutChange = (property: string, value: string) => {
    if (selectedElements.length === 0) return;
    
    // Update layout for all selected group elements
    selectedElements.forEach(element => {
      if (element.isGroup) {
        // Create a new layout object with default values to satisfy TypeScript
        const defaultLayout: SectionLayout = { 
          direction: 'row' as FlexDirection, 
          wrap: 'wrap' as FlexWrap, 
          justifyContent: 'flex-start' as JustifyContent, 
          alignItems: 'center' as AlignItems,
          alignContent: 'flex-start' as AlignContent,
          gap: '8px' 
        };
        
        // Merge with existing layout and the new property
        const updatedLayout = {
          ...defaultLayout,
          ...(element.layout || {}),
          [property]: value,
        };
        
        updateElement(element.id, {
          layout: updatedLayout as SectionLayout
        });
      }
    });
  };
  
  // State for expanded padding/margin controls
  const [expandedPadding, setExpandedPadding] = useState(false);
  
  // Add states for expanded corners and borders controls
  const [expandedCorners, setExpandedCorners] = useState(false);
  
  // State for layout controls visibility
  const [layoutVisible, setLayoutVisible] = useState(false);

  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState({
    background: true,
    corners: true,
    layout: true,
    shadow: true
  });

  // Function to handle padding changes for individual sides
  const handlePaddingChange = (value: string, side?: 'top' | 'right' | 'bottom' | 'left') => {
    if (selectedElements.length === 0) return;
    
    // Update padding for all selected elements
    selectedElements.forEach(element => {
      let updatedStyles = { ...element.styles };
      
      if (!side || !expandedPadding) {
        // Update the element's padding with a single value
        updatedStyles.padding = value;
      } else {
        // Get current padding values or defaults for this element
        const currentPadding = element.styles.padding || '0px';
        const paddingValues = currentPadding.split(' ').map((v: string) => v.trim());
        
        // Create a new padding string based on which side was changed
        let newPadding = '';
        
        if (paddingValues.length === 1) {
          // If we have a single value, expand it to 4 values
          const val = paddingValues[0];
          paddingValues[0] = val;
          paddingValues[1] = val;
          paddingValues[2] = val;
          paddingValues[3] = val;
        } else if (paddingValues.length === 2) {
          // If we have 2 values (vertical, horizontal), expand to 4
          const [vertical, horizontal] = paddingValues;
          paddingValues[0] = vertical;
          paddingValues[1] = horizontal;
          paddingValues[2] = vertical;
          paddingValues[3] = horizontal;
        } else if (paddingValues.length === 3) {
          // If we have 3 values (top, horizontal, bottom), expand to 4
          const [top, horizontal, bottom] = paddingValues;
          paddingValues[0] = top;
          paddingValues[1] = horizontal;
          paddingValues[2] = bottom;
          paddingValues[3] = horizontal;
        } else if (paddingValues.length < 4) {
          // Ensure we have 4 values
          while (paddingValues.length < 4) {
            paddingValues.push('0px');
          }
        }
        
        // Update the appropriate side
        switch (side) {
          case 'top':
            paddingValues[0] = value;
            break;
          case 'right':
            paddingValues[1] = value;
            break;
          case 'bottom':
            paddingValues[2] = value;
            break;
          case 'left':
            paddingValues[3] = value;
            break;
        }
        
        // Combine values back into a padding string
        newPadding = paddingValues.join(' ');
        
        // Update the element's padding
        updatedStyles.padding = newPadding;
      }
      
      // Update the element
      updateElement(element.id, { styles: updatedStyles });
      
      // If this element has a style class, update the class as well
      if (element.styleClass && quiz.styleClasses) {
        const styleClass = quiz.styleClasses.find(c => c.id === element.styleClass);
        if (styleClass) {
          // Update the class with the new style property
          updateStyleClass(element.styleClass, {
            styles: {
              ...styleClass.styles,
              padding: updatedStyles.padding
            }
          });
        }
      }
    });
  };
  
  // Function to extract padding and margin values
  const getPaddingValue = (side?: 'top' | 'right' | 'bottom' | 'left'): number | string => {
    if (!commonProperties || !commonProperties.styles || !commonProperties.styles.padding) {
      return side ? '' : 0;
    }
    
    const paddingStr = commonProperties.styles.padding;
    
    if (!side) {
      // Handle single value for slider
      if (paddingStr.split(' ').length === 1) {
        const value = parseInt(paddingStr) || parseInt(paddingStr.replace('px', '')) || 0;
        return value;
      }
      
      // For simplicity, we'll just return the first value if there are multiple
      const firstValue = paddingStr.split(' ')[0];
      return parseInt(firstValue) || parseInt(firstValue.replace('px', '')) || 0;
    } else {
      // Handle individual sides
      const paddingValues = paddingStr.split(' ').map((v: string) => v.trim());
      
      if (paddingValues.length === 1) {
        // If there's only one value, it applies to all sides
        return paddingValues[0];
      } else if (paddingValues.length === 2) {
        // If there are two values, first is top/bottom, second is left/right
        if (side === 'top' || side === 'bottom') {
          return paddingValues[0];
        } else {
          return paddingValues[1];
        }
      } else if (paddingValues.length === 3) {
        // If there are three values, first is top, second is left/right, third is bottom
        if (side === 'top') {
          return paddingValues[0];
        } else if (side === 'bottom') {
          return paddingValues[2];
        } else {
          return paddingValues[1];
        }
      } else if (paddingValues.length >= 4) {
        // If there are four values, they are top, right, bottom, left
        switch (side) {
          case 'top': return paddingValues[0];
          case 'right': return paddingValues[1];
          case 'bottom': return paddingValues[2];
          case 'left': return paddingValues[3];
        }
      }
      
      return '';
    }
  };
  
  // Function to get border radius values for individual corners
  const getBorderRadiusValue = (corner?: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft'): number | string => {
    if (!commonProperties || !commonProperties.styles || !commonProperties.styles.borderRadius) {
      return corner ? '' : 0;
    }
    
    const radiusStr = commonProperties.styles.borderRadius.toString();
    
    if (!corner) {
      // Handle single value for slider
      if (radiusStr.split(' ').length === 1) {
        const value = parseInt(radiusStr) || parseInt(radiusStr.replace('px', '')) || 0;
        return value;
      }
      
      // For simplicity, we'll just return the first value if there are multiple
      const firstValue = radiusStr.split(' ')[0];
      return parseInt(firstValue) || parseInt(firstValue.replace('px', '')) || 0;
    } else {
      // Handle individual corners
      const radiusValues = radiusStr.split(' ').map((v: string) => v.trim());
      
      if (radiusValues.length === 1) {
        // If there's only one value, it applies to all corners
        return radiusValues[0];
      } else if (radiusValues.length === 2) {
        // If there are two values, first is topLeft/bottomRight, second is topRight/bottomLeft
        if (corner === 'topLeft' || corner === 'bottomRight') {
          return radiusValues[0];
        } else {
          return radiusValues[1];
        }
      } else if (radiusValues.length === 3) {
        // If there are three values: topLeft, topRight/bottomLeft, bottomRight
        if (corner === 'topLeft') {
          return radiusValues[0];
        } else if (corner === 'bottomRight') {
          return radiusValues[2];
        } else {
          return radiusValues[1];
        }
      } else if (radiusValues.length >= 4) {
        // If there are four values: topLeft, topRight, bottomRight, bottomLeft
        switch (corner) {
          case 'topLeft': return radiusValues[0];
          case 'topRight': return radiusValues[1];
          case 'bottomRight': return radiusValues[2];
          case 'bottomLeft': return radiusValues[3];
        }
      }
      
      return '';
    }
  };
  
  // Function to handle border radius changes for individual corners
  const handleBorderRadiusChange = (value: string, corner?: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft') => {
    if (selectedElements.length === 0) return;
    
    // Update border radius for all selected elements
    selectedElements.forEach(element => {
      let updatedStyles = { ...element.styles };
      
      if (!corner || !expandedCorners) {
        // Update with a single value for all corners
        updatedStyles.borderRadius = value;
      } else {
        // Get current radius values or defaults for this element
        const currentRadius = element.styles.borderRadius || '0px';
        const radiusValues = currentRadius.split(' ').map((v: string) => v.trim());
        
        // Create a new radius string based on which corner was changed
        let newRadius = '';
        
        if (radiusValues.length === 1) {
          // If we have a single value, expand it to 4 values
          const val = radiusValues[0];
          radiusValues[0] = val;
          radiusValues[1] = val;
          radiusValues[2] = val;
          radiusValues[3] = val;
        } else if (radiusValues.length === 2) {
          // If we have 2 values (topLeft/bottomRight, topRight/bottomLeft), expand to 4
          const [tlbr, trbl] = radiusValues;
          radiusValues[0] = tlbr;
          radiusValues[1] = trbl;
          radiusValues[2] = tlbr;
          radiusValues[3] = trbl;
        } else if (radiusValues.length === 3) {
          // If we have 3 values (topLeft, topRight/bottomLeft, bottomRight), expand to 4
          const [tl, trbl, br] = radiusValues;
          radiusValues[0] = tl;
          radiusValues[1] = trbl;
          radiusValues[2] = br;
          radiusValues[3] = trbl;
        } else if (radiusValues.length < 4) {
          // Ensure we have 4 values
          while (radiusValues.length < 4) {
            radiusValues.push('0px');
          }
        }
        
        // Update the appropriate corner
        switch (corner) {
          case 'topLeft':
            radiusValues[0] = value;
            break;
          case 'topRight':
            radiusValues[1] = value;
            break;
          case 'bottomRight':
            radiusValues[2] = value;
            break;
          case 'bottomLeft':
            radiusValues[3] = value;
            break;
        }
        
        // Combine values back into a radius string
        newRadius = radiusValues.join(' ');
        
        // Update the element's border radius
        updatedStyles.borderRadius = newRadius;
      }
      
      // Update the element
      updateElement(element.id, { styles: updatedStyles });
      
      // If this element has a style class, update the class as well
      if (element.styleClass && quiz.styleClasses) {
        const styleClass = quiz.styleClasses.find(c => c.id === element.styleClass);
        if (styleClass) {
          // Update the class with the new style property
          updateStyleClass(element.styleClass, {
            styles: {
              ...styleClass.styles,
              borderRadius: updatedStyles.borderRadius
            }
          });
        }
      }
    });
  };

  // Handle background color toggle
  const handleBackgroundColorToggle = () => {
    if (commonProperties.styles?.backgroundColor || commonProperties.styles?.backgroundImage) {
      // Save the current background color before removing it
      selectedElements.forEach(element => {
        if (element.styles.backgroundColor) {
          saveBackgroundColor(currentScreen.id, element.id, element.styles.backgroundColor);
        }
        
        // Update element's styles
        const updatedStyles = {
          ...element.styles,
          backgroundColor: '',
          backgroundImage: ''
        };
        
        updateElement(element.id, {
          styles: updatedStyles
        });
        
        // If this element has a style class, update the class as well
        if (element.styleClass && quiz.styleClasses) {
          const styleClass = quiz.styleClasses.find(c => c.id === element.styleClass);
          if (styleClass) {
            // Update the class with the new style properties
            updateStyleClass(element.styleClass, {
              styles: {
                ...styleClass.styles,
                backgroundColor: '',
                backgroundImage: ''
              }
            });
          }
        }
      });
    } else {
      // Restore previous background color or use theme default
      selectedElements.forEach(element => {
        // Get the stored background color
        const storedColorKey = `${currentScreen.id}-${element.id}`;
        const storedColor = backgroundColors?.[storedColorKey] || 
                            quiz.theme?.backgroundColor || '#ffffff';
        
        // For image elements, keep their src attribute and just add the background color
        if (element.type === 'image') {
          // Apply the background color without modifying the src attribute
          const updatedStyles = {
            ...element.styles,
            backgroundColor: storedColor
          };
          
          // Update the element with the restored background color
          updateElement(element.id, {
            styles: updatedStyles
          });
        } else {
          // Apply the background color
          const updatedStyles = {
            ...element.styles,
            backgroundColor: storedColor
          };
          
          // Update the element with the restored background color
          updateElement(element.id, {
            styles: updatedStyles
          });
        }
        
        // If this element has a style class, update the class with the restored background color
        if (element.styleClass && quiz.styleClasses) {
          const styleClass = quiz.styleClasses.find(c => c.id === element.styleClass);
          if (styleClass) {
            updateStyleClass(element.styleClass, {
              styles: {
                ...styleClass.styles,
                backgroundColor: storedColor
              }
            });
          }
        }
      });
    }
  };

  // Local state for the create class dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  // Get available style classes for the selected element type
  const availableStyleClasses = useMemo(() => {
    if (!firstElement || selectedElements.length === 0 || !allSameType || !quiz.styleClasses) {
      return [];
    }
    return quiz.styleClasses.filter(styleClass => styleClass.elementType === firstElement.type);
  }, [quiz.styleClasses, firstElement, selectedElements, allSameType]);

  // Handle creating a new style class
  const handleCreateStyleClass = () => {
    if (!firstElement || !newClassName.trim()) return;
    
    // Create a new style class based on the first selected element
    const newClassId = createStyleClass(newClassName.trim(), firstElement.type, { ...firstElement.styles });
    
    // Reset the input and close the dialog
    setNewClassName('');
    setIsDialogOpen(false);
    
    // Automatically apply the new class to the selected elements
    if (newClassId && selectedElementIds.length > 0) {
      applyStyleClass(selectedElementIds, newClassId);
    }
  };

  // Handle applying a style class to the selected elements
  const handleApplyStyleClass = (classId: string) => {
    if (selectedElementIds.length === 0) return;
    
    // If "theme" is selected, reset to theme styles
    if (classId === 'theme') {
      // First remove the style class
      removeStyleClass(selectedElementIds);
      
      // Then apply theme styles to these elements
      const { applyThemeToElements } = useQuizStore.getState();
      applyThemeToElements({ 
        elementIds: selectedElementIds,
        resetAll: true
      });
      return;
    }
    
    applyStyleClass(selectedElementIds, classId);
  };

  // Handle removing a style class from the selected elements
  const handleRemoveStyleClass = () => {
    if (selectedElementIds.length === 0) return;
    removeStyleClass(selectedElementIds);
  };

  // Local state for renaming a style class
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [classToRename, setClassToRename] = useState<string | null>(null);
  const [newClassNameForRename, setNewClassNameForRename] = useState('');

  // Function to handle renaming a style class
  const handleRenameStyleClass = () => {
    if (!classToRename || !newClassNameForRename.trim()) return;
    
    // Find the class to rename
    const classToUpdate = availableStyleClasses.find(c => c.id === classToRename);
    if (!classToUpdate) return;
    
    // Update the class name
    updateStyleClass(classToRename, {
      name: newClassNameForRename.trim()
    });
    
    // Close the dialog and reset state
    setClassToRename(null);
    setNewClassNameForRename('');
    setIsRenameDialogOpen(false);
  };
  
  // Function to handle duplicating a style class
  const handleDuplicateStyleClass = (classId: string) => {
    // Find the class to duplicate
    const classToDuplicate = availableStyleClasses.find(c => c.id === classId);
    if (!classToDuplicate) return;
    
    // Create a new class with the same properties
    createStyleClass(
      `${classToDuplicate.name} (Copy)`,
      classToDuplicate.elementType,
      { ...classToDuplicate.styles }
    );
  };

  if (selectedElements.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        <p>No elements selected</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-0">
      {/* Dialog for creating new style class */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Style Class</DialogTitle>
            <DialogDescription>
              Create a new style class based on the current element. Changes to any element using this class will affect all others.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="class-name"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Enter class name"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewClassName('');
                setIsDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateStyleClass}
              disabled={!newClassName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for renaming style class */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Style Class</DialogTitle>
            <DialogDescription>
              Enter a new name for this style class.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="rename-class-name"
              value={newClassNameForRename}
              onChange={(e) => setNewClassNameForRename(e.target.value)}
              placeholder="Enter new class name"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewClassNameForRename('');
                setIsRenameDialogOpen(false);
                setClassToRename(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameStyleClass}
              disabled={!newClassNameForRename.trim()}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!allSameType && (
        <div className="bg-muted/40 p-3 rounded-md text-sm text-muted-foreground">
          <p>Multiple element types selected. Only common properties are shown.</p>
        </div>
      )}
      
      {/* Style Classes */}
      {allSameType && (
        <PropertyGroup 
          title="Styles" 
          icon={<Tag className="h-4 w-4" />}
        >
          <div className="space-y-2">
            <Label>Element Style</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  value={firstElement?.styleClass || 'theme'}
                  onValueChange={handleApplyStyleClass}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a style class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theme">Theme Default</SelectItem>
                    {availableStyleClasses.map((styleClass) => (
                      <div key={styleClass.id} className="relative flex items-center group">
                        <SelectItem value={styleClass.id} className="flex-1 pr-8">
                          {styleClass.name}
                        </SelectItem>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-muted"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => {
                                setClassToRename(styleClass.id);
                                setNewClassNameForRename(styleClass.name);
                                setIsRenameDialogOpen(true);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Rename</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                handleDuplicateStyleClass(styleClass.id);
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Duplicate</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                deleteStyleClass(styleClass.id);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Create new style
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </PropertyGroup>
      )}
      
      {/* Typography Controls */}
      {supportedGroups.typography && (
        <PropertyGroup title="Typography" icon={<Type className="h-4 w-4" />}>
          <div className="space-y-2">
            <Label htmlFor="font-family">Font Family</Label>
            <Select
              value={commonProperties.styles?.fontFamily?.toString() || 'sans-serif'}
              onValueChange={(value) => handleStyleChange('fontFamily', value)}
            >
              <SelectTrigger id="font-family" className="w-full">
                <SelectValue placeholder="Select font family" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial, sans-serif" style={{ fontFamily: "Arial, sans-serif" }}>Arial</SelectItem>
                <SelectItem value="Helvetica, sans-serif" style={{ fontFamily: "Helvetica, sans-serif" }}>Helvetica</SelectItem>
                <SelectItem value="Verdana, sans-serif" style={{ fontFamily: "Verdana, sans-serif" }}>Verdana</SelectItem>
                <SelectItem value="Tahoma, sans-serif" style={{ fontFamily: "Tahoma, sans-serif" }}>Tahoma</SelectItem>
                <SelectItem value="'Trebuchet MS', sans-serif" style={{ fontFamily: "'Trebuchet MS', sans-serif" }}>Trebuchet MS</SelectItem>
                <SelectItem value="Georgia, serif" style={{ fontFamily: "Georgia, serif" }}>Georgia</SelectItem>
                <SelectItem value="'Times New Roman', serif" style={{ fontFamily: "'Times New Roman', serif" }}>Times New Roman</SelectItem>
                <SelectItem value="'Courier New', monospace" style={{ fontFamily: "'Courier New', monospace" }}>Courier New</SelectItem>
                <SelectItem value="'Roboto', sans-serif" style={{ fontFamily: "'Roboto', sans-serif" }}>Roboto</SelectItem>
                <SelectItem value="'Open Sans', sans-serif" style={{ fontFamily: "'Open Sans', sans-serif" }}>Open Sans</SelectItem>
                <SelectItem value="'Lato', sans-serif" style={{ fontFamily: "'Lato', sans-serif" }}>Lato</SelectItem>
                <SelectItem value="'Montserrat', sans-serif" style={{ fontFamily: "'Montserrat', sans-serif" }}>Montserrat</SelectItem>
                <SelectItem value="'Source Sans Pro', sans-serif" style={{ fontFamily: "'Source Sans Pro', sans-serif" }}>Source Sans Pro</SelectItem>
                <SelectItem value="'Raleway', sans-serif" style={{ fontFamily: "'Raleway', sans-serif" }}>Raleway</SelectItem>
                <SelectItem value="'Poppins', sans-serif" style={{ fontFamily: "'Poppins', sans-serif" }}>Poppins</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="font-weight">Font Weight</Label>
            <Select
              value={commonProperties.styles?.fontWeight?.toString() || '400'}
              onValueChange={(value) => handleStyleChange('fontWeight', value)}
            >
              <SelectTrigger id="font-weight" className="w-full">
                <SelectValue placeholder="Select font weight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="400">Normal</SelectItem>
                <SelectItem value="700">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Text Color - moved from Colors PropertyGroup */}
          <div className="space-y-2">
            <Label htmlFor="text-color">Text Color</Label>
            <ColorPicker
              value={commonProperties.styles?.color || '#000000'}
              onChange={(value) => handleStyleChange('color', value)}
              placeholder="#000000"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="font-size">Font Size</Label>
            <div className="flex items-center gap-2">
              <Slider 
                id="font-size"
                value={[parseInt(commonProperties.styles?.fontSize?.toString().replace(/px|%/g, '') || '16')]} 
                min={8}
                max={72} 
                step={1} 
                className="flex-1"
                onValueChange={(value: number[]) => {
                  // Get current unit from the fontSize value or default to px
                  const unit = commonProperties.styles?.fontSize?.toString().includes('%') ? '%' : 'px';
                  handleStyleChange('fontSize', `${value[0]}${unit}`);
                }}
              />
              <NumericInput 
                className="w-24" 
                value={commonProperties.styles?.fontSize || '16px'} 
                onChange={(value) => handleStyleChange('fontSize', value)} 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="text-align">Text Alignment</Label>
            <TextAlignButtonGroup
              value={commonProperties.styles?.textAlign?.toString() || 'left'}
              onChange={(value) => handleStyleChange('textAlign', value)}
            />
          </div>
        </PropertyGroup>
      )}
      
      {/* Background PropertyGroup */}
      {supportedGroups.background && (
        <PropertyGroup 
          title="Background" 
          icon={<PaintBucket className="h-4 w-4" />}
          className={(!commonProperties.styles?.backgroundColor && !commonProperties.styles?.backgroundImage && firstElement?.type !== 'image') ? "property-group-no-content" : ""}
          action={
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={handleBackgroundColorToggle}
                  >
                    {(commonProperties.styles?.backgroundColor || commonProperties.styles?.backgroundImage || firstElement?.type === 'image') ? 
                      <Minus className="h-4 w-4" /> : 
                      <Plus className="h-4 w-4" />
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {(commonProperties.styles?.backgroundColor || commonProperties.styles?.backgroundImage) ? "Remove background" : "Add background"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          }
        >
          {(commonProperties.styles?.backgroundColor || commonProperties.styles?.backgroundImage || firstElement?.type === 'image') && (
            <div className="property-group-content">
              <div className="space-y-2">
                <Label htmlFor="background-image">Image</Label>
                <ImageInput 
                  value={
                    firstElement?.type === 'image' 
                      ? (commonProperties.attributes?.src ? `url(${commonProperties.attributes?.src})` : '') 
                      : (commonProperties.styles?.backgroundImage || '')
                  }
                  onChange={(value) => {
                    // Extract the URL from the value (removing url() wrapper)
                    const url = value.replace(/^url\(['"]?|['"]?\)$/g, '');
                    
                    if (firstElement?.type === 'image') {
                      handleAttributeChange('src', url);
                    } else {
                      handleStyleChange('backgroundImage', value);
                    }
                  }}
                  onFitChange={(value) => {
                    if (firstElement?.type === 'image') {
                      handleStyleChange('objectFit', value);
                    } else {
                      handleStyleChange('backgroundSize', value);
                    }
                  }}
                  onAltChange={(value) => {
                    if (firstElement?.type === 'image') {
                      handleAttributeChange('alt', value);
                    } else {
                      handleStyleChange('backgroundImageAlt', value);
                    }
                  }}
                  fitValue={
                    firstElement?.type === 'image' 
                      ? commonProperties.styles?.objectFit as string || 'cover'
                      : commonProperties.styles?.backgroundSize as string || 'cover'
                  }
                  altText={
                    firstElement?.type === 'image' 
                      ? commonProperties.attributes?.alt || ''
                      : commonProperties.styles?.backgroundImageAlt as string || ''
                  }
                  folder="brand-photos"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="background-color">Color</Label>
                <ColorPicker
                  value={commonProperties.styles?.backgroundColor || ''}
                  onChange={(value) => handleStyleChange('backgroundColor', value)}
                  placeholder={firstElement?.type === 'button' ? 'var(--primary)' : 'transparent'}
                />
              </div>
            </div>
          )}
        </PropertyGroup>
      )}
      
      {/* Size Controls */}
      {supportedGroups.size && (
        <PropertyGroup title="Size" icon={<Maximize className="h-4 w-4" />}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
            <Label>Width</Label>
            <NumericInput 
              value={commonProperties.styles?.width || 'auto'}
              onChange={(value) => handleStyleChange('width', value)}
              placeholder="auto"
              className="w-full"
              max={2000}
              allowAuto={true}
              enableUnitToggle={true}
            />
          </div>
          
            <div className="flex flex-col gap-2">
            <Label>Height</Label>
            <NumericInput 
              value={commonProperties.styles?.height || 'auto'}
              onChange={(value) => handleStyleChange('height', value)}
              placeholder="auto"
              className="w-full"
              max={2000}
              allowAuto={true}
              enableUnitToggle={true}
            />
            </div>
          </div>
        </PropertyGroup>
      )}
      
      {/* Spacing Controls */}
      {supportedGroups.spacing && (
        <PropertyGroup 
          title="Spacing" 
          icon={<Box className="h-4 w-4" />}
          action={
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => setExpandedPadding(!expandedPadding)}
                  >
                    {expandedPadding ? 
                      <SlidersHorizontal className="h-4 w-4" /> : 
                      <SlidersVertical className="h-4 w-4" />
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {expandedPadding ? "Simplify padding controls" : "Expand padding controls"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          }
        >
          {!expandedPadding ? (
            // Simple padding mode
            <div className="space-y-2">
              <Label>Padding</Label>
              <div className="flex items-center gap-2">
                <Slider 
                  value={[parseInt(commonProperties.styles?.padding?.toString().split(' ')[0]?.replace(/px|%/g, '') || '0')]} 
                  min={0}
                  max={64} 
                  step={4} 
                  className="flex-1"
                  onValueChange={(value: number[]) => {
                    const paddingValue = value[0];
                    // Get current unit from the padding value or default to px
                    const unit = commonProperties.styles?.padding?.toString().includes('%') ? '%' : 'px';
                    
                    // For buttons, use paddingValue for top/bottom and double it for left/right
                    if (firstElement?.type === 'button') {
                      handleStyleChange('padding', `${paddingValue}${unit} ${paddingValue * 2}${unit}`);
                    } else {
                      handleStyleChange('padding', `${paddingValue}${unit}`);
                    }
                  }}
                />
                <NumericInput 
                  className="w-24" 
                  value={firstElement?.type === 'button' 
                    ? commonProperties.styles?.padding?.toString().split(' ')[0] || '0px'
                    : commonProperties.styles?.padding || '0px'
                  } 
                  onChange={(value) => {
                    // Extract the unit from the new value
                    const unit = value.includes('%') ? '%' : 'px';
                    const numValue = parseInt(value);
                    
                    if (firstElement?.type === 'button') {
                      // Double the numeric value for left/right padding
                      handleStyleChange('padding', `${numValue}${unit} ${numValue * 2}${unit}`);
                    } else {
                      handleStyleChange('padding', value);
                    }
                  }} 
                />
              </div>
            </div>
          ) : (
            // Advanced padding mode with individual controls for each side
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Top padding */}
                <div className="space-y-2">
                  <Label>Top</Label>
                  <div className="flex items-center gap-2">
                    <Slider 
                      value={[parseInt(getPaddingValue('top').toString().replace(/px|%/g, '') || '0')]} 
                      min={0}
                      max={64} 
                      step={4} 
                      className="flex-1"
                      onValueChange={(value: number[]) => {
                        const paddingValue = value[0];
                        // Get current unit from the padding value or default to px
                        const unit = commonProperties.styles?.padding?.toString().includes('%') ? '%' : 'px';
                        handlePaddingChange(`${paddingValue}${unit}`, 'top');
                      }}
                    />
                    <NumericInput 
                      className="w-20" 
                      value={getPaddingValue('top').toString() || '0px'} 
                      onChange={(value) => handlePaddingChange(value, 'top')} 
                    />
                  </div>
                </div>
                
                {/* Right padding */}
                <div className="space-y-2">
                  <Label>Right</Label>
                  <div className="flex items-center gap-2">
                    <Slider 
                      value={[parseInt(getPaddingValue('right').toString().replace(/px|%/g, '') || '0')]} 
                      min={0}
                      max={64} 
                      step={4} 
                      className="flex-1"
                      onValueChange={(value: number[]) => {
                        const paddingValue = value[0];
                        // Get current unit from the padding value or default to px
                        const unit = commonProperties.styles?.padding?.toString().includes('%') ? '%' : 'px';
                        handlePaddingChange(`${paddingValue}${unit}`, 'right');
                      }}
                    />
                    <NumericInput 
                      className="w-20" 
                      value={getPaddingValue('right').toString() || '0px'} 
                      onChange={(value) => handlePaddingChange(value, 'right')} 
                    />
                  </div>
                </div>
                
                {/* Bottom padding */}
                <div className="space-y-2">
                  <Label>Bottom</Label>
                  <div className="flex items-center gap-2">
                    <Slider 
                      value={[parseInt(getPaddingValue('bottom').toString().replace(/px|%/g, '') || '0')]} 
                      min={0}
                      max={64} 
                      step={4} 
                      className="flex-1"
                      onValueChange={(value: number[]) => {
                        const paddingValue = value[0];
                        // Get current unit from the padding value or default to px
                        const unit = commonProperties.styles?.padding?.toString().includes('%') ? '%' : 'px';
                        handlePaddingChange(`${paddingValue}${unit}`, 'bottom');
                      }}
                    />
                    <NumericInput 
                      className="w-20" 
                      value={getPaddingValue('bottom').toString() || '0px'} 
                      onChange={(value) => handlePaddingChange(value, 'bottom')} 
                    />
                  </div>
                </div>
                
                {/* Left padding */}
                <div className="space-y-2">
                  <Label>Left</Label>
                  <div className="flex items-center gap-2">
                    <Slider 
                      value={[parseInt(getPaddingValue('left').toString().replace(/px|%/g, '') || '0')]} 
                      min={0}
                      max={64} 
                      step={4} 
                      className="flex-1"
                      onValueChange={(value: number[]) => {
                        const paddingValue = value[0];
                        // Get current unit from the padding value or default to px
                        const unit = commonProperties.styles?.padding?.toString().includes('%') ? '%' : 'px';
                        handlePaddingChange(`${paddingValue}${unit}`, 'left');
                      }}
                    />
                    <NumericInput 
                      className="w-20" 
                      value={getPaddingValue('left').toString() || '0px'} 
                      onChange={(value) => handlePaddingChange(value, 'left')} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </PropertyGroup>
      )}
      
      {/* Borders Controls */}
      {supportedGroups.borders && (
        <PropertyGroup 
          title="Corners" 
          icon={<BoxSelect className="h-4 w-4" />}
          action={
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => setExpandedCorners(!expandedCorners)}
                  >
                    {expandedCorners ? 
                      <SlidersHorizontal className="h-4 w-4" /> : 
                      <SlidersVertical className="h-4 w-4" />
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {expandedCorners ? "Simplify corner controls" : "Expand corner controls"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          }
        >
          {!expandedCorners ? (
            // Simple border radius mode
            <div className="space-y-2">
              <Label>Border Radius</Label>
              <div className="flex items-center gap-2">
                <Slider 
                  value={[parseInt(commonProperties.styles?.borderRadius?.toString().replace(/px|%/g, '') || '0')]} 
                  min={0}
                  max={32} 
                  step={2} 
                  className="flex-1"
                  onValueChange={(value: number[]) => {
                    // Get current unit from the borderRadius value or default to px
                    const unit = commonProperties.styles?.borderRadius?.toString().includes('%') ? '%' : 'px';
                    handleBorderRadiusChange(`${value[0]}${unit}`);
                  }}
                />
                <NumericInput 
                  className="w-24" 
                  value={commonProperties.styles?.borderRadius || '0px'} 
                  onChange={(value) => handleBorderRadiusChange(value)} 
                />
              </div>
            </div>
          ) : (
            // Advanced border radius mode with individual controls for each corner
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Top Left corner */}
                <div className="space-y-2">
                  <Label>Top Left</Label>
                  <div className="flex items-center gap-2">
                    <Slider 
                      value={[parseInt(getBorderRadiusValue('topLeft').toString().replace(/px|%/g, '') || '0')]} 
                      min={0}
                      max={32} 
                      step={2} 
                      className="flex-1"
                      onValueChange={(value: number[]) => {
                        const radiusValue = value[0];
                        // Get current unit from the radius value or default to px
                        const unit = commonProperties.styles?.borderRadius?.toString().includes('%') ? '%' : 'px';
                        handleBorderRadiusChange(`${radiusValue}${unit}`, 'topLeft');
                      }}
                    />
                    <NumericInput 
                      className="w-20" 
                      value={getBorderRadiusValue('topLeft').toString() || '0px'} 
                      onChange={(value) => handleBorderRadiusChange(value, 'topLeft')} 
                    />
                  </div>
                </div>
                
                {/* Top Right corner */}
                <div className="space-y-2">
                  <Label>Top Right</Label>
                  <div className="flex items-center gap-2">
                    <Slider 
                      value={[parseInt(getBorderRadiusValue('topRight').toString().replace(/px|%/g, '') || '0')]} 
                      min={0}
                      max={32} 
                      step={2} 
                      className="flex-1"
                      onValueChange={(value: number[]) => {
                        const radiusValue = value[0];
                        // Get current unit from the radius value or default to px
                        const unit = commonProperties.styles?.borderRadius?.toString().includes('%') ? '%' : 'px';
                        handleBorderRadiusChange(`${radiusValue}${unit}`, 'topRight');
                      }}
                    />
                    <NumericInput 
                      className="w-20" 
                      value={getBorderRadiusValue('topRight').toString() || '0px'} 
                      onChange={(value) => handleBorderRadiusChange(value, 'topRight')} 
                    />
                  </div>
                </div>
                
                {/* Bottom Right corner */}
                <div className="space-y-2">
                  <Label>Bottom Right</Label>
                  <div className="flex items-center gap-2">
                    <Slider 
                      value={[parseInt(getBorderRadiusValue('bottomRight').toString().replace(/px|%/g, '') || '0')]} 
                      min={0}
                      max={32} 
                      step={2} 
                      className="flex-1"
                      onValueChange={(value: number[]) => {
                        const radiusValue = value[0];
                        // Get current unit from the radius value or default to px
                        const unit = commonProperties.styles?.borderRadius?.toString().includes('%') ? '%' : 'px';
                        handleBorderRadiusChange(`${radiusValue}${unit}`, 'bottomRight');
                      }}
                    />
                    <NumericInput 
                      className="w-20" 
                      value={getBorderRadiusValue('bottomRight').toString() || '0px'} 
                      onChange={(value) => handleBorderRadiusChange(value, 'bottomRight')} 
                    />
                  </div>
                </div>
                
                {/* Bottom Left corner */}
                <div className="space-y-2">
                  <Label>Bottom Left</Label>
                  <div className="flex items-center gap-2">
                    <Slider 
                      value={[parseInt(getBorderRadiusValue('bottomLeft').toString().replace(/px|%/g, '') || '0')]} 
                      min={0}
                      max={32} 
                      step={2} 
                      className="flex-1"
                      onValueChange={(value: number[]) => {
                        const radiusValue = value[0];
                        // Get current unit from the radius value or default to px
                        const unit = commonProperties.styles?.borderRadius?.toString().includes('%') ? '%' : 'px';
                        handleBorderRadiusChange(`${radiusValue}${unit}`, 'bottomLeft');
                      }}
                    />
                    <NumericInput 
                      className="w-20" 
                      value={getBorderRadiusValue('bottomLeft').toString() || '0px'} 
                      onChange={(value) => handleBorderRadiusChange(value, 'bottomLeft')} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </PropertyGroup>
      )}
      
      {/* Drop Shadow Property Group */}
      <PropertyGroup 
        title="Drop Shadow" 
        icon={<CloudLightning className="h-4 w-4" />}
        expanded={expandedSections.shadow}
        onToggle={() => setExpandedSections({...expandedSections, shadow: !expandedSections.shadow})}
        className={commonProperties.styles?.boxShadow || commonProperties.styles?.textShadow ? "" : "property-group-no-content"}
        action={
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => {
                    if (commonProperties.styles?.boxShadow || commonProperties.styles?.textShadow) {
                      // Remove shadow styles
                      selectedElements.forEach(element => {
                        updateElement(element.id, {
                          styles: {
                            ...element.styles,
                            boxShadow: '',
                            textShadow: ''
                          }
                        });
                      });
                    } else {
                      // Add appropriate shadow based on element type
                      selectedElements.forEach(element => {
                        if (element.type === 'button') {
                          updateElement(element.id, {
                            styles: {
                              ...element.styles,
                              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.4)'
                            }
                          });
                        } else if (element.type === 'text' || element.type === 'link') {
                          updateElement(element.id, {
                            styles: {
                              ...element.styles,
                              textShadow: '0px 2px 4px rgba(0, 0, 0, 0.4)'
                            }
                          });
                        }
                      });
                    }
                  }}
                >
                  {commonProperties.styles?.boxShadow || commonProperties.styles?.textShadow ? 
                    <Minus className="h-4 w-4" /> : 
                    <Plus className="h-4 w-4" />
                  }
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {commonProperties.styles?.boxShadow || commonProperties.styles?.textShadow ? "Remove shadow" : "Add shadow"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        }
      >
        {(commonProperties.styles?.boxShadow || commonProperties.styles?.textShadow) && (
          <DropShadowControl
            boxShadow={commonProperties.styles?.boxShadow || ''}
            textShadow={commonProperties.styles?.textShadow || ''}
            hasBackground={!!commonProperties.styles?.backgroundColor}
            onBoxShadowChange={(value) => handleStyleChange('boxShadow', value)}
            onTextShadowChange={(value) => handleStyleChange('textShadow', value)}
          />
        )}
      </PropertyGroup>
      
      {/* Content PropertyGroup */}
      {supportedGroups.content && (
        <PropertyGroup title="Content" icon={<Pencil className="h-4 w-4" />}>
          <div className="space-y-2">
            <Label htmlFor="content">Text</Label>
            <Input
              id="content"
              value={commonProperties.content || ''}
              onChange={handleTextChange}
              placeholder="Enter text"
            />
          </div>
        </PropertyGroup>
      )}
      
      {/* Effects Controls */}
      {supportedGroups.effects && (
        <PropertyGroup title="Effects" icon={<Paintbrush className="h-4 w-4" />}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <DropShadowControl
                value={{
                  x: parseInt(commonProperties.styles?.dropShadowX?.toString() || '0'),
                  y: parseInt(commonProperties.styles?.dropShadowY?.toString() || '0'),
                  blur: parseInt(commonProperties.styles?.dropShadowBlur?.toString() || '0'),
                  color: commonProperties.styles?.dropShadowColor?.toString() || 'rgba(0, 0, 0, 0.2)',
                  enabled: !!commonProperties.styles?.dropShadowColor,
                }}
                onChange={(shadow) => {
                  if (shadow.enabled) {
                    handleStyleChange('dropShadowX', `${shadow.x}px`);
                    handleStyleChange('dropShadowY', `${shadow.y}px`);
                    handleStyleChange('dropShadowBlur', `${shadow.blur}px`);
                    handleStyleChange('dropShadowColor', shadow.color);
                  } else {
                    // If shadow is disabled, remove all shadow properties
                    selectedElements.forEach(element => {
                      updateElement(element.id, {
                        styles: {
                          ...element.styles,
                          dropShadowX: undefined,
                          dropShadowY: undefined,
                          dropShadowBlur: undefined,
                          dropShadowColor: undefined,
                        },
                      });
                    });
                  }
                }}
              />
            </div>
          </div>
        </PropertyGroup>
      )}
    </div>
  );
} 