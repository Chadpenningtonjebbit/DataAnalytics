"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Monitor, Tablet, Smartphone, Plus, Undo, Redo, Trash2, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, Maximize, Minimize, PencilIcon } from 'lucide-react';
import { DroppableArea } from '@/components/quiz-builder/DroppableArea';
import { useQuizStore } from '@/store/useQuizStore';
import { ElementRenderer } from '@/components/quiz-builder/ElementRenderer';
import { SectionType } from '@/types';
import { useTheme } from '@/components/ThemeProvider';
import { usePanelSizes } from './Layout';
import { ScreenThumbnail } from '@/components/quiz-builder/ScreenThumbnail';

export function MainContent() {
  const { 
    quiz, 
    addScreen,
    removeScreen,
    setCurrentScreen,
    setViewMode, 
    viewMode,
    selectElement, 
    selectedElementIds, 
    undo, 
    redo, 
    history, 
    historyIndex, 
    selectSection,
    copySelectedElements,
    pasteElements,
    selectedSectionId,
    groupSelectedElements,
    ungroupElements,
    removeSelectedElements,
    reorderElement,
    setQuiz,
    saveToHistory
  } = useQuizStore();
  
  const { theme } = useTheme();
  // Get panel sizes from context
  const { leftPanelSize, rightPanelSize, isPanelCollapsed } = usePanelSizes();
  
  // Calculate panel width and positioning dynamically with equal gaps on all sides
  // In Layout, the panels have a 16px gap from edges (4px in the "top-4 left-4" class)
  const sideGap = 16; // 16px matches the Layout's spacing
  // When collapsed, use the actual collapsed width (52px) from ResizablePanel
  const collapsedBarWidth = 52;
  const effectiveLeftPanelSize = isPanelCollapsed ? collapsedBarWidth : leftPanelSize;
  const panelWidth = `calc(100vw - ${effectiveLeftPanelSize + rightPanelSize + (sideGap * 4)}px)`;
  const panelLeftPosition = `calc(${effectiveLeftPanelSize}px + ${sideGap * 2}px)`;
  
  // Add zoom state
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // Fixed bottom panel height for thumbnails
  const bottomPanelHeight = 120; // Height for thumbnail section + controls
  
  // Add extra spacing to prevent overlap
  const bottomPanelTotalHeight = bottomPanelHeight + 48; // Include padding and margin
  
  const handleViewModeChange = (mode: string) => {
    console.log('View mode change triggered:', mode);
    setViewMode(mode as 'desktop' | 'tablet' | 'mobile');
    console.log('View mode after change:', viewMode);
  };
  
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the canvas, not on an element or section
    if (e.currentTarget === e.target) {
      selectElement(null);
      selectSection(null);
    }
  };
  
  // Define device sizes
  const deviceSizes = useMemo(() => ({
    desktop: {
      maxWidth: 1280, // Common desktop width
      minWidth: 768, // Minimum desktop width
      maxHeight: 800, // Reasonable height for desktop
      minHeight: 600, // Minimum height
      aspectRatio: 16/10, // Common desktop aspect ratio
    },
    tablet: {
      maxWidth: 768, // Common tablet width (iPad)
      minWidth: 640, // Minimum tablet width
      maxHeight: 1024, // Common tablet height
      minHeight: 600, // Minimum height
      aspectRatio: 4/3, // Common tablet aspect ratio
    },
    mobile: {
      maxWidth: 390, // Common mobile width (iPhone 12/13/14)
      minWidth: 320, // Minimum mobile width
      maxHeight: 844, // Common mobile height
      minHeight: 568, // Minimum height (iPhone SE)
      aspectRatio: 9/19.5, // Common mobile aspect ratio
    }
  }), []);
  
  // Calculate available space for the device
  const [availableWidth, setAvailableWidth] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(0);
  
  // Calculate dynamic device dimensions
  const [deviceDimensions, setDeviceDimensions] = useState({
    width: 0,
    height: 0
  });
  
  // Update available space and device dimensions when panels or view mode changes
  useEffect(() => {
    const updateDimensions = () => {
      // Calculate available space (accounting for padding and margins)
      const mainContentEl = document.querySelector('.flex-1.overflow-auto');
      if (!mainContentEl) return;
      
      const rect = mainContentEl.getBoundingClientRect();
      const contentPadding = 32; // 16px padding on each side
      const headerHeight = 48; // Header height is 12 (h-12 = 3rem = 48px)
      
      // Calculate the actual available width, accounting for side panels
      const actualAvailableWidth = rect.width - contentPadding - effectiveLeftPanelSize - rightPanelSize - (sideGap * 4);
      const availHeight = rect.height - contentPadding - bottomPanelTotalHeight - headerHeight;
      
      setAvailableWidth(actualAvailableWidth);
      setAvailableHeight(availHeight);
      
      // Get current device size configuration
      const deviceConfig = deviceSizes[viewMode];
      
      // Calculate dimensions based on available space and device config
      let width = Math.min(deviceConfig.maxWidth, actualAvailableWidth);
      let height = width / deviceConfig.aspectRatio;
      
      // If height exceeds available height, scale down based on height
      if (height > availHeight) {
        height = availHeight;
        width = height * deviceConfig.aspectRatio;
      }
      
      // Ensure width and height don't go below minimums, but also don't exceed available space
      width = Math.min(Math.max(width, deviceConfig.minWidth), actualAvailableWidth);
      height = Math.min(Math.max(height, deviceConfig.minHeight), availHeight);
      
      // Apply zoom factor
      const zoomFactor = zoomLevel / 100;
      
      // Update device dimensions
      setDeviceDimensions({
        width: width * zoomFactor,
        height: height * zoomFactor
      });
    };
    
    // Initial update
    updateDimensions();
    
    // Add resize event listener
    window.addEventListener('resize', updateDimensions);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [deviceSizes, viewMode, effectiveLeftPanelSize, rightPanelSize, bottomPanelTotalHeight, zoomLevel, sideGap, isPanelCollapsed]);
  
  // Calculate the horizontal offset to center the canvas accounting for unequal panel sizes
  const horizontalOffset = useMemo(() => {
    // Calculate the difference between the left and right panel sizes
    // Use effectiveLeftPanelSize to account for collapsed state
    const panelDifference = effectiveLeftPanelSize - rightPanelSize;
    
    // Return half of the difference to adjust the position
    // If leftPanel is bigger, move canvas right (positive value)
    // If rightPanel is bigger, move canvas left (negative value)
    return panelDifference / 2;
  }, [effectiveLeftPanelSize, rightPanelSize]);
  
  // Get current device size based on view mode
  const currentDeviceSize = deviceSizes[viewMode];
  
  // Check if undo/redo are available
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  
  // Add keyboard shortcuts for undo/redo and copy/paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus is in an input or textarea
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      // Check if the canvas or an element within it is focused or clicked
      const isCanvasFocused = 
        document.activeElement?.hasAttribute('data-canvas') || 
        document.activeElement?.closest('[data-canvas="true"]') !== null;
      
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey && canUndo) {
        e.preventDefault();
        undo();
      }
      
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        if (canRedo) {
          e.preventDefault();
          redo();
        }
      }
      
      // Escape: Deselect all elements and sections
      if (e.key === 'Escape') {
        e.preventDefault();
        selectElement(null);
        selectSection(null);
      }
      
      // Handle arrow keys for moving elements
      if (selectedElementIds.length > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        
        // Map arrow keys to reorder directions
        const directionMap = {
          'ArrowUp': 'up',
          'ArrowDown': 'down',
          'ArrowLeft': 'left',
          'ArrowRight': 'right'
        };
        
        const direction = directionMap[e.key as keyof typeof directionMap];
        
        // If multiple elements are selected and moving down/right, process in reverse order
        // to prevent index conflicts
        if ((direction === 'down' || direction === 'right') && selectedElementIds.length > 1) {
          [...selectedElementIds].reverse().forEach(id => {
            reorderElement(id, direction as 'up' | 'down' | 'left' | 'right');
          });
        } else {
          // For up/left, or single element, process in normal order
          selectedElementIds.forEach(id => {
            reorderElement(id, direction as 'up' | 'down' | 'left' | 'right');
          });
        }
      }
      
      // Global copy: Ctrl+C
      if (e.ctrlKey && e.key === 'c' && selectedElementIds.length > 0) {
        // Check if we're on canvas or element renderer is focused
        const elementRendererFocused = document.activeElement?.closest('.element-renderer') !== null;
        
        if (isCanvasFocused || !elementRendererFocused) {
          e.preventDefault();
          copySelectedElements();
        }
      }
      
      // Global paste: Ctrl+V (when no element has focus)
      if (e.ctrlKey && e.key === 'v') {
        // Check if we're on canvas or element renderer is focused
        const elementRendererFocused = document.activeElement?.closest('.element-renderer') !== null;
        
        if (isCanvasFocused || !elementRendererFocused) {
          e.preventDefault();
          
          // Check if any of the selected elements is a group - paste into that group
          if (selectedElementIds.length === 1) {
            const selectedElementId = selectedElementIds[0];
            const currentScreen = quiz.screens[quiz.currentScreenIndex];
            
            // Check all sections for the selected element
            for (const sectionId of Object.keys(currentScreen.sections) as SectionType[]) {
              const section = currentScreen.sections[sectionId];
              const selectedElement = section.elements.find(el => el.id === selectedElementId);
              
              if (selectedElement && selectedElement.isGroup) {
                // Paste into the selected group
                pasteElements(selectedElement.sectionId, selectedElement.id);
                return;
              }
            }
          }
          
          // Default: paste to the selected section or body if none selected
          pasteElements(selectedSectionId || 'body');
        }
      }
      
      // Delete key: Remove selected elements
      if (e.key === 'Delete' && selectedElementIds.length > 0) {
        e.preventDefault();
        removeSelectedElements();
      }
      
      // Group elements: Ctrl+G
      if (e.ctrlKey && e.key === 'g' && !e.shiftKey && selectedElementIds.length > 1) {
        e.preventDefault();
        groupSelectedElements();
      }
      
      // Ungroup elements: Ctrl+Shift+G
      if (e.ctrlKey && e.shiftKey && e.key === 'g') {
        e.preventDefault();
        // Find if any of the selected elements is a group
        const currentScreen = quiz.screens[quiz.currentScreenIndex];
        for (const sectionId of Object.keys(currentScreen.sections) as SectionType[]) {
          const section = currentScreen.sections[sectionId];
          for (const element of section.elements) {
            if (element.isGroup && selectedElementIds.includes(element.id)) {
              ungroupElements(element.id);
              break;
            }
          }
        }
      }
    };
    
    // Register the keydown handler on the document
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    copySelectedElements, 
    pasteElements, 
    groupSelectedElements, 
    ungroupElements,
    selectedElementIds, 
    selectedSectionId,
    quiz,
    removeSelectedElements,
    reorderElement
  ]);
  
  const currentScreen = quiz.screens[quiz.currentScreenIndex];
  const hasHeader = currentScreen.sections.header.enabled;
  const hasFooter = currentScreen.sections.footer.enabled;
  
  // Function to render a section
  const renderSection = (sectionId: SectionType) => {
    const section = currentScreen.sections[sectionId];
    
    // Create style object for body section height
    const sectionStyle: React.CSSProperties = { 
      boxSizing: 'border-box',
    };
    
    // Add specific styles for body section
    if (sectionId === 'body') {
      sectionStyle.flex = '1 1 auto';
      sectionStyle.height = '100%';
      sectionStyle.overflow = 'auto';
      sectionStyle.display = 'flex';
      sectionStyle.flexDirection = 'column';
    }
    
    return (
      <DroppableArea 
        id={`section-${sectionId}`} 
        sectionId={sectionId}
        className={`
          relative
          ${sectionId === 'header' ? 'border-b border-border' : ''}
          ${sectionId === 'footer' ? 'border-t border-border' : ''}
          ${section.elements.length === 0 ? 'min-h-[60px]' : ''}
          ${sectionId === 'body' ? 'flex-1 h-full overflow-auto' : ''}
        `}
        style={sectionStyle}
      >
        {section.elements.map((element) => (
          <ElementRenderer key={element.id} element={element} />
        ))}
      </DroppableArea>
    );
  };
  
  // Grid background styles based on theme
  const gridBackgroundStyles = theme === 'dark' 
    ? {
        backgroundColor: '#1a1a1a',
        backgroundImage: `
          linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
          linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
        backgroundPosition: '-1px -1px, -1px -1px, -1px -1px, -1px -1px'
      }
    : {
        backgroundColor: '#f5f5f5',
        backgroundImage: `
          linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
          linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
        backgroundPosition: '-1px -1px, -1px -1px, -1px -1px, -1px -1px'
      };
  
  // Function to handle zoom changes
  const handleZoom = (action: 'in' | 'out' | 'reset') => {
    if (action === 'in') {
      setZoomLevel(prev => Math.min(prev + 10, 200));
    } else if (action === 'out') {
      setZoomLevel(prev => Math.max(prev - 10, 50));
    } else {
      setZoomLevel(100);
    }
    // The dimension recalculation will happen automatically via the useEffect
  };
  
  // Apply zoom to canvas
  const canvasStyle = {
    boxSizing: 'border-box' as const,
    width: `${deviceDimensions.width}px`,
    height: `${deviceDimensions.height}px`,
  };
  
  // Function to copy a screen
  const copyScreen = (screenId: string) => {
    const screenToCopy = quiz.screens.find(screen => screen.id === screenId);
    if (screenToCopy) {
      // For now, we're just adding a new screen
      // In a more complete implementation, this would copy the screen content
      addScreen();
    }
  };
  
  // Function to paste into a screen
  const pasteIntoScreen = (screenId: string) => {
    // Set the current screen to the target
    const screenIndex = quiz.screens.findIndex(screen => screen.id === screenId);
    if (screenIndex !== -1) {
      setCurrentScreen(screenIndex);
      // Paste elements to the body section
      pasteElements('body');
    }
  };
  
  // We'll only use transitions for thumbnail collapse/expand, not for resizing
  const getCanvasTransition = () => {
    return `top 0.3s ease-in-out`;
  };
  
  // Update canvas centering when left panel is toggled
  useEffect(() => {
    // Force an immediate resize event to recalculate positions when panel is toggled
    window.dispatchEvent(new Event('resize'));
  }, [isPanelCollapsed]);
  
  return (
    <div className="flex flex-col h-full">
      <div 
        className="flex-1 overflow-auto pt-4 px-4 pb-4 md:p-8 flex items-center justify-center relative"
        style={{
          ...gridBackgroundStyles,
          paddingBottom: `${bottomPanelTotalHeight}px`, // Increased padding to avoid overlap
        }}
      >
        {/* Canvas - centered horizontally and vertically, adjusted for unequal panel sizes */}
        <div 
          className="relative bg-background shadow-lg border border-border mx-auto mt-6 mb-10"
          style={{
            ...canvasStyle,
            position: 'relative',
            left: `${horizontalOffset}px`, // Adjust horizontal position to account for unequal panel sizes
            maxWidth: '100%', // Ensure it doesn't overflow horizontally
            maxHeight: `calc(100vh - ${bottomPanelTotalHeight + 64}px)`, // Increased space for bottom panel
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden', // Prevent canvas from overflowing, let sections handle scrolling
          }}
          onClick={handleCanvasClick}
          tabIndex={0}
          data-canvas="true"
        >
          {/* Device Frame */}
          <div className="absolute inset-0 flex flex-col h-full" style={{ boxSizing: 'border-box' }}>
            {/* Screen Content */}
            <div className="flex flex-col h-full" style={{ boxSizing: 'border-box' }}>
              {/* Sections */}
              <div className="flex flex-col h-full" style={{ boxSizing: 'border-box' }}>
                {hasHeader && renderSection('header')}
                <div className="flex-1 overflow-hidden" style={{ boxSizing: 'border-box' }}>
                  {renderSection('body')}
                </div>
                {hasFooter && renderSection('footer')}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Bottom Screen Navigation and Controls */}
        <div 
          className="absolute bottom-8 z-20" 
          style={{ 
            left: panelLeftPosition, 
            width: panelWidth,
          }}
        >
          <div 
            className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 w-full"
          >
            {/* Screen Thumbnails */}
            <div className="w-full flex flex-col pt-2 pb-1 mb-1">
              <div className="flex gap-2 pb-2 pt-1 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent px-1" style={{ msOverflowStyle: 'none', scrollbarWidth: 'thin' }}>
                {quiz.screens.map((screen, index) => (
                  <ScreenThumbnail 
                    key={screen.id} 
                    screen={screen} 
                    index={index}
                    isActive={quiz.currentScreenIndex === index}
                    onSelect={() => setCurrentScreen(index)}
                    onDelete={() => removeScreen(screen.id)}
                    canDelete={quiz.screens.length > 1}
                    id={`screen-thumbnail-${screen.id}`}
                  />
                ))}
                
                {/* Add Screen button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      onClick={addScreen}
                      className="w-[120px] h-[75px] flex-shrink-0 bg-background border border-dashed border-border rounded-md cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors duration-150 flex items-center justify-center"
                      style={{ aspectRatio: "16/10", maxHeight: "75px" }}
                    >
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Add New Screen</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            {/* Controls - without separator */}
            <div className="flex items-center justify-between">
              {/* Left side: device toggles */}
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={viewMode === 'desktop' ? 'secondary' : 'ghost'} 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => handleViewModeChange('desktop')}
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Desktop View</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={viewMode === 'tablet' ? 'secondary' : 'ghost'} 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => handleViewModeChange('tablet')}
                    >
                      <Tablet className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Tablet View</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={viewMode === 'mobile' ? 'secondary' : 'ghost'} 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => handleViewModeChange('mobile')}
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Mobile View</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* Middle space - empty */}
              <div className="flex-1"></div>
              
              {/* Right side: undo/redo and zoom controls */}
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={undo} 
                      disabled={!canUndo}
                    >
                      <Undo className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Undo (Ctrl+Z)</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={redo} 
                      disabled={!canRedo}
                    >
                      <Redo className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Redo (Ctrl+Y)</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Divider */}
                <div className="h-6 w-px bg-border mx-1"></div>
                
                {/* Zoom controls */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => handleZoom('out')}
                      disabled={zoomLevel <= 50}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Zoom Out</p>
                  </TooltipContent>
                </Tooltip>
                
                <div className="text-xs font-medium w-12 text-center">{zoomLevel}%</div>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => handleZoom('in')}
                      disabled={zoomLevel >= 200}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Zoom In</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 