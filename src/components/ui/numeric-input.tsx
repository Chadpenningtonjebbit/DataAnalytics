"use client";

import React, { useState, useRef } from 'react';
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
  enableUnitToggle?: boolean;
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
  allowAuto = false,
  enableUnitToggle = false
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

  // Store original px value when switching to %
  const originalPxValueRef = useRef<number | null>(null);
  
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
    
    // Use a different max value if the unit is %
    const effectiveMax = unit === '%' ? Math.min(max, 100) : max;
    
    // Clamp the value between min and max
    const clampedValue = Math.min(Math.max(newNumericValue, min), effectiveMax);
    setIsAuto(false);
    setNumericValue(clampedValue);
    
    // If we're in pixel mode, store this value for potential later use
    if (unit === 'px') {
      originalPxValueRef.current = clampedValue;
    }
    
    // Call onChange with the new value and the current unit
    onChange(formatValue(clampedValue, unit));
  };
  
  const handleUnitToggle = () => {
    if (isAuto) return;
    
    // Toggle between px and %
    const newUnit = unit === 'px' ? '%' : 'px';
    setUnit(newUnit);
    
    if (unit === 'px' && newUnit === '%') {
      // Switching from px to %
      // Store the original px value
      originalPxValueRef.current = numericValue;
      
      // Cap the percentage value at 100%
      const percentValue = Math.min(numericValue, 100);
      setNumericValue(percentValue);
      onChange(formatValue(percentValue, newUnit));
    } 
    else if (unit === '%' && newUnit === 'px') {
      // Switching from % to px
      // Restore the original px value if available
      if (originalPxValueRef.current !== null) {
        setNumericValue(originalPxValueRef.current);
        onChange(formatValue(originalPxValueRef.current, newUnit));
      } else {
        // If no original px value is stored, keep the current value
        onChange(formatValue(numericValue, newUnit));
      }
    }
  };
  
  const handleUnitSelect = (newUnitValue: string) => {
    // Ensure the value is a valid unit type
    if (newUnitValue !== 'px' && newUnitValue !== '%') return;
    
    const newUnit = newUnitValue as UnitType;
    if (isAuto) return;
    
    if (unit === 'px' && newUnit === '%') {
      // Switching from px to %
      // Store the original px value
      originalPxValueRef.current = numericValue;
      
      // Cap the percentage value at 100%
      const percentValue = Math.min(numericValue, 100);
      setNumericValue(percentValue);
      setUnit(newUnit);
      onChange(formatValue(percentValue, newUnit));
    } 
    else if (unit === '%' && newUnit === 'px') {
      // Switching from % to px
      // Restore the original px value if available
      if (originalPxValueRef.current !== null) {
        setNumericValue(originalPxValueRef.current);
        setUnit(newUnit);
        onChange(formatValue(originalPxValueRef.current, newUnit));
      } else {
        // If no original px value is stored, keep the current value
        setUnit(newUnit);
        onChange(formatValue(numericValue, newUnit));
      }
    }
    else {
      // Same unit, no change needed
      setUnit(newUnit);
      onChange(formatValue(numericValue, newUnit));
    }
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
          enableUnitToggle ? (
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
          ) : (
            <span className="px-1 py-0.5 text-xs text-muted-foreground">
              {unit}
            </span>
          )
        )}
      </div>
    </div>
  );
} 