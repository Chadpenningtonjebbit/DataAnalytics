"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useQuizStore } from '@/store/useQuizStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorPicker } from '@/components/ui/color-picker';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { FlexDirection, FlexWrap, JustifyContent, AlignItems, AlignContent, QuizElement, SectionType, ElementType } from '@/types';
import { PropertyGroup } from '@/components/ui/property-group';
import { 
  PaintBucket, 
  Layout, 
  BoxSelect,
  Palette,
  Box,
  Maximize,
  Minimize,
  SlidersHorizontal,
  SlidersVertical,
  PanelBottomClose,
  Plus,
  Minus,
  ArrowLeftRight,
  CloudLightning,
  RefreshCw,
  Tag,
  MoreVertical,
  Pencil,
  Trash2
} from 'lucide-react';
import { FlexDirectionButtonGroup } from '@/components/ui/flex-direction-button-group';
import { JustifyContentButtonGroup } from '@/components/ui/justify-content-button-group';
import { AlignItemsButtonGroup } from '@/components/ui/align-items-button-group';
import { NumericInput } from '@/components/ui/numeric-input';
import { DropShadowControl } from '@/components/ui/dropshadow-control';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ChevronRight,
  ChevronsUpDown,
  CircleOff,
  Copy,
  Image,
  CornerDownRight,
  AlignJustify,
  Layers,
} from "lucide-react";
import { MediaPicker } from "@/components/ui/media-picker";
import { ImageInput } from "@/components/ui/image-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { handleRenameStyleClass, handleDuplicateStyleClass } from '@/lib/styleClassUtils';

