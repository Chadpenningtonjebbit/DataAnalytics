"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  defaultValue?: string;
  placeholder?: string;
}

// Common colors palette
const COMMON_COLORS = [
  '#000000', // Black
  '#ffffff', // White
  '#f44336', // Red
  '#e91e63', // Pink
  '#9c27b0', // Purple
  '#673ab7', // Deep Purple
  '#3f51b5', // Indigo
  '#2196f3', // Blue
  '#03a9f4', // Light Blue
  '#00bcd4', // Cyan
  '#009688', // Teal
  '#4caf50', // Green
  '#8bc34a', // Light Green
  '#cddc39', // Lime
  '#ffeb3b', // Yellow
  '#ffc107', // Amber
  '#ff9800', // Orange
  '#ff5722', // Deep Orange
  '#795548', // Brown
  '#9e9e9e', // Grey
];

// Store recent colors in localStorage
const RECENT_COLORS_KEY = 'color-picker-recent-colors';
const MAX_RECENT_COLORS = 10;

const getRecentColors = (): string[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load recent colors', error);
    return [];
  }
};

const addRecentColor = (color: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const recentColors = getRecentColors();
    
    // Remove the color if it already exists
    const filteredColors = recentColors.filter(c => c !== color);
    
    // Add the new color at the beginning
    const newRecentColors = [color, ...filteredColors].slice(0, MAX_RECENT_COLORS);
    
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(newRecentColors));
  } catch (error) {
    console.error('Failed to save recent color', error);
  }
};

// Helper functions for color conversion
const hexToRgba = (hex: string, alpha: number = 1): string => {
  try {
    // Remove the hash if it exists
    hex = hex.replace('#', '');
    
    // Convert 3-digit hex to 6-digit
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Check for valid RGB values
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return `rgba(0, 0, 0, ${alpha})`;
    }
    
    // Return rgba string
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (error) {
    return `rgba(0, 0, 0, ${alpha})`;
  }
};

