"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useQuizStore } from '@/store/useQuizStore';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from "@/components/ui/switch";
import { 
  AlertCircle,
  Info,
  Key,
  Settings,
  FileText,
  MessageSquareText,
  User,
  MapPin,
  Heart,
  ShoppingBag,
  Link
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PropertyGroup } from '@/components/ui/property-group';
import { MentionInput, MentionOption } from '@/components/ui/mention-input';
import { QuizElement, SectionType } from '@/types';

// Define the mention options
const MENTION_OPTIONS: MentionOption[] = [
  { id: 'name', label: 'Name', value: '@Name', icon: <User className="h-4 w-4" /> },
  { id: 'city', label: 'City', value: '@City', icon: <MapPin className="h-4 w-4" /> },
  { id: 'hobby', label: 'Hobby', value: '@Hobby', icon: <Heart className="h-4 w-4" /> },
  { id: 'pastpurchases', label: 'Past Purchases', value: '@PastPurchases', icon: <ShoppingBag className="h-4 w-4" /> },
];

export function AIPersonalizationPanel() {
  const { 
    quiz, 
    selectedElementIds, 
    updateElement,
  } = useQuizStore();

  // AI settings state
  const [aiSettings, setAiSettings] = useState({
    personalizationType: 'profile',
    campaignGoal: 'conversion',
    personalizationLevel: 'high',
    contentRules: '',
    contentInstructions: '',
    enableDestinationMatching: false
  });

  // State to track API key availability
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  // Find all selected elements
  const selectedElements = useMemo(() => {
    if (selectedElementIds.length === 0) return [];
    
    const elements: QuizElement[] = [];
    
    // Recursive function to find elements in nested groups
    const findElementsInGroup = (group: QuizElement, elementsToFind: string[]) => {
      if (group.isGroup && group.children) {
        // Check direct children of this group
        const foundElements = group.children.filter((child: QuizElement) => 
          elementsToFind.includes(child.id)
        );
        elements.push(...foundElements);
        
        // Check nested groups
        for (const childElement of group.children) {
          if (childElement.isGroup && childElement.children) {
            findElementsInGroup(childElement, elementsToFind);
          }
        }
      }
    };
    
    for (const screen of quiz.screens) {
      // Look for the elements in each section
      for (const sectionKey of Object.keys(screen.sections) as SectionType[]) {
        const section = screen.sections[sectionKey];
        
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

  // Check if all selected elements are eligible for personalization (text or button)
  const eligibleElements = useMemo(() => {
    return selectedElements.filter(el => 
      el.type === 'text' || el.type === 'button'
    );
  }, [selectedElements]);

  // Load AI settings from the first selected element when selection changes
  useEffect(() => {
    // Check if API key exists
    const openAIKey = localStorage.getItem('brandOpenAIKey') || '';
    setApiKeyMissing(!openAIKey);
    
    if (eligibleElements.length > 0) {
      const firstElement = eligibleElements[0];
      if (firstElement.attributes?.aiSettings) {
        try {
          const settings = JSON.parse(firstElement.attributes.aiSettings);
          setAiSettings({
            personalizationType: settings.personalizationType || 'profile',
            campaignGoal: settings.campaignGoal || 'conversion',
            personalizationLevel: settings.personalizationLevel || 'high',
            contentRules: settings.contentRules || '',
            contentInstructions: settings.contentInstructions || '',
            enableDestinationMatching: settings.enableDestinationMatching || false
          });
        } catch (e) {
          console.error('Failed to parse AI settings:', e);
        }
      } else {
        // Reset to default settings if no AI settings exist
        setAiSettings({
          personalizationType: 'profile',
          campaignGoal: 'conversion',
          personalizationLevel: 'high',
          contentRules: '',
          contentInstructions: '',
          enableDestinationMatching: false
        });
      }
    }
  }, [eligibleElements, selectedElementIds]);

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
    
    // Auto-save settings to all eligible elements with API key
    const settingsString = JSON.stringify({
      ...newSettings,
      openAIKey
    });
    
    console.log(`Applying AI setting ${key}:`, value);
    console.log('Full settings being applied:', newSettings);
    
    eligibleElements.forEach(element => {
      console.log(`Applying AI settings to ${element.type} element:`, element.id);
      updateElement(element.id, {
        attributes: {
          ...element.attributes,
          aiSettings: settingsString
        }
      });
    });
  };

  // Check if all elements have same values
  const allElementsHaveSameSettings = useMemo(() => {
    if (eligibleElements.length <= 1) return true;
    
    const firstSettings = eligibleElements[0]?.attributes?.aiSettings
      ? JSON.parse(eligibleElements[0].attributes.aiSettings)
      : null;
      
    if (!firstSettings) return true;
    
    return eligibleElements.every(el => {
      if (!el.attributes?.aiSettings) return false;
      try {
        const elSettings = JSON.parse(el.attributes.aiSettings);
        return JSON.stringify(elSettings) === JSON.stringify(firstSettings);
      } catch (e) {
        return false;
      }
    });
  }, [eligibleElements]);

  // Handle content instructions change using the MentionInput
  const handleContentInstructionsChange = (value: string) => {
    handleAISettingChange('contentInstructions', value);
  };

  // If no elements or no eligible elements are selected
  if (selectedElements.length === 0 || eligibleElements.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">Select text or button elements to configure AI personalization.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {apiKeyMissing && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-md text-sm text-muted-foreground mb-4 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-500"></div>
          <p className="text-amber-700 dark:text-amber-400">
            OpenAI API key not found. Please set your API key in Brand Settings to use AI personalization.
          </p>
        </div>
      )}
      
      {!allElementsHaveSameSettings && (
        <div className="bg-muted/40 p-3 rounded-md text-sm text-muted-foreground mb-4">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>The selected elements have different AI personalization settings. Saving will apply the same settings to all elements.</p>
          </div>
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
            <Label htmlFor="content-instructions">Content Instructions</Label>
            <MentionInput
              id="content-instructions"
              value={aiSettings.contentInstructions}
              onChange={handleContentInstructionsChange}
              options={MENTION_OPTIONS}
              placeholder="Type specific words, phrases, or messages that the AI should use in its output..."
              minHeight="150px"
            />
            <div className="text-xs text-muted-foreground">
              <p>Type @ to access personalization variables that will be dynamically replaced.</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="content-rules">Additional Instructions</Label>
            <Textarea 
              id="content-rules"
              value={aiSettings.contentRules || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleAISettingChange('contentRules', e.target.value)}
              placeholder="Add any specific instructions for personalization..."
              className="min-h-[100px] resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Examples: "Use a formal tone", "Emphasize product benefits", "Reference local events in user's area"
            </p>
          </div>
        </div>
      </PropertyGroup>

      <PropertyGroup title="Destination" icon={<Link className="h-4 w-4" />}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between space-y-0.5">
            <div>
              <Label htmlFor="destination-matching" className="text-base">Smart CTA Destination</Label>
              <p className="text-sm text-muted-foreground">
                Automatically update button destinations based on personalized content
              </p>
            </div>
            <Switch
              id="destination-matching"
              checked={aiSettings.enableDestinationMatching}
              onCheckedChange={(checked) => handleAISettingChange('enableDestinationMatching', checked.toString())}
            />
          </div>
          
          {aiSettings.enableDestinationMatching && (
            <div className="bg-muted/40 p-3 rounded-md text-sm text-muted-foreground">
              <div className="flex gap-2">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>When enabled, buttons with AI personalization will automatically link to relevant brand pages that match the personalized content.</p>
              </div>
            </div>
          )}
        </div>
      </PropertyGroup>
    </div>
  );
} 