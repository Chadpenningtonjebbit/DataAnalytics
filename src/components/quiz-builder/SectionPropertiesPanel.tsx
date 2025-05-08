"use client";

import React, { useState, useEffect } from 'react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Square,
  SlidersHorizontal,
  SlidersVertical,
  Plus,
  Minus,
  ArrowDown,
  PlusCircle,
  MinusCircle,
  ChevronRight,
  RefreshCw,
  ArrowLeftRight,
  CloudLightning
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { FlexDirectionButtonGroup } from '@/components/ui/flex-direction-button-group';
import { JustifyContentButtonGroup } from '@/components/ui/justify-content-button-group';
import { AlignItemsButtonGroup } from '@/components/ui/align-items-button-group';
import { NumericInput } from '@/components/ui/numeric-input';
import { DropShadowControl } from '@/components/ui/dropshadow-control';
import { cn } from '@/lib/utils';
import { MediaPicker } from "@/components/ui/media-picker";
import { ImageInput } from "@/components/ui/image-input";

export function SectionPropertiesPanel() {
  const { 
    quiz, 
    selectedSectionId, 
    updateSectionStyles,
    updateSectionLayout,
    restoreBackgroundColor,
    saveBackgroundColor
  } = useQuizStore();
  
  // State for expanded corners and border controls
  const [expandedCorners, setExpandedCorners] = useState(false);
  // State for layout controls visibility
  const [layoutVisible, setLayoutVisible] = useState(false);
  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState({
    spacing: true,
    background: true,
    corners: true,
    layout: true,
    shadow: true
  });
  
  if (!selectedSectionId) {
    return (
      <div className="text-center text-muted-foreground">
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
  
  const paddingValue = parsePadding(styles.padding);
  const borderRadiusValue = parseBorderRadius(styles.borderRadius as string);
  
  const getBorderRadiusValue = (corner?: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft') => {
    if (!styles.borderRadius) return '0px';
    
    // If it's a single value, return it for all corners
    if (!styles.borderRadius.includes(' ')) {
      return styles.borderRadius;
    }
    
    // Parse individual corner values
    const values = styles.borderRadius.split(' ');
    switch (corner) {
      case 'topLeft':
        return values[0] || '0px';
      case 'topRight':
        return values[1] || '0px';
      case 'bottomRight':
        return values[2] || '0px';
      case 'bottomLeft':
        return values[3] || '0px';
      default:
        return styles.borderRadius;
    }
  };

  const handleBorderRadiusChange = (value: string, corner?: 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft') => {
    if (!corner) {
      // Simple mode - update all corners with the same value
      handleStyleChange('borderRadius', value);
      return;
    }

    // Get current values for all corners
    const currentValues = {
      topLeft: getBorderRadiusValue('topLeft'),
      topRight: getBorderRadiusValue('topRight'),
      bottomRight: getBorderRadiusValue('bottomRight'),
      bottomLeft: getBorderRadiusValue('bottomLeft')
    };

    // Update the specified corner
    currentValues[corner] = value;

    // Combine all values into a single string
    const newBorderRadius = `${currentValues.topLeft} ${currentValues.topRight} ${currentValues.bottomRight} ${currentValues.bottomLeft}`;
    handleStyleChange('borderRadius', newBorderRadius);
  };
  
  // Handle background color toggle
  const handleBackgroundColorToggle = () => {
    if (!selectedSectionId || !currentScreen) return;
    
    const section = currentScreen.sections[selectedSectionId];
    const hasBackground = section.styles?.backgroundColor;
    
    if (hasBackground && section.styles) {
      // Save the current background color before removing it
      saveBackgroundColor(currentScreen.id, selectedSectionId, section.styles.backgroundColor);
      // Remove background color and image
      updateSectionStyles(selectedSectionId, { 
        backgroundColor: '',
        backgroundImage: ''
      });
    } else {
      // Restore previous background color or use theme default
      restoreBackgroundColor(currentScreen.id, selectedSectionId);
    }
  };
  
  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };
  
  return (
    <div className="space-y-0">
      {/* Spacing Controls */}
      <PropertyGroup title="Spacing" icon={<Box className="h-4 w-4" />}>
        <div className="flex flex-col gap-2">
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
      
      {/* Gap PropertyGroup */}
      <PropertyGroup title="Gap" icon={<ArrowLeftRight className="h-4 w-4" />}>
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
        className={section.styles?.backgroundColor ? "" : "property-group-no-content"}
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
                  {section.styles?.backgroundColor ? 
                    <Minus className="h-4 w-4" /> : 
                    <Plus className="h-4 w-4" />
                  }
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {section.styles?.backgroundColor ? "Remove background" : "Add background"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        }
      >
        {section.styles?.backgroundColor && (
          <div className="property-group-content">
            <div className="space-y-2">
              <Label htmlFor="background-image">Image</Label>
              <ImageInput 
                value={section.styles?.backgroundImage || ''} 
                onChange={(value) => handleStyleChange('backgroundImage', value)}
                onFitChange={(value) => handleStyleChange('backgroundSize', value)}
                onAltChange={(value) => handleStyleChange('backgroundImageAlt', value)}
                fitValue={section.styles?.backgroundSize as string || 'cover'}
                altText={section.styles?.backgroundImageAlt as string || ''}
                folder="brand-photos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="background-color">Color</Label>
              <ColorPicker
                value={section.styles.backgroundColor}
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
            <Label htmlFor="border-radius">Border Radius</Label>
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
        ) : (
          // Advanced border radius mode with individual corners
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
                      const unit = styles?.borderRadius?.includes('%') ? '%' : 'px';
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
                      const unit = styles?.borderRadius?.includes('%') ? '%' : 'px';
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
                      const unit = styles?.borderRadius?.includes('%') ? '%' : 'px';
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
                      const unit = styles?.borderRadius?.includes('%') ? '%' : 'px';
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
      
      {/* Layout Controls */}
      <PropertyGroup 
        title="Layout" 
        icon={<Layout className="h-4 w-4" />}
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
    </div>
  );
} 