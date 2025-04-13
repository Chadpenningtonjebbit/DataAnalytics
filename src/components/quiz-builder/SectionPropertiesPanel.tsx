"use client";

import React from 'react';
import { useQuizStore } from '@/store/useQuizStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorPicker } from '@/components/ui/color-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionType, FlexDirection, FlexWrap, JustifyContent, AlignItems, AlignContent } from '@/types';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { PropertyGroup } from '@/components/ui/property-group';
import { 
  PaintBucket, 
  Layout, 
  BoxSelect,
  Palette,
  Box,
  Maximize,
  Square
} from 'lucide-react';
import { FlexDirectionButtonGroup } from '@/components/ui/flex-direction-button-group';
import { JustifyContentButtonGroup } from '@/components/ui/justify-content-button-group';
import { AlignItemsButtonGroup } from '@/components/ui/align-items-button-group';
import { NumericInput } from '@/components/ui/numeric-input';

export function SectionPropertiesPanel() {
  const { quiz, selectedSectionId, updateSectionStyles, updateSectionLayout } = useQuizStore();
  
  if (!selectedSectionId) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Select a section to edit its properties</p>
      </div>
    );
  }
  
  const currentScreen = quiz.screens[quiz.currentScreenIndex];
  const section = currentScreen.sections[selectedSectionId];
  const styles = section.styles || {};
  const layout = section.layout || { 
    direction: 'row', 
    wrap: 'nowrap', 
    justifyContent: 'center', 
    alignItems: 'center',
    alignContent: 'flex-start',
    gap: '8px' 
  };
  
  const handleStyleChange = (property: string, value: string) => {
    updateSectionStyles(selectedSectionId, {
      [property]: value,
    });
  };
  
  const handleLayoutChange = <K extends keyof typeof layout>(property: K, value: typeof layout[K]) => {
    updateSectionLayout(selectedSectionId, {
      [property]: value,
    });
  };
  
  // Convert gap from px to number for slider
  const gapValue = parseInt(layout.gap.replace('px', '')) || 8;
  
  // Format section name for display (capitalize first letter)
  const sectionDisplayName = selectedSectionId.charAt(0).toUpperCase() + selectedSectionId.slice(1);
  
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
  
  // Parse border properties
  const parseBorder = (borderStr: string = 'none') => {
    if (borderStr === 'none') {
      return {
        style: 'none',
        width: '0px',
        color: '#e2e8f0'
      };
    }
    
    const parts = borderStr.split(' ');
    // Ensure we have a valid color value
    let color = parts[2] || '#e2e8f0';
    // If color doesn't start with #, rgb, or rgba, assume it's a hex color and add #
    if (!color.startsWith('#') && !color.startsWith('rgb')) {
      color = `#${color}`;
    }
    
    return {
      width: parts[0] || '1px',
      style: parts[1] || 'solid',
      color: color
    };
  };
  
  const paddingValue = parsePadding(styles.padding);
  const borderRadiusValue = parseBorderRadius(styles.borderRadius as string);
  const border = parseBorder(styles.border as string);
  
  return (
    <div className="p-4 space-y-6">
      {/* Spacing Controls */}
      <PropertyGroup title="Spacing" icon={<Box className="h-4 w-4" />}>
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
      </PropertyGroup>
      
      {/* Background Controls */}
      <PropertyGroup title="Background" icon={<PaintBucket className="h-4 w-4" />}>
        <ColorPicker
          label="Background Color"
          value={styles.backgroundColor || '#ffffff'}
          onChange={(value) => handleStyleChange('backgroundColor', value)}
          placeholder="#ffffff"
        />
      </PropertyGroup>
      
      {/* Border Controls */}
      <PropertyGroup title="Border & Corners" icon={<BoxSelect className="h-4 w-4" />}>
        <div className="space-y-2">
          <Label htmlFor="border-radius">Corner Radius</Label>
          <div className="flex items-center gap-2">
            <Slider 
              id="border-radius-slider"
              min={0}
              max={32}
              step={2}
              value={[borderRadiusValue]}
              className="flex-1"
              onValueChange={(value) => {
                // Get current unit from the borderRadius value or default to px
                const unit = styles.borderRadius?.includes('%') ? '%' : 'px';
                handleStyleChange('borderRadius', `${value[0]}${unit}`);
              }}
            />
            <NumericInput 
              id="border-radius" 
              className="w-20"
              value={styles.borderRadius || '0px'}
              onChange={(value) => handleStyleChange('borderRadius', value)}
              placeholder="0px" 
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="border-width">Border Width</Label>
          <div className="flex items-center gap-2">
            <Slider 
              id="border-width-slider"
              min={0}
              max={10}
              step={1}
              value={[parseInt(border.width) || 0]}
              className="flex-1"
              onValueChange={(value) => {
                const newWidth = value[0];
                if (newWidth === 0) {
                  handleStyleChange('border', 'none');
                } else {
                  const style = border.style === 'none' ? 'solid' : border.style;
                  handleStyleChange('border', `${newWidth}px ${style} ${border.color}`);
                }
              }}
            />
            <NumericInput 
              id="border-width" 
              className="w-20"
              value={border.style === 'none' ? '0px' : border.width}
              onChange={(value) => {
                const numValue = parseInt(value);
                  if (numValue === 0) {
                    handleStyleChange('border', 'none');
                  } else {
                    const style = border.style === 'none' ? 'solid' : border.style;
                  // Always use px for border width
                    handleStyleChange('border', `${numValue}px ${style} ${border.color}`);
                }
              }}
              defaultUnit="px"
              placeholder="0px" 
            />
          </div>
        </div>
        
        {border.style !== 'none' && parseInt(border.width) > 0 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="border-style">Border Style</Label>
              <Select
                value={border.style === 'none' ? 'solid' : border.style}
                onValueChange={(value) => {
                  handleStyleChange('border', `${border.width} ${value} ${border.color}`);
                }}
              >
                <SelectTrigger id="border-style" className="w-full">
                  <SelectValue placeholder="Select border style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <ColorPicker
              label="Border Color"
              value={border.color}
              onChange={(value) => {
                // Ensure the color value is properly formatted
                const color = value.startsWith('#') || value.startsWith('rgb') ? value : `#${value}`;
                handleStyleChange('border', `${border.width} ${border.style} ${color}`);
              }}
              placeholder="#e2e8f0"
            />
          </>
        )}
      </PropertyGroup>
      
      {/* Layout Controls */}
      <PropertyGroup title="Layout" icon={<Layout className="h-4 w-4" />}>
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
        
        <div className="space-y-2">
          <Label htmlFor="gap">Gap Between Items</Label>
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
            />
          </div>
        </div>
      </PropertyGroup>
    </div>
  );
} 