"use client";

import React, { useState, useCallback, useEffect, memo } from 'react';
import { QuizScreen } from '@/types';
import { ThumbnailRenderer } from './ThumbnailRenderer';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScreenThumbnailProps {
  screen: QuizScreen;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  canDelete: boolean;
  id: string;
}

export const ScreenThumbnail = memo(function ScreenThumbnail({ 
  screen, 
  index, 
  isActive, 
  onSelect,
  onDelete,
  canDelete = true,
  id
}: ScreenThumbnailProps) {
  // Calculate aspect ratio based on 16:10 for desktop (default view)
  const aspectRatio = 16 / 10;
  
  // State for the rendered thumbnail
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  
  // Callback to handle when the thumbnail is rendered
  const handleThumbnailRender = useCallback((dataUrl: string) => {
    setThumbnailUrl(dataUrl);
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            id={id}
            onClick={onSelect}
            data-thumbnail-id={screen.id}
            className={`
              w-[120px] h-[75px] flex-shrink-0 bg-card rounded-md cursor-pointer
              transition-all duration-150 overflow-hidden relative
              ${isActive ? 'ring-2 ring-primary ring-offset-1' : 'ring-1 ring-border'}
            `}
            style={{ aspectRatio: `${aspectRatio}`, maxHeight: '75px' }}
          >
            {/* Render the thumbnail using html2canvas */}
            <ThumbnailRenderer 
              screen={screen} 
              onRender={handleThumbnailRender} 
            />
            
            {/* Show thumbnail if available, otherwise show loading */}
            {thumbnailUrl ? (
              <img 
                src={thumbnailUrl} 
                alt={`Screen ${index + 1}`} 
                className="w-full h-full object-cover"
                style={{ pointerEvents: 'none' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-background">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
            
            {/* Screen number badge */}
            <div className="absolute bottom-1 right-1 bg-background/90 text-xs rounded px-1 font-medium text-foreground/80">
              {index + 1}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{screen.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}); 