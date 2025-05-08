"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Type, 
  Square, 
  Layout,
  AlignJustify,
  ArrowDown,
  Boxes,
  Link as LinkIcon,
  Image,
  Search
} from 'lucide-react';
import { DraggableElement } from '@/components/quiz-builder/DraggableElement';
import { ElementType, SectionType } from '@/types';
import { useQuizStore } from '@/store/useQuizStore';
import { v4 as uuidv4 } from 'uuid';
import { PropertyGroup } from '@/components/ui/property-group';

const elementCategories = [
  {
    title: "Elements",
    items: [
      { type: 'text' as ElementType, name: "Text", icon: <Type className="h-4 w-4" /> },
      { type: 'button' as ElementType, name: "Button", icon: <Square className="h-4 w-4" /> },
      { type: 'link' as ElementType, name: "Link", icon: <LinkIcon className="h-4 w-4" /> },
      { type: 'image' as ElementType, name: "Image", icon: <Image className="h-4 w-4" /> },
    ]
  }
];

// Flatten all elements for easier searching
const allElements = elementCategories.flatMap(category => category.items);

export function LeftSidebar() {
  const { quiz, toggleSection } = useQuizStore();
  const currentScreen = quiz.screens[quiz.currentScreenIndex];
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter elements based on search query
  const filteredElements = searchQuery.trim() === '' 
    ? allElements 
    : allElements.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
  
  return (
    <div className="h-full flex flex-col left-sidebar overflow-visible" style={{ overflow: 'visible' }}>
      <Tabs defaultValue="elements" className="w-full h-full overflow-visible" style={{ overflow: 'visible' }}>
        <div className="px-4 pt-4">
          <TabsList className="w-full">
            <TabsTrigger value="elements">Elements</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="elements" className="flex-1 overflow-visible p-4 mt-0 border-none" style={{ overflow: 'visible' }}>
          <div className="space-y-4 max-w-full overflow-visible" style={{ overflow: 'visible' }}>
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search elements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            {/* Elements grid */}
            <div className="grid grid-cols-2 gap-2 max-w-full overflow-visible" style={{ overflow: 'visible' }}>
              {filteredElements.map((item) => (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <div className="overflow-visible" style={{ overflow: 'visible' }}>
                      <DraggableElement 
                        id={`${item.type}-template-${uuidv4()}`}
                        type={item.type}
                        sectionId="body"
                      >
                        <Card>
                          <CardContent className="p-2 flex flex-col items-center justify-center text-center">
                            {item.icon}
                            <span className="text-xs mt-1">{item.name}</span>
                          </CardContent>
                        </Card>
                      </DraggableElement>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Drag to add {item.name.toLowerCase()}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            
            {/* Show message when no results */}
            {filteredElements.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p>No elements found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="sections" className="flex-1 overflow-y-auto p-4 mt-0 border-none">
          <div className="space-y-6 max-w-full">
            <PropertyGroup title="Layout Structure" icon={<Layout className="h-4 w-4" />}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layout className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="header-toggle" className="text-sm">Header</Label>
                  </div>
                  <Switch 
                    id="header-toggle" 
                    checked={currentScreen.sections.header.enabled}
                    onCheckedChange={() => toggleSection('header')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlignJustify className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="body-toggle" className="text-sm">Body</Label>
                  </div>
                  <Switch 
                    id="body-toggle" 
                    checked={currentScreen.sections.body.enabled}
                    disabled={true}
                    onCheckedChange={() => {}}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="footer-toggle" className="text-sm">Footer</Label>
                  </div>
                  <Switch 
                    id="footer-toggle" 
                    checked={currentScreen.sections.footer.enabled}
                    onCheckedChange={() => toggleSection('footer')}
                  />
                </div>
              </div>
            </PropertyGroup>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 