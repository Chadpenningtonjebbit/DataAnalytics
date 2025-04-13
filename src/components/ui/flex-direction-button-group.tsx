"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FlexDirection } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FlexDirectionButtonGroupProps {
  value: FlexDirection;
  onChange: (value: FlexDirection) => void;
  className?: string;
}

export function FlexDirectionButtonGroup({ value, onChange, className }: FlexDirectionButtonGroupProps) {
  const directionOptions = [
    { value: 'row' as FlexDirection, icon: <ArrowRight className="h-4 w-4" />, label: 'Row (horizontal)' },
    { value: 'column' as FlexDirection, icon: <ArrowDown className="h-4 w-4" />, label: 'Column (vertical)' },
  ];

  return (
    <TooltipProvider>
      <div className={cn("grid grid-cols-2 gap-1 w-full", className)}>
        {directionOptions.map((option) => (
          <Tooltip key={option.value}>
            <TooltipTrigger asChild>
              <Button
                variant={value === option.value ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-full flex justify-center shadow-none"
                onClick={() => onChange(option.value)}
              >
                {option.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{option.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
} 