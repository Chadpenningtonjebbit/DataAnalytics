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
  Trash,
  Code,
  CloudLightning,
  CheckCircle,
  Paintbrush,
  DiamondPlus,
  Binary,
  Sparkles,
  LayoutGrid,
  Blocks,
  Database,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { DraggableElement } from '@/components/quiz-builder/DraggableElement';
import { ElementType, SectionType, ThemeItem, ThemeSettings } from '@/types';
import { useQuizStore } from '@/store/useQuizStore';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
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
import { Slider } from "@/components/ui/slider";
import { NumericInput } from "@/components/ui/numeric-input";
import { CodeEditor } from '@/components/quiz-builder/CodeEditor';
import { PageAIPersonalizationPanel } from '@/components/quiz-builder/PageAIPersonalizationPanel';
import { CSVTable } from '@/components/ui/csv-table';
import { CSVPreviewModal } from '@/components/ui/csv-preview-modal';
import { toast } from "sonner";

const elementCategories = [
  {
    title: "Elements",
    items: [
      { type: 'text' as ElementType, name: "Text", icon: <Type className="h-4 w-4" /> },
      { type: 'button' as ElementType, name: "Button", icon: <Square className="h-4 w-4" /> },
      { type: 'link' as ElementType, name: "Link", icon: <LinkIcon className="h-4 w-4" /> },
      { type: 'image' as ElementType, name: "Image", icon: <Image className="h-4 w-4" /> },
      { type: 'product' as ElementType, name: "Product", icon: <Boxes className="h-4 w-4" /> },
    ]
  }
];

// Flatten all elements for easier searching
const allElements = elementCategories.flatMap(category => category.items);

// Sidebar panels
const SIDEBAR_PANELS = [
  {
    id: "content",
    label: "Elements",
    icon: <DiamondPlus className="h-4 w-4" />
  },
  {
    id: "sections",
    label: "Sections",
    icon: <Blocks className="h-4 w-4" />
  },
  {
    id: "theme",
    label: "Theme",
    icon: <Paintbrush className="h-4 w-4" />
  },
  {
    id: "cms",
    label: "CMS",
    icon: <Database className="h-4 w-4" />
  },
  {
    id: "code",
    label: "Code View",
    icon: <Binary className="h-4 w-4" />
  }
];

