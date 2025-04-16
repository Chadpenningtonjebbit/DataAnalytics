"use client";

import React, { useMemo } from 'react';
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
import { QuizElement, SectionType } from '@/types';
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
  BoxSelect
} from 'lucide-react';
import { TextAlignButtonGroup } from '@/components/ui/text-align-button-group';
import { NumericInput } from '@/components/ui/numeric-input';

export function PropertiesPanel() {
  const { quiz, selectedElementIds, updateElement } = useQuizStore();
  
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
    });
  };
  
  // State for expanded padding/margin controls
  const [expandedPadding, setExpandedPadding] = React.useState(false);
  
  const handlePaddingChange = (value: string, side?: 'top' | 'right' | 'bottom' | 'left') => {
    if (selectedElements.length === 0) return;
    
    // Update padding for all selected elements
    selectedElements.forEach(element => {
      if (!side || !expandedPadding) {
        // Update the element's padding with a single value
        updateElement(element.id, {
          styles: {
            ...element.styles,
            padding: value,
          },
        });
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
        updateElement(element.id, {
          styles: {
            ...element.styles,
            padding: newPadding,
          },
        });
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
  
  if (selectedElements.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Select an element to edit its properties</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 space-y-6">
      {!allSameType && (
        <div className="bg-muted/40 p-3 rounded-md text-sm text-muted-foreground">
          <p>Multiple element types selected. Only common properties are shown.</p>
        </div>
      )}
      
      {/* Content Controls */}
      {(allSameType && firstElement?.type === 'text' && commonProperties.content !== undefined) || 
       (allSameType && firstElement?.type === 'button' && commonProperties.content !== undefined) ? (
        <PropertyGroup title="Content" icon={<Type className="h-4 w-4" />}>
          <div className="space-y-2">
            <Label htmlFor="element-text">
              {firstElement?.type === 'button' ? 'Button Text' : 'Text Content'}
            </Label>
            <Input 
              id="element-text" 
              value={commonProperties.content || ''} 
              onChange={handleTextChange} 
            />
          </div>
        </PropertyGroup>
      ) : null}
      
      {/* Link Controls */}
      {allSameType && firstElement?.type === 'link' && (
        <PropertyGroup title="Link Properties" icon={<LinkIcon className="h-4 w-4" />}>
          <div className="space-y-2">
            <Label htmlFor="link-text">Link Text</Label>
            <Input 
              id="link-text" 
              value={commonProperties.content || ''} 
              onChange={handleTextChange} 
              placeholder="Link text"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input 
              id="link-url" 
              value={commonProperties.attributes?.href || ''} 
              onChange={(e) => handleAttributeChange('href', e.target.value)} 
              placeholder="https://example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="link-target">Open in</Label>
            <Select
              value={commonProperties.attributes?.target || '_self'}
              onValueChange={(value) => handleAttributeChange('target', value)}
            >
              <SelectTrigger id="link-target" className="w-full">
                <SelectValue placeholder="Select target" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_self">Same window</SelectItem>
                <SelectItem value="_blank">New window</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PropertyGroup>
      )}
      
      {/* Image Controls */}
      {allSameType && firstElement?.type === 'image' && (
        <PropertyGroup title="Image Properties" icon={<Image className="h-4 w-4" />}>
          <div className="space-y-2">
            <Label htmlFor="image-src">Image URL</Label>
            <Input 
              id="image-src" 
              value={commonProperties.attributes?.src || ''} 
              onChange={(e) => handleAttributeChange('src', e.target.value)} 
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image-alt">Alt Text</Label>
            <Input 
              id="image-alt" 
              value={commonProperties.attributes?.alt || ''} 
              onChange={(e) => handleAttributeChange('alt', e.target.value)} 
              placeholder="Image description"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image-fit">Image Fit</Label>
            <Select
              value={commonProperties.styles?.objectFit || 'cover'}
              onValueChange={(value) => handleStyleChange('objectFit', value)}
            >
              <SelectTrigger id="image-fit" className="w-full">
                <SelectValue placeholder="Select fit mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">
                  <div className="flex items-center gap-2">
                    <BoxSelect className="h-4 w-4" />
                    <span>Cover (fill & crop)</span>
                  </div>
                </SelectItem>
                <SelectItem value="contain">
                  <div className="flex items-center gap-2">
                    <Minimize className="h-4 w-4" />
                    <span>Contain (fit entire image)</span>
                  </div>
                </SelectItem>
                <SelectItem value="fill">
                  <div className="flex items-center gap-2">
                    <Maximize className="h-4 w-4" />
                    <span>Fill (stretch to fit)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PropertyGroup>
      )}
      
      {/* Style Controls */}
      <PropertyGroup title="Size" icon={<Maximize className="h-4 w-4" />}>
        <div className="space-y-2">
          <Label>Width</Label>
          <NumericInput 
            value={commonProperties.styles?.width || 'auto'}
            onChange={(value) => handleStyleChange('width', value)}
            placeholder="auto"
            className="w-full"
            max={2000}
            allowAuto={true}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Height</Label>
          <NumericInput 
            value={commonProperties.styles?.height || 'auto'}
            onChange={(value) => handleStyleChange('height', value)}
            placeholder="auto"
            className="w-full"
            max={2000}
            allowAuto={true}
          />
        </div>
      </PropertyGroup>
      
      {/* Spacing Controls */}
      <PropertyGroup title="Spacing" icon={<Box className="h-4 w-4" />}>
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
      </PropertyGroup>
      
      {/* Typography Controls */}
      {(allSameType && (firstElement?.type === 'text' || firstElement?.type === 'button' || firstElement?.type === 'link')) && (
        <PropertyGroup title="Typography" icon={<Type className="h-4 w-4" />}>
          <div className="space-y-2">
            <Label htmlFor="font-family">Font Family</Label>
            <Select
              value={commonProperties.styles?.fontFamily?.toString() || 'sans-serif'}
              onValueChange={(value) => handleStyleChange('fontFamily', value)}
            >
              <SelectTrigger className="w-full">
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
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select font weight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="400">Normal</SelectItem>
                <SelectItem value="700">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Font Size</Label>
            <div className="flex items-center gap-2">
              <Slider 
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
            <Label htmlFor="text-align">Text Align</Label>
            <TextAlignButtonGroup
              value={commonProperties.styles?.textAlign?.toString() || 'left'}
              onChange={(value) => handleStyleChange('textAlign', value)}
            />
          </div>
        </PropertyGroup>
      )}
      
      {/* Colors PropertyGroup - moved all color controls here */}
      <PropertyGroup title="Colors" icon={<Palette className="h-4 w-4" />}>
        {/* Text Color */}
        {(allSameType && (firstElement?.type === 'text' || firstElement?.type === 'button' || firstElement?.type === 'link')) && (
          <ColorPicker
            label="Text Color"
            value={commonProperties.styles?.color || '#000000'}
            onChange={(value) => handleStyleChange('color', value)}
            placeholder="#000000"
          />
        )}
        
        {/* Background Color */}
        <ColorPicker
          label="Background Color"
          value={commonProperties.styles?.backgroundColor || 'transparent'}
          onChange={(value) => handleStyleChange('backgroundColor', value)}
          placeholder="transparent"
        />
        
        {/* Border Color - shown only when border width > 0 */}
        {commonProperties.styles?.border !== 'none' && 
         parseInt(commonProperties.styles?.border?.toString().split(' ')[0] || '0') > 0 && (
          <ColorPicker
            label="Border Color"
            value={
              commonProperties.styles?.border === 'none' 
                ? '#e2e8f0' 
                : commonProperties.styles?.border?.toString().split(' ')[2] || '#e2e8f0'
            }
            onChange={(value) => {
              const width = commonProperties.styles?.border?.toString().split(' ')[0] || '1px';
              const style = commonProperties.styles?.border?.toString().split(' ')[1] || 'solid';
              // Ensure the color value is properly formatted
              const color = value.startsWith('#') || value.startsWith('rgb') ? value : `#${value}`;
              handleStyleChange('border', `${width} ${style} ${color}`);
            }}
            placeholder="#e2e8f0"
          />
        )}
      </PropertyGroup>
      
      {/* Border Controls - moved all border controls here, removed background color */}
      <PropertyGroup title="Border & Corners" icon={<BoxSelect className="h-4 w-4" />}>
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
                handleStyleChange('borderRadius', `${value[0]}${unit}`);
              }}
            />
            <NumericInput 
              className="w-24" 
              value={commonProperties.styles?.borderRadius || '0px'} 
              onChange={(value) => handleStyleChange('borderRadius', value)} 
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Border Width</Label>
          <div className="flex items-center gap-2">
            <Slider 
              value={[
                commonProperties.styles?.border === 'none' 
                  ? 0 
                  : parseInt(commonProperties.styles?.border?.toString().split(' ')[0] || '0')
              ]} 
              min={0}
              max={10} 
              step={1} 
              className="flex-1"
              onValueChange={(value: number[]) => {
                const newWidth = value[0];
                if (newWidth === 0) {
                  handleStyleChange('border', 'none');
                } else {
                  const style = commonProperties.styles?.border === 'none' 
                    ? 'solid' 
                    : commonProperties.styles?.border?.toString().split(' ')[1] || 'solid';
                  const color = commonProperties.styles?.border === 'none' 
                    ? '#e2e8f0' 
                    : commonProperties.styles?.border?.toString().split(' ')[2] || '#e2e8f0';
                  handleStyleChange('border', `${newWidth}px ${style} ${color}`);
                }
              }}
            />
            <NumericInput 
              className="w-24" 
              value={
                commonProperties.styles?.border === 'none' 
                  ? '0px' 
                  : commonProperties.styles?.border?.toString().split(' ')[0] || '0px'
              } 
              onChange={(value) => {
                const numValue = parseInt(value);
                if (numValue === 0) {
                  handleStyleChange('border', 'none');
                } else {
                  const style = commonProperties.styles?.border === 'none' 
                    ? 'solid' 
                    : commonProperties.styles?.border?.toString().split(' ')[1] || 'solid';
                  const color = commonProperties.styles?.border === 'none' 
                    ? '#e2e8f0' 
                    : commonProperties.styles?.border?.toString().split(' ')[2] || '#e2e8f0';
                  // Always use px for border width
                  handleStyleChange('border', `${numValue}px ${style} ${color}`);
                }
              }} 
              defaultUnit="px"
            />
          </div>
        </div>
        
        {commonProperties.styles?.border !== 'none' && 
         parseInt(commonProperties.styles?.border?.toString().split(' ')[0] || '0') > 0 && (
          <div className="space-y-2">
            <Label>Border Style</Label>
            <Select
              value={
                commonProperties.styles?.border === 'none' 
                  ? 'solid' 
                  : commonProperties.styles?.border?.toString().split(' ')[1] || 'solid'
              }
              onValueChange={(value) => {
                const width = commonProperties.styles?.border?.toString().split(' ')[0] || '1px';
                const color = commonProperties.styles?.border?.toString().split(' ')[2] || '#e2e8f0';
                handleStyleChange('border', `${width} ${value} ${color}`);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select border style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </PropertyGroup>
      
      {/* Element ID moved to bottom */}
      {selectedElements.length === 1 && (
        <PropertyGroup title="Element Information" icon={<Layers className="h-4 w-4" />}>
          <div className="space-y-2">
            <Label htmlFor="element-id">Element ID</Label>
            <Input 
              id="element-id" 
              value={firstElement?.id} 
              disabled 
            />
          </div>
        </PropertyGroup>
      )}
    </div>
  );
} 