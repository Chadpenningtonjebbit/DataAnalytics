"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlignItems } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AlignItemsButtonGroupProps {
  value: AlignItems;
  onChange: (value: AlignItems) => void;
  className?: string;
}

export function AlignItemsButtonGroup({ value, onChange, className }: AlignItemsButtonGroupProps) {
  const alignOptions = [
    { value: 'flex-start' as AlignItems, icon: <AlignHorizontalJustifyStart className="h-4 w-4" />, label: 'Horizontal Anchor: Start' },
    { value: 'center' as AlignItems, icon: <AlignHorizontalJustifyCenter className="h-4 w-4" />, label: 'Horizontal Anchor: Center' },
    { value: 'flex-end' as AlignItems, icon: <AlignHorizontalJustifyEnd className="h-4 w-4" />, label: 'Horizontal Anchor: End' },
  ];

  return (
    <TooltipProvider>
      <div className={cn("grid grid-cols-3 gap-1 w-full", className)}>
        {alignOptions.map((option) => (
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