export function NestedLeftSidebar() {
  // Active sidebar panel
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const { quiz, toggleSection } = useQuizStore();
  const currentScreen = quiz.screens[quiz.currentScreenIndex];
  const [searchQuery, setSearchQuery] = useState('');
  const panelSizes = usePanelSizes();
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  
  // Check if API key exists
  useEffect(() => {
    const openAIKey = localStorage.getItem('brandOpenAIKey') || '';
    setApiKeyMissing(!openAIKey);
  }, []);
  
  // Notify parent about collapsed state on initial render
  useEffect(() => {
    if ('onLeftPanelCollapsedChange' in panelSizes) {
      (panelSizes.onLeftPanelCollapsedChange as (collapsed: boolean) => void)(true);
    }
  }, []);
  
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
        <div className="flex flex-col items-center py-2 gap-2 flex-1">
          {SIDEBAR_PANELS.map((panel) => (
            <TooltipProvider key={panel.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "w-10 h-10 flex items-center justify-center rounded-md",
                      activePanel === panel.id 
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted",
                      panel.id === "ai" && apiKeyMissing ? "opacity-50" : ""
                    )}
                    onClick={() => {
                      if (panel.id === "ai" && apiKeyMissing) return;
                      handlePanelClick(panel.id);
                    }}
                    aria-label={panel.label}
                    disabled={panel.id === "ai" && apiKeyMissing}
                  >
                    {panel.icon}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {panel.id === "ai" && apiKeyMissing 
                    ? "OpenAI API key required. Set it in My Brand / Integrations tab."
                    : panel.id === effectivePanelType && !isPanelExpanded 
                      ? `Expand ${panel.label}` 
                      : panel.label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
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
              onClose={handlePanelClose}
            />
          )}
          
          {effectivePanelType === "sections" && (
            <SectionsPanel 
              currentScreen={currentScreen}
              toggleSection={toggleSection}
              onClose={handlePanelClose}
            />
          )}
          
          {effectivePanelType === "theme" && (
            <ThemePanel onClose={handlePanelClose} />
          )}
          
          {effectivePanelType === "cms" && (
            <CMSPanel onClose={handlePanelClose} />
          )}
          
          {effectivePanelType === "code" && (
            <CodePanel onClose={handlePanelClose} />
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
  onClose
}: { 
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredElements: any[];
  onClose?: () => void;
}) {
  return (
    <div className="h-full flex flex-col left-sidebar overflow-hidden">
      <PanelHeader 
        title="Elements" 
        onClose={onClose}
      />
      
      {/* Panel content */}
      <div className="flex-1 overflow-auto min-h-0">
        <div className="p-4">
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
                        <Card className="hover:border-primary">
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
        </div>
      </div>
    </div>
  );
}

// Sections panel component
function SectionsPanel({ 
  currentScreen,
  toggleSection,
  onClose
}: { 
  currentScreen: any;
  toggleSection: (sectionId: SectionType) => void;
  onClose?: () => void;
}) {
  return (
    <div className="h-full flex flex-col left-sidebar overflow-hidden">
      <PanelHeader 
        title="Sections" 
        onClose={onClose}
      />
      
      {/* Panel content */}
      <div className="flex-1 overflow-auto min-h-0">
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
    </div>
  );
}

// AIPanel component
// Theme panel component
function ThemePanel({ onClose }: { onClose: () => void }) {
  // Get the entire store state and ignore TypeScript errors for specific actions
  const { quiz } = useQuizStore();
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  
  // Create a typesafe version of the store with type assertions
  type UpdateThemeFunction = (themeSettings: any) => void;
  type SwitchThemeFunction = (themeId: string) => void;
  
  // Function to determine if a color is light or dark
  const isLightColor = (color: string) => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate brightness (using relative luminance)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return true if color is light
    return brightness > 128;
  };
  
  // Handle color change by directly calling the store
  const handleColorChange = (colorType: 'primaryColor' | 'backgroundColor' | 'textColor', color: string) => {
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
  
  // Handle corner radius change
  const handleCornerRadiusChange = (value: string) => {
    const state = useQuizStore.getState() as any;
    if (state.updateTheme) {
      state.updateTheme({ cornerRadius: value });
    }
  };
  
  // Handle size change
  const handleSizeChange = (value: string) => {
    const state = useQuizStore.getState() as any;
    if (state.updateTheme) {
      state.updateTheme({ size: value });
    }
  };
  
  // Handle theme selection change
  const handleThemeChange = (themeId: string) => {
    const state = useQuizStore.getState() as any;
    
    if (state.switchTheme) {
      // Simply call the store's switchTheme function to handle the theme change
      // This will use the actual theme settings from the store
      state.switchTheme(themeId);
    }
  };

  // Start editing a theme
  const handleEditTheme = (e: React.MouseEvent, themeId: string) => {
    e.stopPropagation(); // Prevent triggering theme selection
    setEditingThemeId(themeId);
    
    // If this is not the active theme, switch to it first
    if (themeId !== activeThemeId) {
      handleThemeChange(themeId);
    }
  };

  // Exit editing mode
  const handleBackToThemes = () => {
    setEditingThemeId(null);
  };
  
  // Get theme settings or use defaults
  // Use type assertion to avoid TypeScript errors
  const quizWithTheme = quiz as any;
  const theme = quizWithTheme.theme || {
    primaryColor: '#000000',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#ffffff',
    cornerRadius: '4px',
    size: 'small'
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
  
  // Get the theme being edited (if any)
  const editingTheme = editingThemeId 
    ? themes.find((t: ThemeItem) => t.id === editingThemeId) 
    : null;
  
  return (
    <div className="h-full flex flex-col left-sidebar overflow-hidden">
      <PanelHeader 
        title={
          <div className="flex items-center">
            {editingThemeId && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 mr-2" 
                      onClick={handleBackToThemes}
                      aria-label="Back to themes"
                    >
                      <ArrowDown className="h-4 w-4 rotate-90" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Back to themes</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <span>{editingThemeId ? `Edit ${editingTheme?.name || 'Theme'}` : 'Theme'}</span>
          </div>
        } 
        onClose={onClose} 
      />
      
      {/* Panel content */}
      <div className="flex-1 overflow-auto min-h-0">
        <div className="space-y-0">
          {!editingThemeId ? (
            // Show theme list
            <PropertyGroup title="Available Themes" icon={<Palette className="h-4 w-4" />}>
              <div className="space-y-4">
                {themes.map((theme: ThemeItem) => (
                  <div 
                    key={theme.id}
                    className={cn(
                      "rounded-md border overflow-hidden cursor-pointer hover:border-primary relative shadow-sm",
                      activeThemeId === theme.id && "ring-2 ring-primary"
                    )}
                    onClick={() => handleThemeChange(theme.id)}
                  >
                    <div className="p-4" 
                      style={{ 
                        backgroundColor: theme.settings.backgroundColor,
                        color: theme.settings.textColor,
                        fontFamily: theme.settings.fontFamily
                      }}
                    >
                      <h4 className="text-md font-bold">
                        {theme.id === 'theme1' ? 'Midnight Classic' : 
                         theme.id === 'theme2' ? 'Ocean Breeze' : 
                         theme.id === 'theme3' ? 'Emerald Forest' : 
                         theme.id === 'theme4' ? 'Royal Lavender' : 
                         theme.id === 'theme5' ? 'Fiery Ruby' : 
                         theme.name}
                      </h4>
                      <div className="mt-3 flex items-center space-x-2">
                        <div 
                          className="h-6 w-6 shadow-sm" 
                          style={{ 
                            backgroundColor: theme.settings.primaryColor,
                            borderRadius: theme.settings.cornerRadius
                          }}
                        />
                        <div 
                          className="h-6 w-6 shadow-sm" 
                          style={{ 
                            backgroundColor: theme.settings.textColor,
                            borderRadius: theme.settings.cornerRadius
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Edit button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={(e) => handleEditTheme(e, theme.id)}
                      aria-label={`Edit ${theme.name}`}
                    >
                      <PencilLine className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </PropertyGroup>
          ) : (
            // Show theme customization when editing a specific theme
            <>
              <PropertyGroup title="Colors" icon={<Palette className="h-4 w-4" />}>
                <div className="flex flex-col gap-4">
                  {/* Primary Color Picker */}
                  <ColorPicker
                    label="Primary Color"
                    value={theme.primaryColor}
                    onChange={(color) => handleColorChange('primaryColor', color)}
                  />
                  
                  {/* Text Color Picker */}
                  <ColorPicker
                    label="Text Color"
                    value={theme.textColor || '#333333'}
                    onChange={(color) => handleColorChange('textColor', color)}
                  />
                  
                  {/* Background Color Picker */}
                  <ColorPicker
                    label="Background Color"
                    value={theme.backgroundColor}
                    onChange={(color) => handleColorChange('backgroundColor', color)}
                  />
                </div>
              </PropertyGroup>
              
              <PropertyGroup title="Typography" icon={<Type className="h-4 w-4" />}>
                <div className="flex flex-col gap-4">
                  {/* Font Family Selector */}
                  <div className="flex flex-col gap-2">
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
                </div>
              </PropertyGroup>
              
              <PropertyGroup title="Layout & Sizing" icon={<Layout className="h-4 w-4" />}>
                <div className="flex flex-col gap-4">
                  {/* Corner Radius Selector */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="corner-radius" className="text-sm font-medium">
                      Corner Radius
                    </Label>
                    <div className="flex items-center gap-2">
                      <Slider 
                        value={[parseInt(theme.cornerRadius?.replace(/px|%/g, '') || '0')]} 
                        min={0}
                        max={32} 
                        step={2} 
                        className="flex-1"
                        onValueChange={(value: number[]) => {
                          // Get current unit from the cornerRadius value or default to px
                          const unit = theme.cornerRadius?.includes('%') ? '%' : 'px';
                          handleCornerRadiusChange(`${value[0]}${unit}`);
                        }}
                      />
                      <NumericInput 
                        className="w-24" 
                        value={theme.cornerRadius || '0px'} 
                        onChange={handleCornerRadiusChange} 
                      />
                    </div>
                  </div>
                  
                  {/* Size Selector */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="element-size" className="text-sm font-medium">
                      Element Size
                    </Label>
                    <Select onValueChange={handleSizeChange} value={theme.size || 'small'}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select element size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PropertyGroup>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Code panel component
function CodePanel({ onClose }: { onClose?: () => void }) {
  return (
    <div className="h-full flex flex-col left-sidebar overflow-hidden">
      <PanelHeader 
        title="Code View" 
        onClose={onClose}
      />
      
      {/* Panel content */}
      <div className="flex-1 overflow-auto">
        <div className="h-full">
          <CodeEditor />
        </div>
      </div>
    </div>
  );
}

// CMS panel component
function CMSPanel({ onClose }: { onClose: () => void }) {
  const { quiz, setQuiz } = useQuizStore();
  const [isApplying, setIsApplying] = useState(false);
  const [productFeeds, setProductFeeds] = useState<Array<{url: string, name: string, type: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Get the currently selected feed from the quiz state
  const selectedFeed = quiz.productFeed?.url || "";
  const selectedFileName = quiz.productFeed?.name || "";
  
  // Fetch the actual product feeds from the brand
  useEffect(() => {
    const fetchProductFeeds = async () => {
      setIsLoading(true);
      try {
        // Fetch from the correct endpoint used in the application
        const response = await fetch('/api/media?folder=products');
        
        if (response.ok) {
          const data = await response.json();
          if (data.files && Array.isArray(data.files)) {
            setProductFeeds(data.files);
          } else {
            setProductFeeds([]);
          }
        } else {
          console.error('Failed to fetch product feeds');
          setProductFeeds([]);
        }
      } catch (error) {
        console.error('Error fetching product feeds:', error);
        setProductFeeds([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductFeeds();
  }, []);
  
  const applyProductFeed = async (feedUrl: string) => {
    if (!feedUrl || isApplying) return;
    
    setIsApplying(true);
    
    try {
      // Find the selected feed in the productFeeds array
      const selectedFile = productFeeds.find(feed => feed.url === feedUrl);
      
      if (selectedFile) {
        // Update the quiz with the selected product feed
        const updatedQuiz = {
          ...quiz,
          productFeed: {
            url: selectedFile.url,
            name: selectedFile.name
          }
        };
        
        // Save to the global state
        setQuiz(updatedQuiz);
        
        // Show success notification
        toast.success("Product feed applied to experience");
      }
    } catch (error) {
      console.error('Error applying product feed:', error);
      toast.error("Failed to apply product feed");
    } finally {
      setIsApplying(false);
    }
  };
  
  const handleFeedChange = (feedUrl: string) => {
    // Don't do anything if already applying or if the selected feed is the same
    if (isApplying || feedUrl === selectedFeed) return;
    
    // Apply the product feed when the selection changes
    applyProductFeed(feedUrl);
  };
  
  const handleOpenPreview = () => {
    setIsPreviewOpen(true);
  };
  
  const handleClosePreview = () => {
    setIsPreviewOpen(false);
  };
  
  // Clear product feed from the experience
  const handleClearFeed = () => {
    const updatedQuiz = {
      ...quiz,
      productFeed: undefined
    };
    
    setQuiz(updatedQuiz);
    toast.success("Product feed removed from experience");
  };
  
  // Check if the selected feed is a CSV file
  const isCSVFile = selectedFeed && (
    selectedFeed.endsWith('.csv') || 
    selectedFeed.endsWith('.xlsx') || 
    selectedFeed.endsWith('.xls')
  );
  
  return (
    <div className="h-full flex flex-col left-sidebar overflow-hidden">
      <PanelHeader 
        title="CMS" 
        onClose={onClose}
      />
      
      {/* Panel content */}
      <div className="flex-1 overflow-auto min-h-0">
        <PropertyGroup title="Product Feeds" icon={<Database className="h-4 w-4" />}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-feed">Select Product Feed</Label>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Loading product feeds...</span>
                </div>
              ) : productFeeds.length > 0 ? (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      value={selectedFeed}
                      onValueChange={handleFeedChange}
                      disabled={isApplying}
                    >
                      <SelectTrigger id="product-feed" className="w-full">
                        <SelectValue placeholder="Choose a product feed" />
                      </SelectTrigger>
                      <SelectContent>
                        {productFeeds.map((feed) => (
                          <SelectItem key={feed.url} value={feed.url}>
                            {feed.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedFeed && (
                    <div className="flex gap-1">
                      {isCSVFile && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={handleOpenPreview}
                                disabled={isApplying}
                              >
                                <Search className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Preview Feed Data
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={handleClearFeed}
                              disabled={isApplying}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Remove Feed
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-2 border rounded-md">
                  No product feeds found. Please upload product feeds in your Media page.
                </div>
              )}
            </div>
          </div>
        </PropertyGroup>
      </div>
      
      {/* CSV Preview Modal */}
      {selectedFeed && isCSVFile && (
        <CSVPreviewModal
          isOpen={isPreviewOpen}
          onClose={handleClosePreview}
          fileUrl={selectedFeed}
          fileName={selectedFileName}
        />
      )}
    </div>
  );
}
