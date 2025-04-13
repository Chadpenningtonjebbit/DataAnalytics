"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function TooltipTestPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Tooltip Test Page</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Basic Tooltip</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="default" size="lg">Hover Me</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>This is a tooltip</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-4">Tooltip with Side</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="lg">Hover Me (Top)</Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>This tooltip appears on top</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-4">Tooltip with Offset</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="lg">Hover Me (Offset)</Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={10}>
                <p>This tooltip has an offset</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-4">Tooltip with Custom Styling</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" size="lg">Hover Me (Custom)</Button>
              </TooltipTrigger>
              <TooltipContent className="bg-destructive text-destructive-foreground">
                <p>This tooltip has custom styling</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="mt-8">
        <p>If you don't see tooltips when hovering over the buttons, there might be an issue with the tooltip implementation.</p>
      </div>
    </div>
  );
} 