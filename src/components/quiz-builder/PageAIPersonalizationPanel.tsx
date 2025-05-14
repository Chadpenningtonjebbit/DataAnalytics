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
  ShoppingCart,
  Tag,
  Trophy,
  Palette,
  Boxes,
  Link,
  Sparkles
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MentionInput, MentionOption } from '@/components/ui/mention-input';
import { QuizElement, SectionType } from '@/types';
import { FormSelect } from "@/components/ui/form-select";
import { toast } from "sonner";
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { Slider } from "@/components/ui/slider";

// Define the mention options
const MENTION_OPTIONS: MentionOption[] = [
  { id: 'name', label: 'Name', value: '@Name', icon: <User className="h-4 w-4" /> },
  { id: 'city', label: 'City', value: '@City', icon: <MapPin className="h-4 w-4" /> },
  { id: 'hobby', label: 'Hobby', value: '@Hobby', icon: <Heart className="h-4 w-4" /> },
  { id: 'sport', label: 'Sport', value: '@Sport', icon: <Trophy className="h-4 w-4" /> },
  { id: 'behavior.products', label: 'Products Viewed', value: '@ProductsViewed', icon: <ShoppingBag className="h-4 w-4" /> },
  { id: 'behavior.categories', label: 'Categories Viewed', value: '@CategoriesViewed', icon: <Tag className="h-4 w-4" /> },
  { id: 'behavior.lastPurchase', label: 'Last Purchase', value: '@LastPurchase', icon: <ShoppingCart className="h-4 w-4" /> },
  { id: 'city.location', label: 'City', value: '@City', icon: <MapPin className="h-4 w-4" /> },
  { id: 'hobby.interest', label: 'Hobby', value: '@Hobby', icon: <Palette className="h-4 w-4" /> },
  { id: 'sport', label: 'Sport', value: '@Sport', icon: <Trophy className="h-4 w-4" /> },
  { id: 'pastPurchases', label: 'Past Purchases', value: '@PastPurchases', icon: <ShoppingBag className="h-4 w-4" /> },
];

interface PageAIPersonalizationPanelProps {
  isExperienceWide?: boolean;
}

