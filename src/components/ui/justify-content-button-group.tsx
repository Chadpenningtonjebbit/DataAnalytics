"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JustifyContent } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface JustifyContentButtonGroupProps {
  value: JustifyContent;
  onChange: (value: JustifyContent) => void;
  className?: string;
}

export function JustifyContentButtonGroup({ value, onChange, className }: JustifyContentButtonGroupProps) {
  const justifyOptions = [
    { value: 'flex-start' as JustifyContent, icon: <AlignVerticalJustifyStart className="h-4 w-4" />, label: 'Vertical Anchor: Start' },
    { value: 'center' as JustifyContent, icon: <AlignVerticalJustifyCenter className="h-4 w-4" />, label: 'Vertical Anchor: Center' },
    { value: 'flex-end' as JustifyContent, icon: <AlignVerticalJustifyEnd className="h-4 w-4" />, label: 'Vertical Anchor: End' },
  ];

  return (
    <TooltipProvider>
      <div className={cn("grid grid-cols-3 gap-1 w-full", className)}>
        {justifyOptions.map((option) => (
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