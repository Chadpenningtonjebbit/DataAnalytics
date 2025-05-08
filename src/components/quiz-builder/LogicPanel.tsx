"use client";

import React, { useMemo } from 'react';
import { useQuizStore } from '@/store/useQuizStore';
import { PropertyGroup } from '@/components/ui/property-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QuizElement, ElementType } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MousePointer, ArrowRight, Link as LinkIcon } from 'lucide-react';

// Define the different action types
type ActionType = 'none' | 'next-screen' | 'specific-screen' | 'open-url' | 'brand-page';

// Define the attributes interface with optional properties
interface ElementAttributes {
  actionType?: ActionType;
  targetScreenId?: string;
  url?: string;
  targetWindow?: '_self' | '_blank';
  [key: string]: any;
}

export function LogicPanel() {
  const { quiz, selectedElementIds, updateElement } = useQuizStore();
  
  // Get the selected elements
  const selectedElements = useMemo(() => {
    if (selectedElementIds.length === 0) return [];
    
    const elements: QuizElement[] = [];
    
    // Helper function to recursively find elements in groups
    const findElementsInGroup = (group: QuizElement, ids: string[]) => {
      if (group.children) {
        for (const child of group.children) {
          if (ids.includes(child.id)) {
            elements.push(child);
          }
          if (child.isGroup && child.children) {
            findElementsInGroup(child, ids);
          }
        }
      }
    };
    
    for (const screen of quiz.screens) {
      // Look for the elements in each section
      for (const sectionKey of Object.keys(screen.sections)) {
        const section = screen.sections[sectionKey as keyof typeof screen.sections];
        
        // First check direct children of the section
        const foundElements = section.elements.filter((el: QuizElement) => 
          selectedElementIds.includes(el.id)
        );
        elements.push(...foundElements);
        
        // Then check elements inside groups recursively
        for (const groupElement of section.elements) {
          if (groupElement.isGroup && groupElement.children) {
            findElementsInGroup(groupElement, selectedElementIds);
          }
        }
      }
    }
    
    return elements;
  }, [quiz, selectedElementIds]);
  
  // Get the first selected element
  const firstElement = selectedElements.length > 0 ? selectedElements[0] : null;
  
  // Check if all selected elements are of the same type
  const allSameType = useMemo(() => {
    if (selectedElements.length <= 1) return true;
    const firstType = selectedElements[0].type;
    return selectedElements.every(el => el.type === firstType);
  }, [selectedElements]);
  
  // Check if element is interactive (can have actions)
  const isInteractiveElement = (element: QuizElement) => {
    return ['button', 'link', 'image', 'text'].includes(element.type);
  };
  
  // Determine if logic panel should be shown
  const showLogicPanel = useMemo(() => {
    if (!firstElement) return false;
    
    // Only show for interactive elements
    return isInteractiveElement(firstElement);
  }, [firstElement]);
  
  // Get the current action type or default based on element type
  const getActionType = (element: QuizElement): ActionType => {
    if (!element.attributes || !element.attributes.actionType) {
      // Set defaults based on element type
      switch (element.type) {
        case 'button':
          return 'next-screen';
        case 'link':
          return 'open-url';
        case 'image':
          return 'none';
        case 'text':
          return 'none';
        default:
          return 'none';
      }
    }
    return element.attributes.actionType as ActionType;
  };
  
  // Handle action type change
  const handleActionTypeChange = (value: string) => {
    if (!firstElement) return;
    
    const actionType = value as ActionType;
    
    // Update all selected elements
    selectedElements.forEach(element => {
      const updatedAttributes: ElementAttributes = { 
        ...element.attributes as ElementAttributes, 
        actionType 
      };
      
      // If changing to open-url and there's no URL set, add a default
      if (actionType === 'open-url' && (!updatedAttributes.url || updatedAttributes.url === '')) {
        updatedAttributes.url = 'https://';
        // Set default target window if not already set
        if (!updatedAttributes.targetWindow) {
          updatedAttributes.targetWindow = '_blank';
        }
      }
      
      // If changing to specific-screen and there's no screenId set, add the first screen
      if (actionType === 'specific-screen' && (!updatedAttributes.targetScreenId)) {
        updatedAttributes.targetScreenId = quiz.screens[0]?.id || '';
      }
      
      updateElement(element.id, {
        attributes: updatedAttributes,
      });
    });
  };
  
  // Handle URL change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!firstElement) return;
    
    // Update all selected elements
    selectedElements.forEach(element => {
      updateElement(element.id, {
        attributes: {
          ...element.attributes,
          url: e.target.value,
        },
      });
    });
  };
  
  // Handle target window change
  const handleTargetWindowChange = (value: string) => {
    if (!firstElement) return;
    
    // Update all selected elements
    selectedElements.forEach(element => {
      updateElement(element.id, {
        attributes: {
          ...element.attributes,
          targetWindow: value as '_self' | '_blank',
        },
      });
    });
  };
  
  // Handle target screen change
  const handleTargetScreenChange = (value: string) => {
    if (!firstElement) return;
    
    // Update all selected elements
    selectedElements.forEach(element => {
      updateElement(element.id, {
        attributes: {
          ...element.attributes,
          targetScreenId: value,
        },
      });
    });
  };
  
  // Get brand pages from localStorage
  const getBrandPages = () => {
    const savedSubpages = localStorage.getItem('brandWebsiteSubpages');
    if (savedSubpages) {
      try {
        return JSON.parse(savedSubpages);
      } catch (error) {
        console.error('Error parsing saved subpages:', error);
        return [];
      }
    }
    return [];
  };
  
  // Get brand pages
  const brandPages = useMemo(() => getBrandPages(), []);
  
  // If no elements are selected or not an interactive element, show a message
  if (!firstElement || !showLogicPanel) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {!firstElement ? 
            "Select an element to see logic options." : 
            "Logic options are only available for interactive elements (buttons, links, images)."
          }
        </p>
      </div>
    );
  }
  
  // Get the current action type
  const currentActionType = getActionType(firstElement);
  
  return (
    <div className="space-y-0">
      <PropertyGroup 
        title="On Click" 
        icon={<MousePointer className="h-4 w-4" />}
      >
        <div className="space-y-2">
          <Label htmlFor="action-type">On Click</Label>
          <Select
            value={currentActionType}
            onValueChange={handleActionTypeChange}
          >
            <SelectTrigger id="action-type" className="w-full">
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Action</SelectItem>
              <SelectItem value="next-screen">Next Screen</SelectItem>
              <SelectItem value="specific-screen">Specific Screen</SelectItem>
              <SelectItem value="open-url">Open URL</SelectItem>
              {brandPages.length > 0 && (
                <SelectItem value="brand-page">Brand Page</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        {/* Show specific screen selection if action type is specific-screen */}
        {currentActionType === 'specific-screen' && (
          <div className="space-y-2">
            <Label htmlFor="target-screen">Target Screen</Label>
            <Select
              value={firstElement.attributes?.targetScreenId || ''}
              onValueChange={handleTargetScreenChange}
            >
              <SelectTrigger id="target-screen" className="w-full">
                <SelectValue placeholder="Select screen" />
              </SelectTrigger>
              <SelectContent>
                {quiz.screens.map((screen) => (
                  <SelectItem key={screen.id} value={screen.id}>
                    {screen.name || `Screen ${quiz.screens.indexOf(screen) + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Show URL input if action type is open-url */}
        {currentActionType === 'open-url' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={firstElement.attributes?.url || ''}
                onChange={handleUrlChange}
                placeholder="https://example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target-window">Open In</Label>
              <Select
                value={firstElement.attributes?.targetWindow || '_blank'}
                onValueChange={handleTargetWindowChange}
              >
                <SelectTrigger id="target-window" className="w-full">
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_blank">New Tab</SelectItem>
                  <SelectItem value="_self">Same Tab</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Show brand page selection if action type is brand-page */}
        {currentActionType === 'brand-page' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="brand-page">Brand Page</Label>
              <Select
                value={firstElement.attributes?.url || ''}
                onValueChange={(value) => {
                  // Update all selected elements
                  selectedElements.forEach(element => {
                    updateElement(element.id, {
                      attributes: {
                        ...element.attributes,
                        url: value,
                      },
                    });
                  });
                }}
              >
                <SelectTrigger id="brand-page" className="w-full">
                  <SelectValue placeholder="Select page" />
                </SelectTrigger>
                <SelectContent>
                  {brandPages.map((page: any, index: number) => (
                    <SelectItem key={index} value={page.url}>
                      {page.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target-window">Open In</Label>
              <Select
                value={firstElement.attributes?.targetWindow || '_blank'}
                onValueChange={handleTargetWindowChange}
              >
                <SelectTrigger id="target-window" className="w-full">
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_blank">New Tab</SelectItem>
                  <SelectItem value="_self">Same Tab</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </PropertyGroup>
    </div>
  );
} 