"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useQuizStore } from '@/store/useQuizStore';
import { QuizElement, SectionType } from '@/types';
import { PropertyGroup } from '@/components/ui/property-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MentionInput, MentionOption } from '@/components/ui/mention-input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { 
  Key, 
  Settings, 
  MessageSquareText, 
  Info,
  AlertCircle,
  Wand2,
  User,
  Mail,
  MapPin,
  Heart,
  Building,
  BarChart,
  Briefcase,
  Smartphone,
  Globe,
  Clock,
  Calendar,
  Cloud,
  Sun,
  ShoppingBag,
  Tag,
  ShoppingCart,
  Link,
  Palette,
  Trophy,
} from 'lucide-react';

// Mention options 
const MENTION_OPTIONS: MentionOption[] = [
  { id: 'name', label: 'Name', value: '@Name', icon: <User className="h-4 w-4" /> },
  { id: 'email', label: 'Email', value: '@Email', icon: <Mail className="h-4 w-4" /> },
  { id: 'location', label: 'Location', value: '@Location', icon: <MapPin className="h-4 w-4" /> },
  { id: 'interests', label: 'Interests', value: '@Interests', icon: <Heart className="h-4 w-4" /> },
  { id: 'hobby', label: 'Hobby', value: '@Hobby', icon: <Heart className="h-4 w-4" /> },
  { id: 'company', label: 'Company', value: '@Company', icon: <Building className="h-4 w-4" /> },
  { id: 'role', label: 'Role', value: '@Role', icon: <Briefcase className="h-4 w-4" /> },
  { id: 'industry', label: 'Industry', value: '@Industry', icon: <BarChart className="h-4 w-4" /> },
  { id: 'device.type', label: 'Device Type', value: '@DeviceType', icon: <Smartphone className="h-4 w-4" /> },
  { id: 'device.browser', label: 'Browser', value: '@Browser', icon: <Globe className="h-4 w-4" /> },
  { id: 'time.hour', label: 'Current Hour', value: '@CurrentHour', icon: <Clock className="h-4 w-4" /> },
  { id: 'time.dayOfWeek', label: 'Day of Week', value: '@DayOfWeek', icon: <Calendar className="h-4 w-4" /> },
  { id: 'time.month', label: 'Current Month', value: '@CurrentMonth', icon: <Calendar className="h-4 w-4" /> },
  { id: 'time.season', label: 'Current Season', value: '@CurrentSeason', icon: <Sun className="h-4 w-4" /> },
  { id: 'location.city', label: 'City', value: '@City', icon: <MapPin className="h-4 w-4" /> },
  { id: 'location.country', label: 'Country', value: '@Country', icon: <Globe className="h-4 w-4" /> },
  { id: 'location.weather', label: 'Weather', value: '@Weather', icon: <Cloud className="h-4 w-4" /> },
  { id: 'behavior.pages', label: 'Pages Viewed', value: '@PagesViewed', icon: <Globe className="h-4 w-4" /> },
  { id: 'behavior.products', label: 'Products Viewed', value: '@ProductsViewed', icon: <ShoppingBag className="h-4 w-4" /> },
  { id: 'behavior.categories', label: 'Categories Viewed', value: '@CategoriesViewed', icon: <Tag className="h-4 w-4" /> },
  { id: 'behavior.lastPurchase', label: 'Last Purchase', value: '@LastPurchase', icon: <ShoppingCart className="h-4 w-4" /> },
  { id: 'city', label: 'City', value: '@City', icon: <MapPin className="h-4 w-4" /> },
  { id: 'hobby', label: 'Hobby', value: '@Hobby', icon: <Palette className="h-4 w-4" /> },
  { id: 'sport', label: 'Sport', value: '@Sport', icon: <Trophy className="h-4 w-4" /> },
  { id: 'pastPurchases', label: 'Past Purchases', value: '@PastPurchases', icon: <ShoppingBag className="h-4 w-4" /> },
];

