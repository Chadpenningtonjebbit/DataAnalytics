"use client";

import React, { useState, createContext, useContext } from 'react';
import { Header } from './Header';
import { NestedLeftSidebar } from './NestedLeftSidebar';
import { MainContent } from './MainContent';
import { RightSidebar } from './RightSidebar';
import { DndProvider } from '@/components/quiz-builder/DndProvider';
import { DisableFocus } from '@/components/quiz-builder/DisableFocus';
import { ResizablePanel } from '@/components/ui/resizable-panel';
import { useQuizStore } from '@/store/useQuizStore';

// Set constants for panel sizing
const ICON_BAR_WIDTH = 52;
const RIGHT_PANEL_MAX_WIDTH = 500;

// Create context for panel sizes
export interface PanelSizesContext {
  leftPanelSize: number;
  rightPanelSize: number;
  onLeftPanelCollapsedChange: (collapsed: boolean) => void;
  isPanelCollapsed: boolean;
  iconBarWidth: number;
}

export const PanelSizesContext = createContext<PanelSizesContext>({
  leftPanelSize: 352,
  rightPanelSize: 320,
  onLeftPanelCollapsedChange: () => {},
  isPanelCollapsed: false,
  iconBarWidth: ICON_BAR_WIDTH
});

export const usePanelSizes = () => useContext(PanelSizesContext);

export function Layout({ children }: { children?: React.ReactNode }) {
  const [leftPanelSize, setLeftPanelSize] = useState(352);
  const [rightPanelSize, setRightPanelSize] = useState(320);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  
  // Get selection state from store
  const { selectedElementIds, selectedSectionId } = useQuizStore();
  const hasSelection = selectedElementIds.length > 0 || selectedSectionId !== null;
  
  // Function to be called from NestedLeftSidebar
  const onLeftPanelCollapsedChange = (collapsed: boolean) => {
    setIsPanelCollapsed(collapsed);
  };
  
  return (
    <DndProvider>
      <DisableFocus />
      <PanelSizesContext.Provider value={{ 
        leftPanelSize, 
        rightPanelSize,
        onLeftPanelCollapsedChange,
        isPanelCollapsed,
        iconBarWidth: ICON_BAR_WIDTH
      }}>
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
                defaultSize={leftPanelSize}
                minSize={200}
                maxSize={ICON_BAR_WIDTH + RIGHT_PANEL_MAX_WIDTH}
                onResize={setLeftPanelSize}
                isCollapsed={isPanelCollapsed}
                className="bg-background rounded-lg shadow-xl border border-border overflow-hidden flex flex-col h-full"
              >
                <NestedLeftSidebar />
              </ResizablePanel>
            </div>
            
            {/* Resizable Right Panel - only render when something is selected */}
            {hasSelection && (
              <div className="absolute top-4 right-4 bottom-4 z-30">
                <ResizablePanel 
                  side="right" 
                  defaultSize={320}
                  minSize={240}
                  maxSize={RIGHT_PANEL_MAX_WIDTH}
                  onResize={setRightPanelSize}
                  className="bg-background rounded-lg shadow-xl border border-border overflow-hidden flex flex-col h-full"
                >
                  <RightSidebar />
                </ResizablePanel>
              </div>
            )}
          </div>
        </div>
      </PanelSizesContext.Provider>
    </DndProvider>
  );
} 