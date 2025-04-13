"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Monitor, Tablet, Smartphone, Plus, Undo, Redo, Trash2, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react';
import { DroppableArea } from '@/components/quiz-builder/DroppableArea';
import { useQuizStore } from '@/store/useQuizStore';
import { ElementRenderer } from '@/components/quiz-builder/ElementRenderer';
import { SectionType } from '@/types';
import { useTheme } from '@/components/ThemeProvider';
import { usePanelSizes } from './Layout';
import { ScreenThumbnail } from '@/components/quiz-builder/ScreenThumbnail';
import { ThumbnailContextMenu } from '@/components/quiz-builder/ThumbnailContextMenu';

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
    reorderElement
  } = useQuizStore();
  
  const { theme } = useTheme();
  // Get panel sizes from context
  const { leftPanelSize, rightPanelSize } = usePanelSizes();
  
  // Calculate panel width and positioning dynamically with equal gaps on all sides
  // In Layout, the panels have a 16px gap from edges (4px in the "top-4 left-4" class)
  const sideGap = 16; // 16px matches the Layout's spacing
  const panelWidth = `calc(100vw - ${leftPanelSize + rightPanelSize + (sideGap * 4)}px)`;
  const panelLeftPosition = `calc(${leftPanelSize}px + ${sideGap * 2}px)`;
  
  // Add zoom state
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // Add state for collapsing thumbnails
  const [thumbnailsCollapsed, setThumbnailsCollapsed] = useState(false);
  
  // Calculate bottom panel height for centering calculations
  const bottomPanelHeight = thumbnailsCollapsed ? 48 : 140; // 48px when collapsed (controls only), 140px when expanded
  
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
      width: 'w-full max-w-[1280px]', // Common desktop width
      minWidth: 'min-w-[768px]', // Minimum desktop width
      height: 'h-full max-h-[800px]', // Reasonable height for desktop
      minHeight: 'min-h-[600px]', // Minimum height
      aspectRatio: 'aspect-[16/10]', // Common desktop aspect ratio
    },
    tablet: {
      width: 'w-full max-w-[768px]', // Common tablet width (iPad)
      minWidth: 'min-w-[640px]', // Minimum tablet width
      height: 'h-full max-h-[1024px]', // Common tablet height
      minHeight: 'min-h-[600px]', // Minimum height
      aspectRatio: 'aspect-[4/3]', // Common tablet aspect ratio
    },
    mobile: {
      width: 'w-full max-w-[390px]', // Common mobile width (iPhone 12/13/14)
      minWidth: 'min-w-[320px]', // Minimum mobile width
      height: 'h-full max-h-[844px]', // Common mobile height
      minHeight: 'min-h-[568px]', // Minimum height (iPhone SE)
      aspectRatio: 'aspect-[9/19.5]', // Common mobile aspect ratio
    }
  }), []);
  
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
          ${sectionId === 'body' ? 'flex-1 h-full' : ''}
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
  };
  
  // Apply zoom to canvas
  const canvasStyle = {
    boxSizing: 'border-box' as const,
    transform: `scale(${zoomLevel / 100})`,
    transformOrigin: 'center center',
    transition: 'transform 0.2s ease'
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
  
  // Toggle thumbnails visibility with smooth transition
  const toggleThumbnails = () => {
    setThumbnailsCollapsed(prev => !prev);
  };
  
  // Update canvas centering when thumbnails collapse/expand
  useEffect(() => {
    // Allow time for the animation to complete
    const timer = setTimeout(() => {
      // Force a resize event to recalculate positions
      window.dispatchEvent(new Event('resize'));
    }, 310); // Slightly longer than the transition duration (300ms)
    
    return () => clearTimeout(timer);
  }, [thumbnailsCollapsed]);
  
  return (
    <div className="flex flex-col h-full">
      <div 
        className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center relative transition-all duration-300 ease-in-out"
        style={{
          ...gridBackgroundStyles,
          paddingBottom: `${bottomPanelHeight + 32}px`, // Add padding to account for bottom panel + some spacing
        }}
      >
        {/* Canvas - centered horizontally and vertically */}
        <div 
          className={`
            relative bg-background shadow-lg border border-border rounded-lg overflow-hidden mx-auto
            ${currentDeviceSize.width}
            ${currentDeviceSize.minWidth}
            ${currentDeviceSize.height}
            ${currentDeviceSize.minHeight}
          `}
          style={{
            ...canvasStyle,
            position: 'relative',
            top: `-${bottomPanelHeight / 2}px`, // Shift canvas up by half the panel height for perfect centering
            transition: 'transform 0.2s ease, top 0.3s ease-in-out', // Smooth transition for both zoom and position changes
          }}
          onClick={handleCanvasClick}
          tabIndex={0}
          data-canvas="true"
        >
          {/* Device Frame */}
          <div className="absolute inset-0 flex flex-col h-full overflow-hidden" style={{ boxSizing: 'border-box' }}>
            {/* Screen Content */}
            <div className="flex flex-col h-full overflow-hidden" style={{ boxSizing: 'border-box' }}>
              {/* Sections */}
              <div className="flex flex-col h-full overflow-hidden" style={{ boxSizing: 'border-box' }}>
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
          className="absolute bottom-4 z-20 transition-all duration-200" 
          style={{ 
            left: panelLeftPosition, 
            width: panelWidth,
          }}
        >
          <div 
            className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 w-full transition-all duration-200"
          >
            {/* Screen Thumbnails - Canva-style - conditionally rendered based on collapsed state */}
            <div 
              className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${thumbnailsCollapsed ? 'max-h-0 opacity-0 mb-0' : 'max-h-[120px] opacity-100 mb-2'}
              `}
            >
              <div className="overflow-x-auto overflow-y-hidden px-1 pb-2">
                <div className="flex items-center gap-3 py-1 min-h-[80px]">
                  {quiz.screens.map((screen, index) => (
                    <ThumbnailContextMenu
                      key={screen.id}
                      screenId={screen.id}
                      canDelete={quiz.screens.length > 1}
                    >
                      <ScreenThumbnail
                        id={`screen-thumbnail-${screen.id}`}
                        screen={screen}
                        index={index}
                        isActive={quiz.currentScreenIndex === index}
                        onSelect={() => setCurrentScreen(index)}
                        onDelete={() => removeScreen(screen.id)}
                        canDelete={quiz.screens.length > 1}
                      />
                    </ThumbnailContextMenu>
                  ))}
                  
                  {/* Add Screen Button at the end of scrollable list - simplified */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-[120px] h-[75px] rounded-md border flex-shrink-0"
                    onClick={addScreen}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
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
              
              {/* Middle space - now showing current page info when thumbnails are collapsed */}
              <div className="text-sm text-muted-foreground">
                {thumbnailsCollapsed && `Page ${quiz.currentScreenIndex + 1} / ${quiz.screens.length}`}
              </div>
              
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
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => handleZoom('reset')}
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Reset Zoom (100%)</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Divider */}
                <div className="h-6 w-px bg-border mx-1"></div>
                
                {/* Collapse/Expand thumbnails button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={toggleThumbnails}
                    >
                      {thumbnailsCollapsed ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{thumbnailsCollapsed ? "Show Thumbnails" : "Hide Thumbnails"}</p>
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