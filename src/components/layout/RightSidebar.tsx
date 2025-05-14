"use client";

import React, { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertiesPanel } from '@/components/quiz-builder/PropertiesPanel';
import { SectionPropertiesPanel } from '@/components/quiz-builder/SectionPropertiesPanel';
import { GroupPropertiesPanel } from '@/components/quiz-builder/GroupPropertiesPanel';
import { LogicPanel } from '@/components/quiz-builder/LogicPanel';
import { useQuizStore } from '@/store/useQuizStore';
import { QuizElement, SectionType } from '@/types';
import { PanelRight } from 'lucide-react';

export function RightSidebar() {
  const { 
    quiz,
    selectedElementIds, 
    selectedSectionId
  } = useQuizStore();
  
  // Check if anything is selected
  const hasSelection = selectedElementIds.length > 0 || selectedSectionId !== null;
  
  // Check if a group is selected
  const isGroupSelected = () => {
    if (selectedElementIds.length === 1) {
      // First check if it's a direct child of a section
      for (const screen of quiz.screens) {
        for (const sectionKey of Object.keys(screen.sections) as SectionType[]) {
          const section = screen.sections[sectionKey];
          const element = section.elements.find((el: QuizElement) => el.id === selectedElementIds[0]);
          if (element) {
            // Check if this element is a group or product
            return element.isGroup || element.type === 'product';
          }
        }
      }
    }
    return false;
  };
  
  // Check if the selected element is inside a group
  const isElementInGroup = () => {
    if (selectedElementIds.length === 1) {
      // First check if it's a direct child of a section
      for (const screen of quiz.screens) {
        for (const sectionKey of Object.keys(screen.sections) as SectionType[]) {
          const section = screen.sections[sectionKey];
          const element = section.elements.find((el: QuizElement) => el.id === selectedElementIds[0]);
          if (element) {
            // If we found it directly in a section, it's not in a group
            return false;
          }
        }
      }
      
      // If we didn't find it directly in a section, check groups
      for (const screen of quiz.screens) {
        for (const sectionKey of Object.keys(screen.sections) as SectionType[]) {
          const section = screen.sections[sectionKey];
          // Check each group in the section
          for (const groupElement of section.elements) {
            if (groupElement.isGroup && groupElement.children) {
              // Check if the selected element is in this group
              const foundInGroup = groupElement.children.some((child: QuizElement) => 
                child.id === selectedElementIds[0]
              );
              if (foundInGroup) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  };
  
  // Get the selected element regardless of whether it's in a group or not
  const getSelectedElement = (): QuizElement | null => {
    if (selectedElementIds.length !== 1) return null;
    
    const elementId = selectedElementIds[0];
    
    // First check sections
    for (const screen of quiz.screens) {
      for (const sectionKey of Object.keys(screen.sections) as SectionType[]) {
        const section = screen.sections[sectionKey];
        
        // Check direct children of the section
        const element = section.elements.find((el: QuizElement) => el.id === elementId);
        if (element) {
          return element;
        }
        
        // Check elements inside groups
        for (const groupElement of section.elements) {
          if (groupElement.isGroup && groupElement.children) {
            const childElement = groupElement.children.find((child: QuizElement) => child.id === elementId);
            if (childElement) {
              return childElement;
            }
          }
        }
      }
    }
    
    return null;
  };
  
  // Get title for panel
  const tabTitle = useMemo(() => {
    // If no selection, show placeholder text
    if (selectedElementIds.length === 0 && !selectedSectionId) {
      return "Properties";
    }
    
    // If a section is selected, show section name
    if (selectedSectionId) {
      const sectionName = selectedSectionId.charAt(0).toUpperCase() + selectedSectionId.slice(1);
      return `${sectionName} Section`;
    }
    
    // If multiple elements are selected
    if (selectedElementIds.length > 1) {
      return `${selectedElementIds.length} Elements`;
    }
    
    // For single element selection
    const element = getSelectedElement();
    if (element) {
      // Special case for group or product elements
      if (element.type === 'group' || element.type === 'product') {
        return "Group";
      }
      
      // Default for regular elements
      const elementType = element.type.charAt(0).toUpperCase() + element.type.slice(1);
      return elementType;
    }
    
    return "Properties";
  }, [selectedElementIds, selectedSectionId, quiz]);

  // If nothing is selected, show the empty state
  if (!hasSelection) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="flex justify-center mb-5">
              <div className="p-3 rounded-full bg-muted empty-state-icon">
                <PanelRight className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-base font-medium text-muted-foreground mb-2">Properties Panel</h3>
            <p className="text-sm text-muted-foreground max-w-[220px] mx-auto">
              Select an element or section to edit its properties
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If something is selected, show the tabs and panels
  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="properties" className="w-full h-full">
        <div className="px-4 pt-4">
          <TabsList className="w-full">
            <TabsTrigger value="properties">{tabTitle}</TabsTrigger>
            <TabsTrigger value="logic">Logic</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="properties" className="flex-1 overflow-auto right-sidebar mt-0 p-0 border-none">
          <>
            {selectedElementIds.length > 0 && !isGroupSelected() && <PropertiesPanel />}
            {isGroupSelected() && <GroupPropertiesPanel />}
            {selectedSectionId && selectedElementIds.length === 0 && <SectionPropertiesPanel />}
          </>
        </TabsContent>
        
        <TabsContent value="logic" className="flex-1 overflow-auto right-sidebar mt-0 p-0 border-none">
          <>
            {selectedElementIds.length > 0 && <LogicPanel />}
            {selectedElementIds.length === 0 && selectedSectionId && (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">Logic settings are only available for elements.</p>
              </div>
            )}
          </>
        </TabsContent>
      </Tabs>
    </div>
  );
} 