"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function TestPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Tooltip Test Page</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Shadcn Tooltip</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="default" size="lg">Hover Me (Shadcn)</Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>This is a shadcn tooltip</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-4">Another Shadcn Tooltip</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="default" size="lg">Hover Me (Also Shadcn)</Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>This is another shadcn tooltip</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="mt-8">
        <p>If you don't see tooltips when hovering over the buttons, there might be an issue with your browser or CSS.</p>
      </div>
    </div>
  );
} 