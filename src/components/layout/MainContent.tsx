"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Monitor, Tablet, Smartphone, Plus, Undo, Redo, Trash2, ChevronRight, ChevronLeft, ZoomIn, ZoomOut, Maximize, Minimize, PencilIcon, LayoutDashboard } from 'lucide-react';
import { DroppableArea } from '@/components/quiz-builder/DroppableArea';
import { useQuizStore } from '@/store/useQuizStore';
import { ElementRenderer } from '@/components/quiz-builder/ElementRenderer';
import { SectionType, ViewMode as BaseViewMode } from '@/types';
import { useTheme } from '@/components/ThemeProvider';
import { usePanelSizes } from '@/components/layout/Layout';
import { ScreenThumbnail } from '@/components/quiz-builder/ScreenThumbnail';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";

// Define a type for device size config
interface DeviceSize {
  maxWidth: number;
  minWidth: number;
  maxHeight: number;
  minHeight: number;
  aspectRatio: number;
}

// Define a type for saved custom device sizes
interface CustomDeviceConfig {
  id: string;
  name: string;
  width: string;
  height: string;
  config: DeviceSize;
}

// Define a type for available view modes, extending the base type
type ExtendedViewMode = BaseViewMode | 'custom' | string;

export function MainContent() {
  const { 
    quiz, 
    addScreen,
    removeScreen,
    setCurrentScreen,
    setViewMode, 
    viewMode: storeViewMode,
    selectElement, 
    selectedElementIds, 
    undo, 
    redo, 
    history, 
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
  
  // Local viewMode state to handle custom mode
  const [localViewMode, setLocalViewMode] = useState('desktop');
  
  // Helper function to get the experience-specific storage key
  const getCustomDeviceSizesKey = useCallback(() => {
    return `customDeviceSizes-${quiz.id}`;
  }, [quiz.id]);
  
  // Keep local and store view modes in sync when not in custom mode
  useEffect(() => {
    if (localViewMode !== 'custom' && !localViewMode.startsWith('custom-')) {
      setLocalViewMode(storeViewMode);
    }
  }, [storeViewMode]);
  
  // Load custom view mode from localStorage on component mount
  useEffect(() => {
    try {
      // First check if there's a saved custom view mode for this quiz
      const savedViewMode = localStorage.getItem(`customViewMode-${quiz.id}`);
      console.log(`Loading saved view mode for quiz ${quiz.id}:`, savedViewMode);
      
      if (savedViewMode) {
        setLocalViewMode(savedViewMode);
        
        // If the saved view is custom, we need to load the corresponding device config
        if (savedViewMode.startsWith('custom-')) {
          const deviceId = savedViewMode.replace('custom-', '');
          const storageKey = getCustomDeviceSizesKey();
          const savedDevices = localStorage.getItem(storageKey);
          if (savedDevices) {
            const devices = JSON.parse(savedDevices);
            console.log('Looking for device:', deviceId, 'in', devices);
            const customDevice = devices.find((device: CustomDeviceConfig) => device.id === deviceId);
            if (customDevice) {
              console.log('Found custom device config:', customDevice);
              setCustomDeviceConfig(customDevice.config);
            } else {
              console.log('Custom device not found, defaulting to desktop view');
              setLocalViewMode('desktop');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading custom view mode:', error);
    }
  }, [quiz.id, getCustomDeviceSizesKey]);
  
  // Save current view mode to localStorage whenever it changes
  useEffect(() => {
    try {
      console.log(`Saving view mode for quiz ${quiz.id}:`, localViewMode);
      localStorage.setItem(`customViewMode-${quiz.id}`, localViewMode);
    } catch (error) {
      console.error('Error saving custom view mode:', error);
    }
  }, [localViewMode, quiz.id]);
  
  const { theme } = useTheme();
  // Get panel sizes from context and handle TypeScript error with safer property access
  const panelSizes = usePanelSizes();
  const leftPanelSize = panelSizes.leftPanelSize;
  const rightPanelSize = panelSizes.rightPanelSize;
  // Handle potential missing property with a boolean check
  const isPanelCollapsed = 'isPanelCollapsed' in panelSizes ? panelSizes.isPanelCollapsed : false;
  
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
  
  // State for custom device sizes
  const [customDeviceSizes, setCustomDeviceSizes] = useState<CustomDeviceConfig[]>([]);
  
  // Current custom device being edited (for edit mode)
  const [currentEditingDevice, setCurrentEditingDevice] = useState<CustomDeviceConfig | null>(null);
  
  // Always ensure we have the latest custom device sizes from localStorage
  useEffect(() => {
    const loadDevices = () => {
      try {
        const storageKey = getCustomDeviceSizesKey();
        const savedDevices = localStorage.getItem(storageKey);
        if (savedDevices) {
          const parsedDevices = JSON.parse(savedDevices);
          if (Array.isArray(parsedDevices) && parsedDevices.length > 0) {
            console.log(`Safety check: Loading custom device sizes for quiz ${quiz.id}:`, parsedDevices);
            setCustomDeviceSizes(parsedDevices);
          }
        }
      } catch (error) {
        console.error('Error in safety device reload:', error);
      }
    };

    // Load immediately 
    loadDevices();
    
    // Also set up an interval to check periodically
    const intervalId = setInterval(loadDevices, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [quiz.id, getCustomDeviceSizesKey]); // Run when quiz ID changes
  
  // Save customDeviceSizes to localStorage whenever it changes
  useEffect(() => {
    if (customDeviceSizes.length > 0) {
      try {
        const storageKey = getCustomDeviceSizesKey();
        console.log(`Saving custom device sizes for quiz ${quiz.id}:`, customDeviceSizes);
        localStorage.setItem(storageKey, JSON.stringify(customDeviceSizes));
      } catch (error) {
        console.error('Error saving custom device sizes:', error);
      }
    }
  }, [customDeviceSizes, quiz.id, getCustomDeviceSizesKey]);
  
  // Custom device dialog state
  const [isCustomDeviceDialogOpen, setIsCustomDeviceDialogOpen] = useState(false);
  const [customDeviceWidth, setCustomDeviceWidth] = useState("390px");
  const [customDeviceHeight, setCustomDeviceHeight] = useState("844px");
  const [customDeviceName, setCustomDeviceName] = useState("Custom");
  const [customDeviceConfig, setCustomDeviceConfig] = useState<DeviceSize>({
    maxWidth: 390,
    minWidth: 320,
    maxHeight: 844,
    minHeight: 568,
    aspectRatio: 390/844,
  });
  
  // Fixed bottom panel height for thumbnails
  const bottomPanelHeight = 120; // Height for thumbnail section + controls
  
  // Add extra spacing to prevent overlap
  const bottomPanelTotalHeight = bottomPanelHeight + 48; // Include padding and margin
  
  // Function to initialize the application with proper device config
  const initCustomDeviceConfig = useCallback(() => {
    try {
      // Load custom devices from localStorage
      const storageKey = getCustomDeviceSizesKey();
      const savedDevices = localStorage.getItem(storageKey);
      if (savedDevices) {
        const parsedDevices = JSON.parse(savedDevices);
        console.log(`Init: Loaded custom device sizes for quiz ${quiz.id}:`, parsedDevices);
        setCustomDeviceSizes(parsedDevices);
      
        // Check if there's a saved view mode for this quiz
        const savedViewMode = localStorage.getItem(`customViewMode-${quiz.id}`);
        console.log('Init: Saved view mode:', savedViewMode);
        
        if (savedViewMode && savedViewMode.startsWith('custom-')) {
          const deviceId = savedViewMode.replace('custom-', '');
          const device = parsedDevices.find((d: CustomDeviceConfig) => d.id === deviceId);
          
          if (device) {
            console.log('Init: Found matching device, applying config:', device);
            setLocalViewMode(savedViewMode);
            setCustomDeviceConfig(device.config);
          } else {
            console.log('Init: No matching device found, defaulting to desktop');
            localStorage.setItem(`customViewMode-${quiz.id}`, 'desktop');
            setLocalViewMode('desktop');
          }
        } else if (savedViewMode) {
          console.log('Init: Using saved standard view mode:', savedViewMode);
          setLocalViewMode(savedViewMode);
        }
      } else {
        // Reset custom device sizes when switching to an experience with no saved devices
        setCustomDeviceSizes([]);
      }
    } catch (error) {
      console.error('Error in device initialization:', error);
    }
  }, [quiz.id, getCustomDeviceSizesKey]);

  // Run initialization on mount and quiz change
  useEffect(() => {
    initCustomDeviceConfig();
  }, [initCustomDeviceConfig]);
  
  const handleViewModeChange = (mode: string) => {
    console.log('View mode change triggered:', mode);
    
    // Update local mode
    setLocalViewMode(mode);
    
    // Update store only for standard modes (not custom)
    if (mode !== 'custom' && !mode.startsWith('custom-')) {
      // Cast the mode to the type expected by setViewMode (if it's a valid option)
      if (mode === 'desktop' || mode === 'tablet' || mode === 'mobile') {
        // TypeScript won't allow direct casting to ViewMode, so we use a specific valid value
        if (mode === 'desktop') setViewMode('desktop');
        else if (mode === 'tablet') setViewMode('tablet'); 
        else if (mode === 'mobile') setViewMode('mobile');
      }
    } else if (mode.startsWith('custom-')) {
      // Find the custom device configuration
      const deviceId = mode.replace('custom-', '');
      const customDevice = customDeviceSizes.find(device => device.id === deviceId);
      
      if (customDevice) {
        // Set the current custom device config
        console.log('Setting custom device config:', customDevice);
        setCustomDeviceConfig(customDevice.config);
      } else {
        console.warn('Custom device not found:', deviceId);
        // Fall back to desktop if device not found
        setLocalViewMode('desktop');
        setViewMode('desktop');
      }
    }
    
    // Save the current view mode to localStorage for this quiz
    try {
      localStorage.setItem(`customViewMode-${quiz.id}`, mode);
    } catch (error) {
      console.error('Error saving custom view mode:', error);
    }
    
    console.log('View mode after change:', mode);
  };
  
  // Function to open the custom device dialog in create mode
  const openCustomDeviceDialog = () => {
    // Reset dialog fields for a new custom device
    setCustomDeviceName("Custom");
    setCustomDeviceWidth("390px");
    setCustomDeviceHeight("844px");
    setCurrentEditingDevice(null);
    setIsCustomDeviceDialogOpen(true);
  };
  
  // Function to open the custom device dialog in edit mode
  const openEditDeviceDialog = (deviceId: string) => {
    const device = customDeviceSizes.find(d => d.id === deviceId);
    if (device) {
      setCustomDeviceName(device.name);
      setCustomDeviceWidth(device.width);
      setCustomDeviceHeight(device.height);
      setCurrentEditingDevice(device);
      setIsCustomDeviceDialogOpen(true);
    }
  };
  
  // Function to delete a custom device
  const deleteCustomDevice = (deviceId: string) => {
    const updatedDevices = customDeviceSizes.filter(device => device.id !== deviceId);
    
    // Update state
    setCustomDeviceSizes(updatedDevices);
    
    // Also directly update localStorage as a backup
    try {
      const storageKey = getCustomDeviceSizesKey();
      localStorage.setItem(storageKey, JSON.stringify(updatedDevices));
    } catch (error) {
      console.error('Error saving custom device sizes after deletion:', error);
    }
    
    // If we were using this device, switch to desktop mode
    if (localViewMode === `custom-${deviceId}`) {
      handleViewModeChange('desktop');
    }
  };
  
  // Function to apply custom device config
  const applyCustomDeviceConfig = () => {
    // Parse the width and height values
    const widthMatch = customDeviceWidth.match(/^(\d+)(px|%)?$/);
    const heightMatch = customDeviceHeight.match(/^(\d+)(px|%)?$/);
    
    if (widthMatch && heightMatch) {
      const width = parseInt(widthMatch[1], 10);
      const height = parseInt(heightMatch[1], 10);
      
      // Update the custom device config
      const newConfig: DeviceSize = {
        maxWidth: width,
        minWidth: Math.max(width * 0.8, 320), // 80% of width or minimum 320px
        maxHeight: height,
        minHeight: Math.max(height * 0.8, 400), // 80% of height or minimum 400px
        aspectRatio: width / height,
      };
      
      setCustomDeviceConfig(newConfig);
      
      // If we're editing an existing device, update it
      if (currentEditingDevice) {
        const updatedDevices = customDeviceSizes.map(device => 
          device.id === currentEditingDevice.id 
            ? {
                ...device,
                name: customDeviceName,
                width: customDeviceWidth,
                height: customDeviceHeight,
                config: newConfig
              }
            : device
        );
        
        setCustomDeviceSizes(updatedDevices);
        
        // Switch to the updated custom view mode
        handleViewModeChange(`custom-${currentEditingDevice.id}`);
      } else {
        // Create a new custom device
        const newId = `device-${Date.now()}`;
        const newDevice: CustomDeviceConfig = {
          id: newId,
          name: customDeviceName,
          width: customDeviceWidth,
          height: customDeviceHeight,
          config: newConfig
        };
        
        // First add to state which will trigger localStorage save
        const newDevices = [...customDeviceSizes, newDevice];
        setCustomDeviceSizes(newDevices);
        
        // Then manually save to localStorage as a backup
        try {
          const storageKey = getCustomDeviceSizesKey();
          localStorage.setItem(storageKey, JSON.stringify(newDevices));
        } catch (error) {
          console.error('Error saving custom device sizes:', error);
        }
        
        // Switch to the new custom view mode
        handleViewModeChange(`custom-${newId}`);
      }
      
      // Close the dialog
      setIsCustomDeviceDialogOpen(false);
    }
  };
  
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the canvas, not on an element or section
    if (e.currentTarget === e.target) {
      selectElement(null);
      selectSection(null);
    }
  };
  
  // Define device sizes
  const deviceSizes: Record<string, DeviceSize> = useMemo(() => {
    const standardSizes = {
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
    },
    custom: customDeviceConfig, // Custom device configuration
    };
    
    // Add all saved custom device configurations
    const customSizes: Record<string, DeviceSize> = {};
    customDeviceSizes.forEach(device => {
      customSizes[`custom-${device.id}`] = device.config;
    });
    
    return { ...standardSizes, ...customSizes };
  }, [customDeviceConfig, customDeviceSizes]);
  
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
      const deviceConfig = deviceSizes[localViewMode as keyof typeof deviceSizes] || deviceSizes.desktop;
      
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
  }, [deviceSizes, localViewMode, effectiveLeftPanelSize, rightPanelSize, bottomPanelTotalHeight, zoomLevel, sideGap, isPanelCollapsed]);
  
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
  const currentDeviceSize = deviceSizes[localViewMode];
  
  // Check if undo/redo are available
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  
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
      
      // Skip if an element is in editing mode
      const isElementEditing = 
        document.activeElement?.closest('.quiz-element.editing') !== null || 
        document.activeElement?.classList.contains('editable-content');
      
      if (isElementEditing) {
        return;
      }
      
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
  const gridBackgroundStyles = {
    backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5'
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
        className="flex-1 overflow-auto pt-4 px-4 pb-4 md:p-8 flex items-center justify-center relative grid-pattern-bg"
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
          className="absolute bottom-4 z-20" 
          style={{ 
            left: panelLeftPosition, 
            width: panelWidth,
          }}
        >
          <div 
            className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-2 w-full"
          >
            {/* Screen Thumbnails */}
            <div className="w-full flex flex-col pt-1 pb-2">
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
              <div className="flex items-center gap-2 flex-wrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={localViewMode === 'desktop' ? 'secondary' : 'ghost'} 
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
                      variant={localViewMode === 'tablet' ? 'secondary' : 'ghost'} 
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
                      variant={localViewMode === 'mobile' ? 'secondary' : 'ghost'} 
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
                
                {/* Render custom device buttons */}
                {customDeviceSizes.length > 0 && customDeviceSizes.map(device => (
                  <ContextMenu key={device.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                        <ContextMenuTrigger asChild>
                    <Button 
                            variant={localViewMode === `custom-${device.id}` ? 'secondary' : 'ghost'} 
                      size="icon" 
                      className="h-8 w-8" 
                            onClick={() => handleViewModeChange(`custom-${device.id}`)}
                          >
                            <LayoutDashboard className="h-4 w-4" />
                          </Button>
                        </ContextMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>{device.name} ({device.width} × {device.height})</p>
                      </TooltipContent>
                    </Tooltip>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => openEditDeviceDialog(device.id)}>
                        <PencilIcon className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem 
                        onClick={() => deleteCustomDevice(device.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={openCustomDeviceDialog}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Add Custom Device Size</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Custom Device Dialog */}
                <Dialog open={isCustomDeviceDialogOpen} onOpenChange={setIsCustomDeviceDialogOpen}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{currentEditingDevice ? 'Edit' : 'Add'} Custom Device Size</DialogTitle>
                      <DialogDescription>
                        Set custom width and height for your device preview.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="name">
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={customDeviceName}
                          onChange={(e) => setCustomDeviceName(e.target.value)}
                          className="w-full"
                          placeholder="Custom Device"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="width">
                          Width
                        </Label>
                          <NumericInput
                            id="width"
                            value={customDeviceWidth}
                            onChange={setCustomDeviceWidth}
                            className="w-full"
                            defaultUnit="px"
                            enableUnitToggle={false}
                          />
                        </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="height">
                          Height
                        </Label>
                          <NumericInput
                            id="height"
                            value={customDeviceHeight}
                            onChange={setCustomDeviceHeight}
                            className="w-full"
                            defaultUnit="px"
                            enableUnitToggle={false}
                          />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCustomDeviceDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={applyCustomDeviceConfig}>
                        {currentEditingDevice ? 'Update' : 'Add'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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