"use client";

import React, { useState, createContext, useContext } from 'react';
import { Header } from './Header';
import { LeftSidebar } from './LeftSidebar';
import { MainContent } from './MainContent';
import { RightSidebar } from './RightSidebar';
import { DndProvider } from '@/components/quiz-builder/DndProvider';
import { DisableFocus } from '@/components/quiz-builder/DisableFocus';
import { ResizablePanel } from '@/components/ui/resizable-panel';

// Create context for panel sizes
export interface PanelSizesContext {
  leftPanelSize: number;
  rightPanelSize: number;
}

export const PanelSizesContext = createContext<PanelSizesContext>({
  leftPanelSize: 260,
  rightPanelSize: 320
});

export const usePanelSizes = () => useContext(PanelSizesContext);

export function Layout({ children }: { children?: React.ReactNode }) {
  const [leftPanelSize, setLeftPanelSize] = useState(260);
  const [rightPanelSize, setRightPanelSize] = useState(320);
  
  return (
    <DndProvider>
      <DisableFocus />
      <PanelSizesContext.Provider value={{ leftPanelSize, rightPanelSize }}>
        <div className="flex flex-col h-screen">
          <Header />
          <div className="flex-1 overflow-hidden relative">
            {/* Main Content */}
            <main className="w-full h-full overflow-hidden">
              {children || <MainContent />}
            </main>
            
            {/* Resizable Left Panel */}
            <div className="absolute top-4 left-4 bottom-4 z-30">
              <ResizablePanel 
                side="left" 
                defaultSize={260}
                minSize={200}
                maxSize={400}
                onResize={setLeftPanelSize}
                className="bg-background rounded-lg shadow-xl border border-border overflow-hidden flex flex-col h-full"
              >
                <LeftSidebar />
              </ResizablePanel>
            </div>
            
            {/* Resizable Right Panel */}
            <div className="absolute top-4 right-4 bottom-4 z-30">
              <ResizablePanel 
                side="right" 
                defaultSize={320}
                minSize={240}
                maxSize={500}
                onResize={setRightPanelSize}
                className="bg-background rounded-lg shadow-xl border border-border overflow-hidden flex flex-col h-full"
              >
                <RightSidebar />
              </ResizablePanel>
            </div>
          </div>
        </div>
      </PanelSizesContext.Provider>
    </DndProvider>
  );
} 