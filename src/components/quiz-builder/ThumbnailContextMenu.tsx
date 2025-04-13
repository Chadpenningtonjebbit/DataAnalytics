"use client";

import React, { useState, useEffect } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Copy, Trash2, ClipboardPaste } from 'lucide-react';
import { useQuizStore } from '@/store/useQuizStore';

interface ThumbnailContextMenuProps {
  children: React.ReactNode;
  screenId: string;
  canDelete: boolean;
}

export function ThumbnailContextMenu({
  children,
  screenId,
  canDelete
}: ThumbnailContextMenuProps) {
  const { 
    removeScreen, 
    copyScreen,
    pasteScreenAfter,
    clipboardScreen
  } = useQuizStore();
  
  // Copy the current screen to clipboard
  const handleCopy = () => {
    copyScreen(screenId);
  };
  
  // Paste the screen after this one
  const handlePaste = () => {
    if (!clipboardScreen) return;
    pasteScreenAfter(screenId);
  };
  
  // Delete the screen
  const handleDelete = () => {
    if (canDelete) {
      removeScreen(screenId);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={handleCopy} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          Copy
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        
        {clipboardScreen && (
          <ContextMenuItem onClick={handlePaste} className="cursor-pointer">
            <ClipboardPaste className="mr-2 h-4 w-4" />
            Paste After
            <ContextMenuShortcut>⌘V</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        
        <ContextMenuSeparator />
        
        <ContextMenuItem 
          onClick={handleDelete} 
          disabled={!canDelete} 
          className={`${canDelete ? 'cursor-pointer text-destructive hover:text-destructive' : 'cursor-not-allowed opacity-50'}`}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
} 