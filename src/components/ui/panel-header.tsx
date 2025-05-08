"use client";

import React from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PanelHeaderProps {
  title: string;
  onClose?: () => void;
  color?: string;
  className?: string;
}

export function PanelHeader({ 
  title, 
  onClose, 
  color = "#7c3aed", // Default purple color
  className 
}: PanelHeaderProps) {
  return (
    <div className="flex flex-col">
      {/* Thin colored strip at very top */}
      <div className="h-[4px]" style={{ backgroundColor: color }} />
      
      {/* Header with title and close button */}
      <div className="bg-background flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-lg font-medium">{title}</h2>
        
        {onClose && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Close</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
} 