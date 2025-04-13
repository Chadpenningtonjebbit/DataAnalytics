"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TextAlignButtonGroupProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TextAlignButtonGroup({ value, onChange, className }: TextAlignButtonGroupProps) {
  const alignOptions = [
    { value: 'left', icon: <AlignLeft className="h-4 w-4" />, label: 'Align Left' },
    { value: 'center', icon: <AlignCenter className="h-4 w-4" />, label: 'Align Center' },
    { value: 'right', icon: <AlignRight className="h-4 w-4" />, label: 'Align Right' },
    { value: 'justify', icon: <AlignJustify className="h-4 w-4" />, label: 'Justify' },
  ];

  return (
    <TooltipProvider>
      <div className={cn("grid grid-cols-4 gap-1 w-full", className)}>
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