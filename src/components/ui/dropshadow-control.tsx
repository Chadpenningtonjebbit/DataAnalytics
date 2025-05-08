"use client";

import React, { useState, useEffect } from 'react';
import { ColorPicker } from './color-picker';
import { Slider } from './slider';
import { Label } from './label';
import { NumericInput } from './numeric-input';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Plus, Minus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DropShadowControlProps {
  boxShadow?: string;
  textShadow?: string;
  hasBackground: boolean;
  onBoxShadowChange: (value: string) => void;
  onTextShadowChange: (value: string) => void;
}

// Shadow helper functions
const parseShadow = (shadow: string | undefined, isBox: boolean): { x: number; y: number; blur: number; color: string } => {
  if (!shadow || shadow.trim() === '') {
    return { x: 0, y: 0, blur: 0, color: isBox ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.5)' };
  }

  try {
    // Extract values with regex
    const regex = /(-?\d+)px\s+(-?\d+)px\s+(\d+)px(?:\s+(-?\d+)px)?(?:\s+(.+))?/;
    const match = shadow.match(regex);
    
    if (!match) {
      return { x: 0, y: 0, blur: 0, color: isBox ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.5)' };
    }
    
    return {
      x: parseInt(match[1]),
      y: parseInt(match[2]),
      blur: parseInt(match[3]),
      color: match[5] || (isBox ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.5)')
    };
  } catch (e) {
    console.error("Error parsing shadow value:", shadow, e);
    return { x: 0, y: 0, blur: 0, color: isBox ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.5)' };
  }
};

const createShadowString = (x: number, y: number, blur: number, color: string, isBox: boolean): string => {
  // Ensure color is valid and not undefined
  const safeColor = color || (isBox ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.5)');
  
  // For box-shadow and text-shadow
  return `${x}px ${y}px ${blur}px ${safeColor}`;
};

export function DropShadowControl({ 
  boxShadow, 
  textShadow, 
  hasBackground, 
  onBoxShadowChange, 
  onTextShadowChange 
}: DropShadowControlProps) {
  const [hasShadow, setHasShadow] = useState(!!(hasBackground ? boxShadow : textShadow));
  
  // Parse the initial shadow values
  const shadowType = hasBackground ? 'box' : 'text';
  const shadow = hasBackground ? boxShadow : textShadow;
  
  const parsedShadow = parseShadow(shadow, hasBackground);
  
  const [offset, setOffset] = useState(Math.max(Math.abs(parsedShadow.x), Math.abs(parsedShadow.y)));
  const [blur, setBlur] = useState(parsedShadow.blur);
  const [color, setColor] = useState(parsedShadow.color);
  
  // Update shadow when props change
  useEffect(() => {
    const newShadow = hasBackground ? boxShadow : textShadow;
    const parsed = parseShadow(newShadow, hasBackground);
    
    setHasShadow(!!newShadow);
    setOffset(Math.max(Math.abs(parsed.x), Math.abs(parsed.y)));
    setBlur(parsed.blur);
    setColor(parsed.color);
  }, [boxShadow, textShadow, hasBackground]);
  
  // Handle shadow toggle
  const handleShadowToggle = () => {
    if (hasShadow) {
      if (hasBackground) {
        onBoxShadowChange('');
      } else {
        onTextShadowChange('');
      }
    } else {
      const shadowString = createShadowString(offset, offset, blur, color, hasBackground);
      if (hasBackground) {
        onBoxShadowChange(shadowString);
      } else {
        onTextShadowChange(shadowString);
      }
    }
    setHasShadow(!hasShadow);
  };
  
  // Update the shadow when any value changes
  const updateShadow = () => {
    const shadowString = createShadowString(offset, offset, blur, color, hasBackground);
    
    if (hasBackground) {
      onBoxShadowChange(shadowString);
    } else {
      onTextShadowChange(shadowString);
    }
  };
  
  // Handle changes to individual values
  const handleOffsetChange = (value: number) => {
    setOffset(value);
    const shadowString = createShadowString(value, value, blur, color, hasBackground);
    if (hasBackground) {
      onBoxShadowChange(shadowString);
    } else {
      onTextShadowChange(shadowString);
    }
  };
  
  const handleBlurChange = (value: number) => {
    setBlur(value);
    const shadowString = createShadowString(offset, offset, value, color, hasBackground);
    if (hasBackground) {
      onBoxShadowChange(shadowString);
    } else {
      onTextShadowChange(shadowString);
    }
  };
  
  const handleColorChange = (value: string) => {
    setColor(value);
    const shadowString = createShadowString(offset, offset, blur, value, hasBackground);
    if (hasBackground) {
      onBoxShadowChange(shadowString);
    } else {
      onTextShadowChange(shadowString);
    }
  };
  
  return (
    <div className="space-y-4">
      
      {hasShadow && (
        <>
          <div className="space-y-2">
            <Label>Offset</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[offset]}
                min={0}
                max={20}
                step={1}
                className="flex-1"
                onValueChange={(value) => handleOffsetChange(value[0])}
              />
              <NumericInput
                className="w-20"
                value={`${offset}px`}
                onChange={(value) => handleOffsetChange(parseInt(value))}
                min={0}
                max={20}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Blur</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[blur]}
                min={0}
                max={20}
                step={1}
                className="flex-1"
                onValueChange={(value) => handleBlurChange(value[0])}
              />
              <NumericInput
                className="w-20"
                value={`${blur}px`}
                onChange={(value) => handleBlurChange(parseInt(value))}
                min={0}
                max={20}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Color</Label>
            <ColorPicker
              value={color}
              onChange={handleColorChange}
              placeholder="rgba(0, 0, 0, 0.3)"
            />
          </div>
        </>
      )}
    </div>
  );
} 