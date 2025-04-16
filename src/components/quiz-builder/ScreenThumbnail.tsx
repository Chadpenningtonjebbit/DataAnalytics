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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import { Copy, Pencil, Trash } from 'lucide-react';
import { useQuizStore } from '@/store/useQuizStore';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  
  // State for rename dialog
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newScreenName, setNewScreenName] = useState(screen.name);
  
  // Get store actions
  const { duplicateScreen, renameScreen } = useQuizStore();
  
  // Callback to handle when the thumbnail is rendered
  const handleThumbnailRender = useCallback((dataUrl: string) => {
    setThumbnailUrl(dataUrl);
  }, []);
  
  // Handle rename
  const handleRename = () => {
    setNewScreenName(screen.name);
    setIsRenameDialogOpen(true);
  };
  
  // Submit rename
  const submitRename = () => {
    if (newScreenName.trim()) {
      renameScreen(screen.id, newScreenName.trim());
      setIsRenameDialogOpen(false);
    }
  };
  
  // Handle duplicate
  const handleDuplicate = () => {
    duplicateScreen(screen.id);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
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
        </ContextMenuTrigger>
        
        <ContextMenuContent className="w-64">
          <ContextMenuItem onClick={handleDuplicate} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
            <ContextMenuShortcut>⌘D</ContextMenuShortcut>
          </ContextMenuItem>
          
          <ContextMenuItem onClick={handleRename} className="cursor-pointer">
            <Pencil className="mr-2 h-4 w-4" />
            Rename
            <ContextMenuShortcut>⌘R</ContextMenuShortcut>
          </ContextMenuItem>
          
          <ContextMenuSeparator />
          
          <ContextMenuItem 
            onClick={onDelete} 
            disabled={!canDelete} 
            className={`${canDelete ? 'cursor-pointer text-destructive hover:text-destructive' : 'cursor-not-allowed opacity-50'}`}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
            <ContextMenuShortcut>⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      
      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Screen</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="screenName"
              value={newScreenName}
              onChange={(e) => setNewScreenName(e.target.value)}
              placeholder="Enter screen name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  submitRename();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRename}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}); 