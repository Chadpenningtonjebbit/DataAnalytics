"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Search,
  Palette,
  PanelLeft,
  Command,
  X,
  Settings,
  FilePlus,
  PencilLine,
  Trash
} from 'lucide-react';
import { DraggableElement } from '@/components/quiz-builder/DraggableElement';
import { ElementType, SectionType, ThemeItem, ThemeSettings } from '@/types';
import { useQuizStore } from '@/store/useQuizStore';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { NavUser } from '@/components/nav-user';
import { PropertyGroup } from '@/components/ui/property-group';
import { Button } from "@/components/ui/button";
import { PanelHeader } from "@/components/ui/panel-header";
import { usePanelSizes } from '@/components/layout/Layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from '@/components/ui/color-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

// Sidebar panels
const SIDEBAR_PANELS = [
  {
    id: "content",
    label: "Add Content",
    icon: <PanelLeft className="h-4 w-4" />
  },
  {
    id: "theme",
    label: "Theme",
    icon: <Palette className="h-4 w-4" />
  }
];

export function NestedLeftSidebar() {
  // Active sidebar panel
  const [activePanel, setActivePanel] = useState<string | null>("content");
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const { quiz, toggleSection } = useQuizStore();
  const currentScreen = quiz.screens[quiz.currentScreenIndex];
  const [searchQuery, setSearchQuery] = useState('');
  const panelSizes = usePanelSizes();
  
  // Safe way to call the context function if it exists
  const handlePanelCollapsedChange = (collapsed: boolean) => {
    if ('onLeftPanelCollapsedChange' in panelSizes) {
      (panelSizes.onLeftPanelCollapsedChange as (collapsed: boolean) => void)(collapsed);
    }
  };
  
  // Filter elements based on search query
  const filteredElements = searchQuery.trim() === '' 
    ? allElements 
    : allElements.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
  
  // Handle panel activation
  const handlePanelClick = (panelId: string) => {
    // If clicking the already active panel, toggle expansion
    if (activePanel === panelId) {
      const newExpandedState = !isPanelExpanded;
      setIsPanelExpanded(newExpandedState);
      
      // Tell the parent container about collapsed state
      handlePanelCollapsedChange(!newExpandedState);
      
      // If we're collapsing, visually deselect the panel
      if (isPanelExpanded) {
        setActivePanel(null);
      }
    } else {
      // Otherwise, activate the panel and expand it
      setActivePanel(panelId);
      setIsPanelExpanded(true);
      // Tell parent we're expanded
      handlePanelCollapsedChange(false);
    }
  };
  
  // Handle panel close
  const handlePanelClose = () => {
    setIsPanelExpanded(false);
    // Tell parent we're collapsed
    handlePanelCollapsedChange(true);
    // When closing, visually deselect the panel button too
    setActivePanel(null);
  };
  
  // Get panel type even when none is visually selected
  const getEffectivePanelType = () => {
    if (activePanel) return activePanel;
    // If no panel is visually selected but we have content to show
    return isPanelExpanded ? "content" : null;
  };
  
  // Get the effective panel type for rendering
  const effectivePanelType = getEffectivePanelType();
  
  return (
    <div className="h-full flex flex-row">
      {/* Vertical navigation sidebar - always visible */}
      <div className="h-full w-[52px] border-r flex flex-col flex-shrink-0 bg-background">
        <div className="flex flex-col items-center py-4 space-y-2 flex-1">
          {SIDEBAR_PANELS.map((panel) => (
            <TooltipProvider key={panel.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "w-10 h-10 flex items-center justify-center rounded-md",
                      activePanel === panel.id 
                        ? panel.id === "theme"
                          ? "text-white" // Text color for both
                          : "text-white"
                        : "hover:bg-muted"
                    )}
                    style={{
                      backgroundColor: activePanel === panel.id
                        ? panel.id === "theme"
                          ? "#7c3aed" // Purple for theme
                          : "#3b82f6" // Blue for content
                        : ""
                    }}
                    onClick={() => handlePanelClick(panel.id)}
                    aria-label={panel.label}
                  >
                    {panel.icon}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {panel.id === effectivePanelType && !isPanelExpanded 
                    ? `Expand ${panel.label}` 
                    : panel.label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        <div className="mt-auto mb-4">
          <NavUser />
        </div>
      </div>
      
      {/* Content panel - only render when expanded */}
      {isPanelExpanded && (
        <div className="flex-1 h-full bg-background">
          {effectivePanelType === "content" && (
            <ContentPanel 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredElements={filteredElements}
              currentScreen={currentScreen}
              toggleSection={toggleSection}
              onClose={handlePanelClose}
            />
          )}
          
          {effectivePanelType === "theme" && (
            <ThemePanel onClose={handlePanelClose} />
          )}
        </div>
      )}
    </div>
  );
}

// Content panel component
function ContentPanel({ 
  searchQuery, 
  setSearchQuery, 
  filteredElements,
  currentScreen,
  toggleSection,
  onClose
}: { 
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredElements: any[];
  currentScreen: any;
  toggleSection: (sectionId: SectionType) => void;
  onClose?: () => void;
}) {
  return (
    <div className="h-full flex flex-col left-sidebar overflow-hidden">
      <PanelHeader 
        title="Add Content" 
        onClose={onClose}
        color="#3b82f6" // Blue
      />
      
      {/* Panel content */}
      <div className="flex-1 overflow-auto min-h-0">
        <Tabs defaultValue="elements" className="w-full h-full">
          <div className="px-4 pt-4">
            <TabsList className="w-full">
              <TabsTrigger value="elements">Elements</TabsTrigger>
              <TabsTrigger value="sections">Sections</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="elements" className="p-4 mt-0 border-none">
            <div className="space-y-4 max-w-full">
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
              <div className="grid grid-cols-2 gap-2 max-w-full">
                {filteredElements.map((item) => (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      <div>
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
          
          <TabsContent value="sections" className="p-4 mt-0 border-none">
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
    </div>
  );
}

// Theme panel component
function ThemePanel({ onClose }: { onClose: () => void }) {
  // Get the entire store state and ignore TypeScript errors for specific actions
  const { quiz } = useQuizStore();
  
  // Create a typesafe version of the store with type assertions
  type UpdateThemeFunction = (themeSettings: any) => void;
  type SwitchThemeFunction = (themeId: string) => void;
  
  // Handle color change by directly calling the store
  const handleColorChange = (colorType: 'primaryColor' | 'backgroundColor', color: string) => {
    // Call the function directly on the store with type assertion
    const state = useQuizStore.getState() as any;
    if (state.updateTheme) {
      state.updateTheme({ [colorType]: color });
    }
  };

  // Handle font change
  const handleFontChange = (value: string) => {
    const state = useQuizStore.getState() as any;
    if (state.updateTheme) {
      state.updateTheme({ fontFamily: value });
    }
  };
  
  // Handle theme selection change
  const handleThemeChange = (themeId: string) => {
    const state = useQuizStore.getState() as any;
    if (state.switchTheme) {
      state.switchTheme(themeId);
    }
  };
  
  // Get theme settings or use defaults
  // Use type assertion to avoid TypeScript errors
  const quizWithTheme = quiz as any;
  const theme = quizWithTheme.theme || {
    primaryColor: '#000000',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#ffffff'
  };
  
  // Get available themes
  const themes = quizWithTheme.themes || [];
  const activeThemeId = quizWithTheme.activeThemeId || 'theme1';
  
  // Available font options - expanded to match element panel
  const fontOptions = [
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Helvetica, sans-serif', label: 'Helvetica' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: 'Tahoma, sans-serif', label: 'Tahoma' },
    { value: "'Trebuchet MS', sans-serif", label: 'Trebuchet MS' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: "'Times New Roman', serif", label: 'Times New Roman' },
    { value: "'Courier New', monospace", label: 'Courier New' },
    { value: "'Roboto', sans-serif", label: 'Roboto' },
    { value: "'Open Sans', sans-serif", label: 'Open Sans' },
    { value: "'Lato', sans-serif", label: 'Lato' },
    { value: "'Montserrat', sans-serif", label: 'Montserrat' },
    { value: "'Source Sans Pro', sans-serif", label: 'Source Sans Pro' },
    { value: "'Raleway', sans-serif", label: 'Raleway' },
    { value: "'Poppins', sans-serif", label: 'Poppins' }
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PanelHeader 
        title="Theme" 
        onClose={onClose} 
        color="#7c3aed" // Purple
      />
      
      {/* Panel content */}
      <div className="p-4 flex-1 overflow-auto min-h-0 space-y-6">
        {/* Theme Selector */}
        <PropertyGroup title="Theme Selection" icon={<Palette className="h-4 w-4" />}>
          <div className="space-y-2">
            <Label htmlFor="theme-selector" className="text-sm font-medium">
              Select Theme
            </Label>
            <Select onValueChange={handleThemeChange} value={activeThemeId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                {themes.map((t: ThemeItem) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PropertyGroup>

        <PropertyGroup title="Theme Settings" icon={<Palette className="h-4 w-4" />}>
          <div className="space-y-4">
            {/* Primary Color Picker */}
            <ColorPicker
              label="Primary Color"
              value={theme.primaryColor}
              onChange={(color) => handleColorChange('primaryColor', color)}
            />
            
            {/* Font Family Selector */}
            <div className="space-y-2">
              <Label htmlFor="font-family" className="text-sm font-medium">
                Font Family
              </Label>
              <Select onValueChange={handleFontChange} value={theme.fontFamily}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a font" />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map(font => (
                    <SelectItem 
                      key={font.value} 
                      value={font.value} 
                      style={{ fontFamily: font.value }}
                    >
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Background Color Picker */}
            <ColorPicker
              label="Background Color"
              value={theme.backgroundColor}
              onChange={(color) => handleColorChange('backgroundColor', color)}
            />
          </div>
        </PropertyGroup>
      </div>
    </div>
  );
}