export function GroupPropertiesPanel() {
  const { 
    quiz, 
    selectedElementIds, 
    updateGroupStyles, 
    updateGroupLayout,
    ungroupElements,
    updateElement,
    saveBackgroundColor,
    restoreBackgroundColor,
    applyThemeToElements,
    applyStyleClass,
    removeStyleClass,
    createStyleClass,
    updateStyleClass,
    deleteStyleClass
  } = useQuizStore();
  
  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState({
    styleClass: true,
    size: true,
    spacing: true,
    background: true,
    corners: true,
    layout: true,
    gap: true,
    shadow: true
  });
  
  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };
  
  // State for expanded padding/margin controls
  const [expandedPadding, setExpandedPadding] = useState(false);
  
  // State for expanded corner controls
  const [expandedCorners, setExpandedCorners] = useState(false);
  
  // State for layout controls visibility
  const [layoutVisible, setLayoutVisible] = useState(false);
  
  // State for style class dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [classToRename, setClassToRename] = useState<string | null>(null);
  const [newClassNameForRename, setNewClassNameForRename] = useState('');
  
  // Get the selected group element
  const [groupElement, setGroupElement] = useState<QuizElement | null>(null);
  
  // Get current screen
  const currentScreen = quiz.screens[quiz.currentScreenIndex];
  
  // Get available style classes for the selected element type
  const availableStyleClasses = useMemo(() => {
    if (!groupElement) return [];
    return quiz.styleClasses?.filter(
      styleClass => styleClass.elementType === groupElement.type
    ) || [];
  }, [quiz.styleClasses, groupElement]);
  
  // Find the selected group element
  useEffect(() => {
    if (selectedElementIds.length !== 1) return;
    
    const elementId = selectedElementIds[0];
    
    // Look for the element in the current screen
    for (const sectionKey of Object.keys(currentScreen.sections) as SectionType[]) {
      const section = currentScreen.sections[sectionKey];
      
      // Check direct children of the section
      const foundElement = section.elements.find((el: QuizElement) => 
        el.id === elementId && (el.isGroup || el.type === 'product')
      );
      
      if (foundElement) {
        setGroupElement(foundElement);
        return;
      }
    }
    
    // If not found, set to null
    setGroupElement(null);
  }, [selectedElementIds, currentScreen, quiz]);
  
  // If no group element is selected, show nothing
  if (!groupElement) return null;
  
  const styles = groupElement.styles || {};
  const layout = groupElement.layout || { 
    direction: 'row', 
    wrap: 'wrap', 
    justifyContent: 'flex-start', 
    alignItems: 'center',
    alignContent: 'flex-start',
    gap: '8px' 
  };
  
  const handleStyleChange = (property: string, value: string) => {
    updateGroupStyles(groupElement!.id, {
      [property]: value,
    });
  };
  
  const handleLayoutChange = <K extends keyof typeof layout>(property: K, value: typeof layout[K]) => {
    updateGroupLayout(groupElement!.id, {
      [property]: value,
    });
  };
  
  const handleUngroup = () => {
    ungroupElements(groupElement!.id);
  };
  
  // Convert gap from px to number for slider
  const gapValue = parseInt(layout.gap.replace('px', '')) || 8;
  
  // Parse padding values
  const parsePadding = (paddingStr: string = '0px') => {
    // Handle single value
    if (paddingStr.split(' ').length === 1) {
      const value = parseInt(paddingStr) || parseInt(paddingStr.replace('px', '')) || 0;
      return value;
    }
    
    // For simplicity, we'll just return the first value if there are multiple
    const firstValue = paddingStr.split(' ')[0];
    return parseInt(firstValue) || parseInt(firstValue.replace('px', '')) || 0;
  };
  
  // Parse border radius
  const parseBorderRadius = (radiusStr: string = '0px') => {
    return parseInt(radiusStr) || parseInt(radiusStr.replace('px', '')) || 0;
  };
  
  const paddingValue = parsePadding(styles.padding);
  const borderRadiusValue = parseBorderRadius(styles.borderRadius as string);
  
  // Helper functions for handling border radius and border width
  const getBorderRadiusValue = (corner?: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft') => {
    if (!corner) return styles.borderRadius || '0px';
    
    const radius = styles.borderRadius?.toString() || '';
    if (!radius || radius === '0px') return '0px';
    
    // If it's a single value, use it for all corners
    if (!radius.includes(' ')) return radius;
    
    // Get individual corner values
    const values = radius.split(' ');
    switch (corner) {
      case 'topLeft': return values[0] || '0px';
      case 'topRight': return values[1] || values[0] || '0px';
      case 'bottomRight': return values[2] || values[0] || '0px';
      case 'bottomLeft': return values[3] || values[0] || '0px';
      default: return '0px';
    }
  };
  
  const handleBorderRadiusChange = (value: string, corner?: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft') => {
    if (!corner) {
      // Simple mode - one value for all corners
      handleStyleChange('borderRadius', value);
      return;
    }
    
    // Get current radius value or default to 0px
    const currentRadius = styles.borderRadius?.toString() || '0px';
    let values = ['0px', '0px', '0px', '0px'];
    
    // If current value has 4 components, parse them
    if (currentRadius.includes(' ')) {
      values = currentRadius.split(' ');
      while (values.length < 4) {
        values.push(values[0]);
      }
    } else if (currentRadius !== '0px') {
      // Single value applied to all corners
      values = [currentRadius, currentRadius, currentRadius, currentRadius];
    }
    
    // Update the specific corner
    switch (corner) {
      case 'topLeft': values[0] = value; break;
      case 'topRight': values[1] = value; break;
      case 'bottomRight': values[2] = value; break;
      case 'bottomLeft': values[3] = value; break;
    }
    
    // If all values are the same, simplify to a single value
    if (values.every(v => v === values[0])) {
      handleStyleChange('borderRadius', values[0]);
    } else {
      handleStyleChange('borderRadius', values.join(' '));
    }
  };
  
  // Handle background color toggle
  const handleBackgroundColorToggle = () => {
    if (styles.backgroundColor) {
      // Save the current background color before removing it
      if (selectedElementIds.length === 1) {
        const element = groupElement;
        if (element) {
          saveBackgroundColor(currentScreen.id, element.id, styles.backgroundColor);
        }
      }
      handleStyleChange('backgroundColor', '');
      handleStyleChange('backgroundImage', '');
    } else {
      // Restore previous background color or use theme default
      if (selectedElementIds.length === 1) {
        const element = groupElement;
        if (element) {
          restoreBackgroundColor(currentScreen.id, element.id);
        }
      } else {
        handleStyleChange('backgroundColor', '#FFFFFF');
      }
    }
  };
  
  // Handle applying a style class to the selected element
  const handleApplyStyleClass = (classId: string) => {
    if (selectedElementIds.length === 0) return;
    
    // If "theme" is selected, reset to theme defaults
    if (classId === 'theme') {
      // Remove the style class
      removeStyleClass(selectedElementIds);
      
      // Apply theme styles to the element
      applyThemeToElements({ 
        elementIds: selectedElementIds,
        resetAll: true
      });
      
      // For product elements, also apply theme to children
      if (groupElement && groupElement.type === 'product' && groupElement.children) {
        // Get each child ID
        const childIds = groupElement.children.map(child => child.id);
        
        // Apply theme to elements
        applyThemeToElements({
          elementIds: childIds,
          resetAll: true
        });
        
        // Special handling for common elements
        const imageElement = groupElement.children.find(child => child.type === 'image');
        const buttonElement = groupElement.children.find(child => child.type === 'button');
        
        // Update image with special style overrides
        if (imageElement) {
          updateElement(imageElement.id, {
            styles: {
              ...imageElement.styles,
              width: '100%',
              height: 'auto',
              borderRadius: '8px',
              aspectRatio: '1',
              objectFit: 'cover'
            }
          });
        }
        
        // Update button with special style overrides
        if (buttonElement) {
          updateElement(buttonElement.id, {
            styles: {
              ...buttonElement.styles,
              width: '100%',
              marginTop: '8px'
            }
          });
        }
      }
      
      return;
    }
    
    // Apply the selected style class
    applyStyleClass(selectedElementIds, classId);
  };
  
  // Handle creating a new style class
  const handleCreateStyleClass = () => {
    if (!groupElement || !newClassName.trim()) return;
    
    // Create a new style class based on the current element
    const newClassId = createStyleClass(newClassName.trim(), groupElement.type, { ...groupElement.styles });
    
    // Reset the input and close the dialog
    setNewClassName('');
    setIsDialogOpen(false);
    
    // Automatically apply the new class to the selected element
    if (newClassId && selectedElementIds.length > 0) {
      applyStyleClass(selectedElementIds, newClassId);
    }
  };
  
  // Handle renaming a style class
  const handleRenameClass = () => {
    const success = handleRenameStyleClass(
      classToRename,
      newClassNameForRename,
      availableStyleClasses,
      updateStyleClass
    );
    
    if (success) {
      // Close the dialog and reset state
      setClassToRename(null);
      setNewClassNameForRename('');
      setIsRenameDialogOpen(false);
    }
  };
  
  // Handle duplicating a style class
  const handleDuplicateClass = (classId: string) => {
    handleDuplicateStyleClass(
      classId,
      availableStyleClasses,
      createStyleClass
    );
  };
  
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
              onClick={handleRenameClass}
              disabled={!newClassNameForRename.trim()}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Style Classes */}
      <PropertyGroup 
        title="Styles" 
        icon={<Tag className="h-4 w-4" />}
        expanded={expandedSections.styleClass}
        onToggle={() => toggleSection('styleClass')}
      >
        <div className="space-y-2">
          <Label>Element Style</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select
                value={groupElement?.styleClass || 'theme'}
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
                              handleDuplicateClass(styleClass.id);
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
      
      {/* Size Controls */}
      <PropertyGroup 
        title="Size" 
        icon={<Maximize className="h-4 w-4" />}
        expanded={expandedSections.size}
        onToggle={() => toggleSection('size')}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
          <Label>Width</Label>
          <NumericInput 
            value={styles.width || 'auto'} 
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
            value={styles.height || 'auto'} 
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
      
      {/* Spacing Controls */}
      <PropertyGroup 
        title="Spacing" 
        icon={<PanelBottomClose className="h-4 w-4" />}
        expanded={expandedSections.spacing}
        onToggle={() => toggleSection('spacing')}
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
            <Label htmlFor="padding">Padding</Label>
            <div className="flex items-center gap-2">
              <Slider
                id="padding-slider"
                min={0}
                max={64}
                step={4}
                value={[paddingValue]}
                className="flex-1"
                onValueChange={(value) => {
                  // Get current unit from the padding value or default to px
                  const unit = styles.padding?.includes('%') ? '%' : 'px';
                  handleStyleChange('padding', `${value[0]}${unit}`);
                }}
              />
              <NumericInput 
                id="padding"
                className="w-20"
                value={styles.padding || '0px'}
                onChange={(value) => handleStyleChange('padding', value)}
                placeholder="0px"
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
                    min={0}
                    max={64} 
                    step={4} 
                    value={[paddingValue]} 
                    className="flex-1"
                    onValueChange={(value: number[]) => {
                      // Get current unit from the padding value or default to px
                      const unit = styles.padding?.includes('%') ? '%' : 'px';
                      const paddingValue = `${value[0]}${unit}`;
                      
                      // Create a padding string with the new top value
                      const currentPadding = styles.padding || '0px';
                      const paddingValues = currentPadding.split(' ');
                      let newPadding;
                      
                      if (paddingValues.length === 1) {
                        // If we have a single value, expand to 4 values
                        newPadding = `${paddingValue} ${currentPadding} ${currentPadding} ${currentPadding}`;
                      } else if (paddingValues.length === 4) {
                        // If we already have 4 values, update just the top
                        newPadding = `${paddingValue} ${paddingValues[1]} ${paddingValues[2]} ${paddingValues[3]}`;
                      } else {
                        // Default to 4 identical values
                        newPadding = `${paddingValue} ${paddingValue} ${paddingValue} ${paddingValue}`;
                      }
                      
                      handleStyleChange('padding', newPadding);
                    }}
                  />
                  <NumericInput 
                    className="w-20" 
                    value={paddingValue + (styles.padding?.includes('%') ? '%' : 'px')} 
                    onChange={(value) => {
                      // Create a padding string with the new top value
                      const currentPadding = styles.padding || '0px';
                      const paddingValues = currentPadding.split(' ');
                      let newPadding;
                      
                      if (paddingValues.length === 1) {
                        // If we have a single value, expand to 4 values
                        newPadding = `${value} ${currentPadding} ${currentPadding} ${currentPadding}`;
                      } else if (paddingValues.length === 4) {
                        // If we already have 4 values, update just the top
                        newPadding = `${value} ${paddingValues[1]} ${paddingValues[2]} ${paddingValues[3]}`;
                      } else {
                        // Default to 4 identical values
                        newPadding = `${value} ${value} ${value} ${value}`;
                      }
                      
                      handleStyleChange('padding', newPadding);
                    }} 
                  />
                </div>
              </div>
              
              {/* Right padding */}
              <div className="space-y-2">
                <Label>Right</Label>
                <div className="flex items-center gap-2">
                  <Slider 
                    min={0}
                    max={64} 
                    step={4} 
                    value={[paddingValue]} 
                    className="flex-1"
                    onValueChange={(value: number[]) => {
                      // Get current unit from the padding value or default to px
                      const unit = styles.padding?.includes('%') ? '%' : 'px';
                      const paddingValue = `${value[0]}${unit}`;
                      
                      // Create a padding string with the new right value
                      const currentPadding = styles.padding || '0px';
                      const paddingValues = currentPadding.split(' ');
                      let newPadding;
                      
                      if (paddingValues.length === 1) {
                        // If we have a single value, expand to 4 values
                        newPadding = `${currentPadding} ${paddingValue} ${currentPadding} ${currentPadding}`;
                      } else if (paddingValues.length === 4) {
                        // If we already have 4 values, update just the right
                        newPadding = `${paddingValues[0]} ${paddingValue} ${paddingValues[2]} ${paddingValues[3]}`;
                      } else {
                        // Default to 4 identical values
                        newPadding = `${paddingValue} ${paddingValue} ${paddingValue} ${paddingValue}`;
                      }
                      
                      handleStyleChange('padding', newPadding);
                    }}
                  />
                  <NumericInput 
                    className="w-20" 
                    value={paddingValue + (styles.padding?.includes('%') ? '%' : 'px')} 
                    onChange={(value) => {
                      // Create a padding string with the new right value
                      const currentPadding = styles.padding || '0px';
                      const paddingValues = currentPadding.split(' ');
                      let newPadding;
                      
                      if (paddingValues.length === 1) {
                        // If we have a single value, expand to 4 values
                        newPadding = `${currentPadding} ${value} ${currentPadding} ${currentPadding}`;
                      } else if (paddingValues.length === 4) {
                        // If we already have 4 values, update just the right
                        newPadding = `${paddingValues[0]} ${value} ${paddingValues[2]} ${paddingValues[3]}`;
                      } else {
                        // Default to 4 identical values
                        newPadding = `${value} ${value} ${value} ${value}`;
                      }
                      
                      handleStyleChange('padding', newPadding);
                    }} 
                  />
                </div>
              </div>
              
              {/* Bottom padding */}
              <div className="space-y-2">
                <Label>Bottom</Label>
                <div className="flex items-center gap-2">
                  <Slider 
                    min={0}
                    max={64} 
                    step={4} 
                    value={[paddingValue]} 
                    className="flex-1"
                    onValueChange={(value: number[]) => {
                      // Get current unit from the padding value or default to px
                      const unit = styles.padding?.includes('%') ? '%' : 'px';
                      const paddingValue = `${value[0]}${unit}`;
                      
                      // Create a padding string with the new bottom value
                      const currentPadding = styles.padding || '0px';
                      const paddingValues = currentPadding.split(' ');
                      let newPadding;
                      
                      if (paddingValues.length === 1) {
                        // If we have a single value, expand to 4 values
                        newPadding = `${currentPadding} ${currentPadding} ${paddingValue} ${currentPadding}`;
                      } else if (paddingValues.length === 4) {
                        // If we already have 4 values, update just the bottom
                        newPadding = `${paddingValues[0]} ${paddingValues[1]} ${paddingValue} ${paddingValues[3]}`;
                      } else {
                        // Default to 4 identical values
                        newPadding = `${paddingValue} ${paddingValue} ${paddingValue} ${paddingValue}`;
                      }
                      
                      handleStyleChange('padding', newPadding);
                    }}
                  />
                  <NumericInput 
                    className="w-20" 
                    value={paddingValue + (styles.padding?.includes('%') ? '%' : 'px')} 
                    onChange={(value) => {
                      // Create a padding string with the new bottom value
                      const currentPadding = styles.padding || '0px';
                      const paddingValues = currentPadding.split(' ');
                      let newPadding;
                      
                      if (paddingValues.length === 1) {
                        // If we have a single value, expand to 4 values
                        newPadding = `${currentPadding} ${currentPadding} ${value} ${currentPadding}`;
                      } else if (paddingValues.length === 4) {
                        // If we already have 4 values, update just the bottom
                        newPadding = `${paddingValues[0]} ${paddingValues[1]} ${value} ${paddingValues[3]}`;
                      } else {
                        // Default to 4 identical values
                        newPadding = `${value} ${value} ${value} ${value}`;
                      }
                      
                      handleStyleChange('padding', newPadding);
                    }} 
                  />
                </div>
              </div>
              
              {/* Left padding */}
              <div className="space-y-2">
                <Label>Left</Label>
                <div className="flex items-center gap-2">
                  <Slider 
                    min={0}
                    max={64} 
                    step={4} 
                    value={[paddingValue]} 
                    className="flex-1"
                    onValueChange={(value: number[]) => {
                      // Get current unit from the padding value or default to px
                      const unit = styles.padding?.includes('%') ? '%' : 'px';
                      const paddingValue = `${value[0]}${unit}`;
                      
                      // Create a padding string with the new left value
                      const currentPadding = styles.padding || '0px';
                      const paddingValues = currentPadding.split(' ');
                      let newPadding;
                      
                      if (paddingValues.length === 1) {
                        // If we have a single value, expand to 4 values
                        newPadding = `${currentPadding} ${currentPadding} ${currentPadding} ${paddingValue}`;
                      } else if (paddingValues.length === 4) {
                        // If we already have 4 values, update just the left
                        newPadding = `${paddingValues[0]} ${paddingValues[1]} ${paddingValues[2]} ${paddingValue}`;
                      } else {
                        // Default to 4 identical values
                        newPadding = `${paddingValue} ${paddingValue} ${paddingValue} ${paddingValue}`;
                      }
                      
                      handleStyleChange('padding', newPadding);
                    }}
                  />
                  <NumericInput 
                    className="w-20" 
                    value={paddingValue + (styles.padding?.includes('%') ? '%' : 'px')} 
                    onChange={(value) => {
                      // Create a padding string with the new left value
                      const currentPadding = styles.padding || '0px';
                      const paddingValues = currentPadding.split(' ');
                      let newPadding;
                      
                      if (paddingValues.length === 1) {
                        // If we have a single value, expand to 4 values
                        newPadding = `${currentPadding} ${currentPadding} ${currentPadding} ${value}`;
                      } else if (paddingValues.length === 4) {
                        // If we already have 4 values, update just the left
                        newPadding = `${paddingValues[0]} ${paddingValues[1]} ${paddingValues[2]} ${value}`;
                      } else {
                        // Default to 4 identical values
                        newPadding = `${value} ${value} ${value} ${value}`;
                      }
                      
                      handleStyleChange('padding', newPadding);
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </PropertyGroup>
      
      {/* Gap PropertyGroup */}
      <PropertyGroup 
        title="Gap" 
        icon={<ArrowLeftRight className="h-4 w-4" />}
        expanded={expandedSections.gap || false}
        onToggle={() => toggleSection('gap')}
      >
        <div className="space-y-2">
          <Label htmlFor="gap">Gap</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="gap-slider"
              min={0}
              max={48}
              step={4}
              value={[gapValue]}
              className="flex-1"
              onValueChange={(value) => {
                // Get current unit from the gap value or default to px
                const unit = layout.gap.includes('%') ? '%' : 'px';
                handleLayoutChange('gap', `${value[0]}${unit}`);
              }}
            />
            <NumericInput 
              id="gap"
              className="w-20"
              value={layout.gap}
              onChange={(value) => handleLayoutChange('gap', value)}
              placeholder="8px"
              enableUnitToggle={true}
            />
          </div>
        </div>
      </PropertyGroup>
      
      {/* Background PropertyGroup */}
      <PropertyGroup 
        title="Background" 
        icon={<PaintBucket className="h-4 w-4" />}
        className={styles.backgroundColor ? "" : "property-group-no-content"}
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
                  {styles.backgroundColor ? 
                    <Minus className="h-4 w-4" /> : 
                    <Plus className="h-4 w-4" />
                  }
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {styles.backgroundColor ? "Remove background" : "Add background"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        }
      >
        {styles.backgroundColor && (
          <div className="property-group-content">
            <div className="space-y-2">
              <Label htmlFor="background-image">Image</Label>
              <ImageInput 
                value={styles.backgroundImage || ''} 
                onChange={(value) => handleStyleChange('backgroundImage', value)}
                onFitChange={(value) => handleStyleChange('backgroundSize', value)}
                onAltChange={(value) => handleStyleChange('backgroundImageAlt', value)}
                fitValue={styles.backgroundSize as string || 'cover'}
                altText={styles.backgroundImageAlt as string || ''}
                folder="brand-photos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="background-color">Color</Label>
              <ColorPicker
                value={styles.backgroundColor}
                onChange={(value) => handleStyleChange('backgroundColor', value)}
                placeholder="transparent"
              />
            </div>
          </div>
        )}
      </PropertyGroup>
      
      {/* Corners PropertyGroup */}
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
                value={[parseInt(styles?.borderRadius?.toString().replace(/px|%/g, '') || '0')]} 
                min={0}
                max={32} 
                step={2} 
                className="flex-1"
                onValueChange={(value: number[]) => {
                  // Get current unit from the borderRadius value or default to px
                  const unit = styles?.borderRadius?.toString().includes('%') ? '%' : 'px';
                  handleBorderRadiusChange(`${value[0]}${unit}`);
                }}
              />
              <NumericInput 
                className="w-24" 
                value={styles?.borderRadius || '0px'} 
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
                      const unit = styles?.borderRadius?.toString().includes('%') ? '%' : 'px';
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
                      const unit = styles?.borderRadius?.toString().includes('%') ? '%' : 'px';
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
                      const unit = styles?.borderRadius?.toString().includes('%') ? '%' : 'px';
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
                      const unit = styles?.borderRadius?.toString().includes('%') ? '%' : 'px';
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
      
      {/* Drop Shadow Property Group */}
      <PropertyGroup 
        title="Drop Shadow" 
        icon={<CloudLightning className="h-4 w-4" />}
        expanded={expandedSections.shadow}
        onToggle={() => toggleSection('shadow')}
        className={styles?.boxShadow || styles?.textShadow ? "" : "property-group-no-content"}
        action={
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => {
                    if (styles?.boxShadow || styles?.textShadow) {
                      handleStyleChange('boxShadow', '');
                      handleStyleChange('textShadow', '');
                    } else {
                      handleStyleChange('boxShadow', '0px 4px 8px rgba(0, 0, 0, 0.4)');
                    }
                  }}
                >
                  {styles?.boxShadow || styles?.textShadow ? 
                    <Minus className="h-4 w-4" /> : 
                    <Plus className="h-4 w-4" />
                  }
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {styles?.boxShadow || styles?.textShadow ? "Remove shadow" : "Add shadow"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        }
      >
        {(styles?.boxShadow || styles?.textShadow) && (
          <DropShadowControl
            boxShadow={styles?.boxShadow || ''}
            textShadow={styles?.textShadow || ''}
            hasBackground={!!styles?.backgroundColor}
            onBoxShadowChange={(value) => handleStyleChange('boxShadow', value)}
            onTextShadowChange={(value) => handleStyleChange('textShadow', value)}
          />
        )}
      </PropertyGroup>
      
      {/* Layout Controls */}
      <PropertyGroup 
        title="Layout" 
        icon={<Layout className="h-4 w-4" />}
        expanded={expandedSections.layout}
        onToggle={() => toggleSection('layout')}
        className={layoutVisible ? "" : "property-group-no-content"}
        action={
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => setLayoutVisible(!layoutVisible)}
                >
                  {layoutVisible ? 
                    <Minus className="h-4 w-4" /> : 
                    <Plus className="h-4 w-4" />
                  }
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {layoutVisible ? "Hide layout options" : "Show layout options"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        }
      >
        {layoutVisible && (
          <>
            <div className="space-y-2">
              <Label htmlFor="direction">Direction</Label>
              <FlexDirectionButtonGroup
                value={layout.direction}
                onChange={(value) => handleLayoutChange('direction', value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="justifyContent">Vertical Anchor</Label>
              <JustifyContentButtonGroup
                value={layout.justifyContent}
                onChange={(value) => handleLayoutChange('justifyContent', value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="alignItems">Horizontal Anchor</Label>
              <AlignItemsButtonGroup
                value={layout.alignItems}
                onChange={(value) => handleLayoutChange('alignItems', value)}
              />
            </div>
          </>
        )}
      </PropertyGroup>
    </div>
  );
} 