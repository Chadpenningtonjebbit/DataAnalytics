"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export type UnitType = 'px' | '%';
export type NumericValueType = number | 'auto';

interface NumericInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  defaultUnit?: UnitType;
  id?: string;
  allowAuto?: boolean;
}

export function NumericInput({
  value,
  onChange,
  className = "w-32",
  placeholder = "0px",
  min = 0,
  max = 1000,
  defaultUnit = 'px',
  id,
  allowAuto = false
}: NumericInputProps) {
  const [isAuto, setIsAuto] = useState(value === 'auto');
  const [numericValue, setNumericValue] = useState<number>(() => {
    if (value === 'auto') return 0;
    const match = value.match(/^(\d+)(px|%)?$/);
    return match ? parseInt(match[1], 10) : 0;
  });
  const [unit, setUnit] = useState<UnitType>(() => {
    if (value === 'auto') return defaultUnit;
    const match = value.match(/^(\d+)(px|%)?$/);
    return match && (match[2] === 'px' || match[2] === '%') ? match[2] : defaultUnit;
  });
  
  // Format the value with the unit
  const formatValue = (num: number, u: UnitType) => `${num}${u}`;
  
  // Update state when prop value changes
  React.useEffect(() => {
    if (value === 'auto') {
      setIsAuto(true);
      return;
    }
    
    const match = value.match(/^(\d+)(px|%)?$/);
    if (match) {
      setIsAuto(false);
      setNumericValue(parseInt(match[1], 10));
      if (match[2] === 'px' || match[2] === '%') {
        setUnit(match[2]);
      }
    } else if (allowAuto) {
      setIsAuto(true);
    }
  }, [value, allowAuto]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Handle 'auto' text input
    if (inputValue === 'auto' && allowAuto) {
      setIsAuto(true);
      onChange('auto');
      return;
    }
    
    // Handle empty input
    if (!inputValue && allowAuto) {
      setIsAuto(true);
      onChange('auto');
      return;
    }
    
    // Extract numeric value from input (remove any non-numeric characters)
    const rawValue = inputValue.replace(/[^\d]/g, '');
    
    // Handle empty numeric input
    if (rawValue === '') {
      if (allowAuto) {
        setIsAuto(true);
        onChange('auto');
      } else {
        setIsAuto(false);
        setNumericValue(0);
        onChange(formatValue(0, unit));
      }
      return;
    }
    
    const newNumericValue = parseInt(rawValue, 10);
    
    // Clamp the value between min and max
    const clampedValue = Math.min(Math.max(newNumericValue, min), max);
    setIsAuto(false);
    setNumericValue(clampedValue);
    
    // Call onChange with the new value and the current unit
    onChange(formatValue(clampedValue, unit));
  };
  
  const handleUnitToggle = () => {
    if (isAuto) return;
    
    // Toggle between px and %
    const newUnit = unit === 'px' ? '%' : 'px';
    setUnit(newUnit);
    onChange(formatValue(numericValue, newUnit));
  };
  
  const handleUnitSelect = (newUnitValue: string) => {
    // Ensure the value is a valid unit type
    if (newUnitValue !== 'px' && newUnitValue !== '%') return;
    
    const newUnit = newUnitValue as UnitType;
    if (isAuto) return;
    setUnit(newUnit);
    onChange(formatValue(numericValue, newUnit));
  };
  
  return (
    <div className="flex relative">
      <Input
        id={id}
        className={`${className} pr-8`} // Add right padding for the unit display
        value={isAuto ? 'auto' : numericValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        type={isAuto ? 'text' : 'number'}
        min={min}
        max={max}
      />
      <div 
        className="absolute inset-y-0 right-0 flex items-center pr-3"
        onClick={(e) => e.stopPropagation()}
      >
        {!isAuto && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="px-1 py-0.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleUnitToggle();
                }}
                aria-label="Toggle unit"
              >
                {unit}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup 
                value={unit} 
                onValueChange={handleUnitSelect}
              >
                <DropdownMenuRadioItem value="px">Pixels (px)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="%">Percent (%)</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
} 