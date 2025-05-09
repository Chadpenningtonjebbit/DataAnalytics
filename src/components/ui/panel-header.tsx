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
  title: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function PanelHeader({ 
  title, 
  onClose, 
  className 
}: PanelHeaderProps) {
  return (
    <div className="flex flex-col">
      {/* Header with title and close button */}
      <div className="bg-background flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-m font-bold">{title}</h2>
        
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