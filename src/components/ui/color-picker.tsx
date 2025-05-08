"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RgbaStringColorPicker } from 'react-colorful';
import { useQuizStore } from '@/store/useQuizStore';
import { getQuizColors } from '@/lib/utils';

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  defaultValue?: string;
  placeholder?: string;
}

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
  label = '', 
  value, 
  onChange, 
  defaultValue = '', 
  placeholder = '#FFFFFF' 
}: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value || defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const { quiz } = useQuizStore();
  
  // Get all unique colors used in the quiz
  const quizColors = useMemo(() => {
    if (!quiz) return [];
    return getQuizColors(quiz);
  }, [quiz]);
  
  // Update the input value when the external value changes
  useEffect(() => {
    const newValue = value || defaultValue;
    setInputValue(newValue);
  }, [value, defaultValue]);

  const handleColorChange = (newColor: string) => {
    setInputValue(newColor);
    onChange(newColor);
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
    }
  };

  // Handle click on a color swatch
  const handleSwatchClick = (color: string) => {
    // For any color type, just pass it directly to handleColorChange
    handleColorChange(color);
  };

  // Get a valid color for the color picker or fallback to default
  const displayColor = inputValue || defaultValue || '#ffffff';

  return (
    <div className={label ? "flex flex-col gap-2" : ""}>
      {label && <Label htmlFor={`color-${label.toLowerCase().replace(/\s+/g, '-')}`}>{label}</Label>}
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
                style={{ backgroundColor: displayColor }}
              />
              
              {!inputValue && <span className="text-xs text-muted-foreground relative z-10">?</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" side="left" align="start" alignOffset={0} sideOffset={5}>
            <div className="space-y-3">
              {/* Color Wheel */}
              <div className="space-y-1.5">
                <RgbaStringColorPicker 
                  color={displayColor} 
                  onChange={handleColorChange} 
                  style={{ width: '100%', height: '160px' }}
                />
              </div>
              
              {/* Quiz Colors */}
              {quizColors.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Quiz Colors</Label>
                  <div className="grid grid-cols-10 gap-1">
                    {quizColors.map((color, index) => (
                      <button
                        key={`quiz-${index}`}
                        type="button"
                        className="w-5 h-5 rounded-sm border border-input cursor-pointer"
                        style={{ 
                          backgroundColor: color,
                          backgroundImage: !color ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : 'none',
                          backgroundSize: '4px 4px',
                          backgroundPosition: '0 0, 2px 2px'
                        }}
                        onClick={() => handleSwatchClick(color)}
                        aria-label={`Select quiz color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <Input
          id={`color-${label.toLowerCase().replace(/\s+/g, '-')}`}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="rounded-l-none"
        />
      </div>
    </div>
  );
} 