export function PageAIPersonalizationPanel({ isExperienceWide = false }: PageAIPersonalizationPanelProps) {
  const quiz = useQuizStore((state) => state.quiz);
  const updateElement = useQuizStore((state) => state.updateElement);
  // Use any to bypass type checking until the useQuizStore types are updated
  const updateQuiz = useQuizStore((state: any) => state.updateQuiz);

  // AI settings state
  const [aiSettings, setAiSettings] = useState({
    personalizationType: 'profile',
    campaignGoal: 'conversion',
    personalizationLevel: 'high',
    contentInstructions: '',
    enableDestinationMatching: false,
    enableProductPersonalization: false
  });

  // State for tracking when settings are applied to all elements
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [productFeedMissing, setProductFeedMissing] = useState(false);

  // Get current screen
  const currentScreen = quiz.screens[quiz.currentScreenIndex];

  // Check if API key exists on component mount
  useEffect(() => {
    const openAIKey = localStorage.getItem('brandOpenAIKey') || '';
    setApiKeyMissing(!openAIKey);
    
    // Check if product feed is set
    setProductFeedMissing(!quiz.productFeed?.url);
  }, [quiz.productFeed]);

  // Load quiz-wide settings on component mount if in experience-wide mode
  useEffect(() => {
    if (isExperienceWide && quiz.aiSettings) {
      try {
        const parsedSettings = JSON.parse(quiz.aiSettings);
        setAiSettings({
          personalizationType: parsedSettings.personalizationType || 'profile',
          campaignGoal: parsedSettings.campaignGoal || 'conversion',
          personalizationLevel: parsedSettings.personalizationLevel || 'high',
          contentInstructions: parsedSettings.contentInstructions || '',
          enableDestinationMatching: parsedSettings.enableDestinationMatching === true || 
                                    parsedSettings.enableDestinationMatching === "true",
          enableProductPersonalization: parsedSettings.enableProductPersonalization === true ||
                                      parsedSettings.enableProductPersonalization === "true"
        });
      } catch (e) {
        console.error('Failed to parse quiz-wide AI settings:', e);
      }
    }
  }, [isExperienceWide, quiz.aiSettings]);

  // Get elements eligible for AI personalization
  const eligibleElements = (() => {
    if (!currentScreen) return [];
    
    const elements: QuizElement[] = [];
    const processedIds = new Set<string>();
    
    // Helper to recursively find all text and button elements
    const findEligibleElements = (element: QuizElement) => {
      // Add element if it's a text or button and hasn't been processed yet
      if ((element.type === 'text' || element.type === 'button' || element.type === 'product') && !processedIds.has(element.id)) {
        elements.push(element);
        processedIds.add(element.id);
      }
      
      // Process children if this is a group
      if (element.isGroup && element.children) {
        for (const child of element.children) {
          findEligibleElements(child);
        }
      }
    };
    
    // Process all sections in the current screen
    for (const sectionKey in currentScreen.sections) {
      const section = currentScreen.sections[sectionKey as SectionType];
      
      // Skip disabled sections
      if (!section.enabled) continue;
      
      // Process each element in the section
      for (const element of section.elements) {
        findEligibleElements(element);
      }
    }
    
    return elements;
  })();
  
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
          contentInstructions: parsedSettings.contentInstructions || '',
          // Ensure this is always a boolean
          enableDestinationMatching: parsedSettings.enableDestinationMatching === true || 
                                    parsedSettings.enableDestinationMatching === "true",
          enableProductPersonalization: parsedSettings.enableProductPersonalization === true ||
                                      parsedSettings.enableProductPersonalization === "true"
        });
        return true;
      } catch (e) {
        console.error('Failed to parse AI settings:', e);
      }
    }
    
    return false;
  };
  
  // Load settings from elements on mount if in screen mode
  useEffect(() => {
    if (!isExperienceWide) {
      checkForConsistentSettings();
    }
  }, [currentScreen, isExperienceWide]);

  // Function to handle AI setting changes
  const handleAISettingChange = (key: string, value: string | boolean | number[]) => {
    const newSettings = { ...aiSettings, [key]: value };
    setAiSettings(newSettings);

    // Update all affected elements
    if (!isExperienceWide) {
      // Only update elements in screen mode, not in experience-wide mode
      handleElementsUpdate(newSettings);
    } else {
      // In experience-wide mode, update the whole quiz
      const aiSettingsJSON = JSON.stringify(newSettings);
      updateQuiz({
        ...quiz,
        aiSettings: aiSettingsJSON
      });
    }

    toast.success('AI settings updated');
  };

  // Helper function to update all eligible elements with new settings
  const handleElementsUpdate = (settings: typeof aiSettings) => {
    // Get API key from localStorage
    const openAIKey = localStorage.getItem('brandOpenAIKey') || '';
    
    // Prepare settings string
    const settingsString = JSON.stringify({
      ...settings,
      openAIKey
    });
    
    // Apply settings to all eligible elements
    eligibleElements.forEach(element => {
      updateElement(element.id, {
        attributes: {
          ...element.attributes,
          aiSettings: settingsString
        }
      });
    });
  };

  // Create debounced version of content instructions change handler
  const debouncedHandleContentInstructionsChange = useDebouncedCallback(
    (value: string) => {
      handleAISettingChange('contentInstructions', value);
    },
    800 // slightly longer debounce for text input
  );

  // Handle content instructions change using the MentionInput
  const handleContentInstructionsChange = (value: string) => {
    // Update local state immediately for UI feedback
    setAiSettings(prev => ({
      ...prev,
      contentInstructions: value
    }));
    
    // Trigger the debounced function to actually apply the changes
    debouncedHandleContentInstructionsChange(value);
  };

  // If no eligible elements and not in experience-wide mode
  if (!isExperienceWide && eligibleElements.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">There are no text or button elements on this screen to configure AI personalization.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {apiKeyMissing && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-md text-sm text-muted-foreground mb-4 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-500"></div>
          <p className="text-amber-700 dark:text-amber-400">
            OpenAI API key not found. Please set your API key in Brand Settings to use AI personalization.
          </p>
        </div>
      )}
      
      <FormSelect
        label="Personalization type"
        value={aiSettings.personalizationType}
        onChange={(value) => handleAISettingChange('personalizationType', value)}
        options={[
          { value: 'profile', label: 'User Profile' },
          { value: 'behavior', label: 'User Behavior' },
          { value: 'location', label: 'Geographic' }
        ]}
      />
      
      <FormSelect
        label="Campaign goal"
        value={aiSettings.campaignGoal}
        onChange={(value) => handleAISettingChange('campaignGoal', value)}
        options={[
          { value: 'conversion', label: 'Increase Conversions' },
          { value: 'engagement', label: 'Boost Engagement' },
          { value: 'education', label: 'Educate Audience' },
          { value: 'retention', label: 'Improve Retention' }
        ]}
      />

      <div className="space-y-2">
        <Label htmlFor="content-instructions" className="text-sm font-medium leading-none mb-2">
          Personalization instructions
        </Label>
        
        <MentionInput
          value={aiSettings.contentInstructions}
          onChange={handleContentInstructionsChange}
          placeholder="Add custom text with @variables and any rules to guide personalization (e.g., 'Always use a friendly tone when mentioning @Name')"
          options={MENTION_OPTIONS}
          className="min-h-[100px] resize-y"
        />
      </div>

      {/* Destination Matching Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="destination-matching" className="text-sm font-medium h-[14px]">
            Smart destinations
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="max-w-72">
                <p>When enabled, AI will automatically link buttons to the most relevant pages on your website based on personalized content.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          id="destination-matching"
          checked={aiSettings.enableDestinationMatching}
          onCheckedChange={(checked) => handleAISettingChange('enableDestinationMatching', checked)}
        />
      </div>
      
      {/* Product Personalization Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="product-personalization" className="text-sm font-medium h-[14px]">
            Product personalization
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" align="center" className="max-w-72">
                <p>{productFeedMissing 
                  ? "Add a product feed in CMS panel to enable product personalization" 
                  : "When enabled, AI will select the most relevant products from your product feed for each product element based on user profile data."}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          id="product-personalization"
          checked={aiSettings.enableProductPersonalization}
          onCheckedChange={(checked) => handleAISettingChange('enableProductPersonalization', checked)}
          disabled={productFeedMissing}
        />
      </div>
    </div>
  );
} 