export function PageAIPersonalizationPanel() {
  const { quiz, updateElement } = useQuizStore();

  // AI settings state
  const [aiSettings, setAiSettings] = useState({
    personalizationType: 'profile',
    campaignGoal: 'conversion',
    personalizationLevel: 'high',
    contentRules: '',
    contentInstructions: '',
    enableDestinationMatching: false
  });

  // State for tracking when settings are applied to all elements
  const [isApplied, setIsApplied] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  // Get current screen
  const currentScreen = quiz.screens[quiz.currentScreenIndex];

  // Check if API key exists on component mount
  useEffect(() => {
    const openAIKey = localStorage.getItem('brandOpenAIKey') || '';
    setApiKeyMissing(!openAIKey);
  }, []);

  // Find all eligible elements on the current screen
  const eligibleElements = useMemo(() => {
    if (!currentScreen) return [];
    
    const elements: QuizElement[] = [];
    
    // Recursive function to find elements in nested groups
    const findElementsInGroup = (group: QuizElement) => {
      if (group.isGroup && group.children) {
        // Process each child
        for (const child of group.children) {
          if (child.type === 'text' || child.type === 'button') {
            elements.push(child);
          }
          
          if (child.isGroup && child.children) {
            findElementsInGroup(child);
          }
        }
      }
    };
    
    // Process each section
    for (const sectionKey of Object.keys(currentScreen.sections) as SectionType[]) {
      const section = currentScreen.sections[sectionKey];
      
      // Find direct elements in the section
      section.elements.forEach((element: QuizElement) => {
        if (element.type === 'text' || element.type === 'button') {
          elements.push(element);
        }
        
        // Process groups
        if (element.isGroup && element.children) {
          findElementsInGroup(element);
        }
      });
    }
    
    return elements;
  }, [currentScreen]);
  
  // Check if there are consistent AI settings across all elements
  const checkForConsistentSettings = () => {
    if (eligibleElements.length === 0) return false;
    
    let foundSettings = false;
    let settingsString = '';
    
    for (const element of eligibleElements) {
      if (element.attributes?.aiSettings) {
        if (!foundSettings) {
          foundSettings = true;
          settingsString = element.attributes.aiSettings;
        } else if (element.attributes.aiSettings !== settingsString) {
          return false; // Found inconsistent settings
        }
      } else if (foundSettings) {
        return false; // Some elements have settings, some don't
      }
    }
    
    // If we found settings consistently across elements, parse and use them
    if (foundSettings && settingsString) {
      try {
        const parsedSettings = JSON.parse(settingsString);
        // Exclude openAIKey from the state, as it will be loaded from localStorage
        setAiSettings({
          personalizationType: parsedSettings.personalizationType || 'profile',
          campaignGoal: parsedSettings.campaignGoal || 'conversion',
          personalizationLevel: parsedSettings.personalizationLevel || 'high',
          contentRules: parsedSettings.contentRules || '',
          contentInstructions: parsedSettings.contentInstructions || '',
          // Ensure this is always a boolean
          enableDestinationMatching: parsedSettings.enableDestinationMatching === true || 
                                    parsedSettings.enableDestinationMatching === "true"
        });
        return true;
      } catch (e) {
        console.error('Failed to parse AI settings:', e);
      }
    }
    
    return false;
  };
  
  // Load settings from elements on mount
  useEffect(() => {
    checkForConsistentSettings();
    // Reset the applied state when switching screens
    setIsApplied(false);
  }, [currentScreen]);

  // Handle AI settings changes
  const handleAISettingChange = (key: string, value: string | boolean) => {
    // Update local state
    const newSettings = {
      ...aiSettings,
      [key]: value
    };
    
    setAiSettings(newSettings);
    
    // Get API key from localStorage
    const openAIKey = localStorage.getItem('brandOpenAIKey') || '';
    
    // Auto-apply settings to all elements with API key as a separate property
    const settingsString = JSON.stringify({
      ...newSettings,
      openAIKey
    });
    
    eligibleElements.forEach(element => {
      updateElement(element.id, {
        attributes: {
          ...element.attributes,
          aiSettings: settingsString
        }
      });
    });
    
    // Show success message
    setIsApplied(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setIsApplied(false);
    }, 3000);
  };

  // Handle content instructions change using the MentionInput
  const handleContentInstructionsChange = (value: string) => {
    handleAISettingChange('contentInstructions', value);
  };
  
  // If no eligible elements
  if (eligibleElements.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">There are no text or button elements on this screen to configure AI personalization.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {apiKeyMissing && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-md text-sm flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-amber-500"></div>
          <p className="text-amber-700 dark:text-amber-400">
            OpenAI API key not found. Please set your API key in Brand Settings to use AI personalization.
          </p>
        </div>
      )}
      
      {isApplied && (
        <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-md text-sm flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <p className="text-green-700 dark:text-green-400">Settings applied to all {eligibleElements.length} elements on this screen.</p>
        </div>
      )}

      <PropertyGroup title="Strategy" icon={<Settings className="h-4 w-4" />}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="personalization-type">Type</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="left" align="center" className="max-w-72">
                    <p>
                      <strong>Profile:</strong> Personalize based on user data like demographics and interests.<br/>
                      <strong>Behavior:</strong> Personalize based on user actions and browsing patterns.<br/>
                      <strong>Context:</strong> Personalize based on situational factors like time, location, and device.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select 
              value={aiSettings.personalizationType}
              onValueChange={(value) => handleAISettingChange('personalizationType', value)}
            >
              <SelectTrigger id="personalization-type" className="w-full">
                <SelectValue placeholder="Select personalization type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profile">Profile Based</SelectItem>
                <SelectItem value="behavior">Behavior Based</SelectItem>
                <SelectItem value="context">Context Based</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="campaign-goal">Campaign Goal</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="left" align="center" className="max-w-72">
                    <p>
                      <strong>Conversion:</strong> Focus on driving purchases or sign-ups.<br/>
                      <strong>Engagement:</strong> Encourage interaction with content.<br/>
                      <strong>Retention:</strong> Build loyalty and repeat usage.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select 
              value={aiSettings.campaignGoal}
              onValueChange={(value) => handleAISettingChange('campaignGoal', value)}
            >
              <SelectTrigger id="campaign-goal" className="w-full">
                <SelectValue placeholder="Select campaign goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conversion">Increase conversions</SelectItem>
                <SelectItem value="engagement">Improve engagement</SelectItem>
                <SelectItem value="retention">Enhance retention</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="personalization-level">Personalization Level</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="left" align="center" className="max-w-72">
                    <p>
                      <strong>High:</strong> Strong personalization that directly references user interests.<br/>
                      <strong>Medium:</strong> Moderate personalization that adapts to user context.<br/>
                      <strong>Low:</strong> Subtle personalization with minimal changes to content.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select 
              value={aiSettings.personalizationLevel}
              onValueChange={(value) => handleAISettingChange('personalizationLevel', value)}
            >
              <SelectTrigger id="personalization-level" className="w-full">
                <SelectValue placeholder="Select personalization level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PropertyGroup>

      <PropertyGroup title="Content" icon={<MessageSquareText className="h-4 w-4" />}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="content-instructions">Prompt Instructions</Label>
            <MentionInput
              id="content-instructions"
              value={aiSettings.contentInstructions}
              onChange={handleContentInstructionsChange}
              options={MENTION_OPTIONS}
              placeholder="Type your message and use @ to insert dynamic personalization variables..."
              minHeight="150px"
            />
            <div className="text-xs text-muted-foreground">
              <p>Type @ to access personalization variables that will be dynamically replaced.</p>
            </div>
          </div>
        </div>
      </PropertyGroup>

      <PropertyGroup title="Destination" icon={<Link className="h-4 w-4" />}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between space-y-0.5">
            <div className="space-y-2">
              <Label htmlFor="destination-matching">Smart Logic</Label>
              <p className="text-sm text-muted-foreground">
                Automatically update button destinations based on personalized content
              </p>
            </div>
            <Switch
              id="destination-matching"
              checked={aiSettings.enableDestinationMatching}
              onCheckedChange={(checked) => handleAISettingChange('enableDestinationMatching', checked)}
            />
          </div>
        </div>
      </PropertyGroup>
    </div>
  );
} 