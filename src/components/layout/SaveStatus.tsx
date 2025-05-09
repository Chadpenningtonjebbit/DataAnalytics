"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useQuizStore } from '@/store/useQuizStore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SaveStatus() {
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved');
  const quiz = useQuizStore((state) => state.quiz);
  
  // Monitor quiz changes and update save status
  useEffect(() => {
    setSaveState('saving');
    
    // Simulate saving delay to match the debounce time (500ms) + a small buffer
    const timer = setTimeout(() => {
      setSaveState('saved');
    }, 800);
    
    return () => clearTimeout(timer);
  }, [quiz]);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-5 w-5 flex items-center justify-center">
            {saveState === 'saving' ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{saveState === 'saving' ? 'Saving...' : 'All changes saved'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 