const rgbaToHex = (rgba: string): { hex: string, alpha: number } => {
  try {
    // Extract rgba values using regex
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
    
    if (!match) return { hex: '#ffffff', alpha: 1 };
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const a = match[4] ? parseFloat(match[4]) : 1;
    
    // Convert to hex
    const toHex = (value: number): string => {
      const hex = value.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return {
      hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
      alpha: a
    };
  } catch (error) {
    return { hex: '#ffffff', alpha: 1 };
  }
};

const isRgba = (color: string): boolean => {
  return color?.startsWith('rgba(') || false;
};

const isRgb = (color: string): boolean => {
  return (color?.startsWith('rgb(') && !color?.startsWith('rgba(')) || false;
};

const isHex = (color: string): boolean => {
  return color?.startsWith('#') || false;
};

export function ColorPicker({ 
  label, 
  value, 
  onChange, 
  defaultValue = '', 
  placeholder = '#FFFFFF' 
}: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value || defaultValue);
  const [alpha, setAlpha] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Load recent colors when component mounts
  useEffect(() => {
    setRecentColors(getRecentColors());
  }, []);

  // Update the input value and alpha when the external value changes
  useEffect(() => {
    const newValue = value || defaultValue;
    setInputValue(newValue);
    
    // Extract alpha if it's an rgba value
    if (isRgba(newValue)) {
      const { alpha: extractedAlpha } = rgbaToHex(newValue);
      setAlpha(extractedAlpha);
    } else {
      setAlpha(1);
    }
  }, [value, defaultValue]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHexColor = e.target.value;
    updateColor(newHexColor);
    
    // Keep the popup open when changing color
    e.stopPropagation();
  };

  const handleAlphaChange = (values: number[]) => {
    const newAlpha = values[0] / 100;
    setAlpha(newAlpha);
    
    // If we have a hex color, convert to rgba
    if (isHex(inputValue)) {
      const rgbaColor = hexToRgba(inputValue, newAlpha);
      setInputValue(rgbaColor);
      onChange(rgbaColor);
    } 
    // If we have an rgb color, convert to rgba
    else if (isRgb(inputValue)) {
      const rgbValues = inputValue.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbValues) {
        const rgbaColor = `rgba(${rgbValues[1]}, ${rgbValues[2]}, ${rgbValues[3]}, ${newAlpha})`;
        setInputValue(rgbaColor);
        onChange(rgbaColor);
      }
    }
    // If we already have rgba, just update the alpha
    else if (isRgba(inputValue)) {
      const rgbaValues = inputValue.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[0-9.]+\)/);
      if (rgbaValues) {
        const rgbaColor = `rgba(${rgbaValues[1]}, ${rgbaValues[2]}, ${rgbaValues[3]}, ${newAlpha})`;
        setInputValue(rgbaColor);
        onChange(rgbaColor);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Only update the actual color if it's a valid color format
    if (newValue.match(/^#([0-9A-F]{3}){1,2}$/i) || 
        newValue.match(/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i) ||
        newValue.match(/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i) ||
        newValue === '') {
      onChange(newValue);
      
      // Update alpha if it's an rgba value
      if (isRgba(newValue)) {
        const { alpha: extractedAlpha } = rgbaToHex(newValue);
        setAlpha(extractedAlpha);
      }
      
      // Add to recent colors if it's a valid color
      if (newValue && newValue !== '') {
        addRecentColor(newValue);
        setRecentColors(getRecentColors());
      }
    }
  };

  // Helper function to update color and add to recent colors
  const updateColor = (newColor: string) => {
    // If we have an alpha less than 1, convert to rgba
    if (alpha < 1) {
      const rgbaColor = hexToRgba(newColor, alpha);
      setInputValue(rgbaColor);
      onChange(rgbaColor);
      
      // Add to recent colors
      addRecentColor(rgbaColor);
    } else {
      setInputValue(newColor);
      onChange(newColor);
      
      // Add to recent colors
      addRecentColor(newColor);
    }
    
    // Update recent colors state
    setRecentColors(getRecentColors());
  };

  // Handle click on a color swatch
  const handleSwatchClick = (color: string) => {
    // If it's an rgba color, extract the alpha
    if (isRgba(color)) {
      const { hex, alpha: extractedAlpha } = rgbaToHex(color);
      setAlpha(extractedAlpha);
      
      // If alpha is 1, just use the hex color
      if (extractedAlpha === 1) {
        updateColor(hex);
      } else {
        updateColor(color);
      }
    } else {
      // For hex or rgb colors, just use them directly
      updateColor(color);
    }
  };

  // Ensure we have a valid color for the color input
  const safeColorValue = inputValue && (isHex(inputValue) || isRgb(inputValue) || isRgba(inputValue))
    ? isHex(inputValue) 
      ? inputValue 
      : rgbaToHex(inputValue).hex
    : '#ffffff';

  return (
    <div className="space-y-2">
      <Label htmlFor={`color-${label.toLowerCase().replace(/\s+/g, '-')}`}>{label}</Label>
      <div className="flex items-center">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="h-9 w-10 flex items-center justify-center cursor-pointer rounded-l-md border border-r-0 border-input bg-background shadow-sm relative overflow-hidden"
              aria-label={`Open color picker for ${label}`}
            >
              {/* Checkerboard background for transparency */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
                  backgroundSize: '8px 8px',
                  backgroundPosition: '0 0, 4px 4px'
                }}
              />
              
              {/* Color overlay */}
              <div 
                className="absolute inset-0"
                style={{ backgroundColor: inputValue || 'transparent' }}
              />
              
              {!inputValue && <span className="text-xs text-muted-foreground relative z-10">?</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" side="top" align="start" sideOffset={5}>
            <div className="space-y-3">
              {/* Common Colors */}
              <div className="space-y-1.5">
                <Label className="text-xs">Common Colors</Label>
                <div className="grid grid-cols-10 gap-1">
                  {COMMON_COLORS.map((color, index) => (
                    <button
                      key={`common-${index}`}
                      type="button"
                      className="w-5 h-5 rounded-sm border border-input cursor-pointer"
                      style={{ backgroundColor: color }}
                      onClick={() => handleSwatchClick(color)}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Recent Colors */}
              {recentColors.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Recent Colors</Label>
                  <div className="grid grid-cols-10 gap-1">
                    {recentColors.map((color, index) => (
                      <button
                        key={`recent-${index}`}
                        type="button"
                        className="w-5 h-5 rounded-sm border border-input cursor-pointer"
                        style={{ 
                          backgroundColor: color,
                          backgroundImage: !color ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : 'none',
                          backgroundSize: '4px 4px',
                          backgroundPosition: '0 0, 2px 2px'
                        }}
                        onClick={() => handleSwatchClick(color)}
                        aria-label={`Select recent color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Current color preview with opacity control - moved to bottom */}
              <div className="space-y-2 pt-2 border-t">
                <div className="relative">
                  <div 
                    className="w-full h-10 rounded-sm border border-input"
                    style={{
                      background: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
                      backgroundSize: '8px 8px',
                      backgroundPosition: '0 0, 4px 4px'
                    }}
                  >
                    <div 
                      className="absolute inset-0 rounded-sm"
                      style={{ backgroundColor: inputValue }}
                    />
                  </div>
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={safeColorValue}
                    onChange={handleColorChange}
                    className="opacity-0 absolute inset-0 w-full h-10 cursor-pointer"
                    aria-label={`Select color for ${label}`}
                  />
                </div>
                
                {/* Alpha/Transparency Slider directly below color preview */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-14">Opacity:</Label>
                  <Slider
                    value={[alpha * 100]}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1"
                    onValueChange={handleAlphaChange}
                  />
                  <span className="text-xs w-8 text-right">{Math.round(alpha * 100)}%</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Input
          id={`color-${label.toLowerCase().replace(/\s+/g, '-')}`}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="rounded-l-none"
          onClick={() => setIsOpen(true)}
        />
      </div>
    </div>
  );
} 