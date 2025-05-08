"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuizStore } from '@/store/useQuizStore';
import { useAnalyticsStore } from '@/store/useAnalyticsStore';
import { generateScreenHtml, generateScreenCss } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, User } from 'lucide-react';

// Define interface for user profile data
interface UserProfileData {
  name?: string;
  location?: string;
  hobbies?: string[];
  ownedProducts?: string[];
  sports?: string[];
  id?: string;
}

// Define interface for the user profile structure
interface UserProfile {
  name: string;
  data: UserProfileData;
}

// Define the user profiles using the interface
const USER_PROFILES: Record<string, UserProfile> = {
  default: {
    name: 'Default',
    data: {}
  },
  connor: {
    name: 'Connor',
    data: {
      name: 'Connor',
      location: 'Boston, MA',
      hobbies: ['Golf', 'Hiking', 'Skiing', 'Camping'],
      ownedProducts: ['Nike running shoes', 'tent', 'sleeping bag', 'taylormade driver', 'bridgestone golf balls'],
      sports: ['Golf', 'Skiing'],
      id: '1742523546883'
    }
  },
  sarah: {
    name: 'Sarah',
    data: {
      name: 'Sarah',
      location: 'San Francisco, CA',
      hobbies: ['Yoga', 'Photography', 'Cooking', 'Biking'],
      ownedProducts: ['Lululemon yoga mat', 'Canon camera', 'electric bike', 'cooking classes subscription'],
      sports: ['Yoga', 'Biking'],
      id: '9385671234523'
    }
  },
  michael: {
    name: 'Michael',
    data: {
      name: 'Michael',
      location: 'Austin, TX',
      hobbies: ['Running', 'Guitar', 'Basketball', 'Gaming'],
      ownedProducts: ['Adidas running shoes', 'Fender guitar', 'PlayStation 5', 'Spalding basketball'],
      sports: ['Running', 'Basketball'],
      id: '6239874512098'
    }
  },
  emma: {
    name: 'Emma',
    data: {
      name: 'Emma',
      location: 'New York, NY',
      hobbies: ['Fashion', 'Travel', 'Wine Tasting', 'Art', 'Tennis'],
      ownedProducts: ['Gucci handbag', 'DSLR camera', 'wine club membership', 'art supplies', 'Wilson tennis racket'],
      sports: ['Tennis', 'Pilates'],
      id: '4567891234567'
    }
  },
  david: {
    name: 'David',
    data: {
      name: 'David',
      location: 'Seattle, WA',
      hobbies: ['Tech', 'Coffee', 'Reading', 'Hiking', 'Swimming'],
      ownedProducts: ['MacBook Pro', 'espresso machine', 'Kindle', 'hiking boots', 'Speedo goggles'],
      sports: ['Swimming', 'Rock Climbing'],
      id: '7894561237890'
    }
  },
  sophia: {
    name: 'Sophia',
    data: {
      name: 'Sophia',
      location: 'Miami, FL',
      hobbies: ['Beach', 'Dancing', 'Fitness', 'Cooking', 'Volleyball'],
      ownedProducts: ['yoga mat', 'blender', 'dance shoes', 'beach umbrella', 'volleyball'],
      sports: ['Volleyball', 'Surfing'],
      id: '3216549873210'
    }
  },
  james: {
    name: 'James',
    data: {
      name: 'James',
      location: 'Chicago, IL',
      hobbies: ['Music', 'Sports', 'Cars', 'BBQ', 'Boxing'],
      ownedProducts: ['guitar', 'sports equipment', 'grill', 'car tools', 'boxing gloves'],
      sports: ['Boxing', 'Baseball'],
      id: '9876543210987'
    }
  }
};

// Function to generate personalized content with OpenAI
async function generatePersonalizedContent(
  originalContent: string, 
  userProfile: UserProfileData, 
  aiSettings: any,
  elementType: string = 'text'
): Promise<string> {
  if (!aiSettings?.openAIKey) {
    console.warn('OpenAI API key not provided');
    return originalContent;
  }
  
  try {
    // Process @ mentions in content instructions
    let processedInstructions = aiSettings.contentInstructions || '';
    
    // Replace @ variables with actual user data
    if (userProfile) {
      processedInstructions = processedInstructions
        .replace(/@Name/g, userProfile.name || 'User')
        .replace(/@City/g, userProfile.location || 'your area')
        .replace(/@Hobby/g, userProfile.hobbies?.[0] || 'your favorite activities')
        .replace(/@Sport/g, userProfile.sports?.[0] || 'your favorite sport')
        .replace(/@PastPurchases/g, userProfile.ownedProducts?.[0] || 'your previous purchases');
    }
    
    const elementTypePrompt = elementType === 'button' 
      ? 'This content is for a button element. Keep it concise and action-oriented.'
      : 'This content is for a text element.';

    const prompt = `
You are a professional marketing copywriter whose job is to create personalized, engaging content.

${elementTypePrompt}

User profile:
- Name: ${userProfile.name || 'Unknown'}
- Location: ${userProfile.location || 'Unknown'}
- Hobbies: ${userProfile.hobbies?.join(', ') || 'Unknown'}
- Sports: ${userProfile.sports?.join(', ') || 'Unknown'}
- Owned Products: ${userProfile.ownedProducts?.join(', ') || 'Unknown'}

IMPORTANT PERSONALIZATION SETTINGS - FOLLOW STRICTLY:
- Type: ${aiSettings.personalizationType} - This determines the core approach to personalization
- Goal: ${aiSettings.campaignGoal} - This is the primary objective that must be achieved
- Level: ${aiSettings.personalizationLevel} - This controls how heavily to personalize the content
- Custom rules: ${aiSettings.contentRules || 'None provided'} - These are mandatory instructions that must be followed
${processedInstructions ? `- Content Instructions: ${processedInstructions} - IMPORTANT: Use these exact words/phrases in your response wherever appropriate. These represent specific wording the user wants in the final output.` : ''}

Create personalized marketing content that would appeal to this specific user.

${originalContent}

IMPORTANT RULES:
1. Write natural marketing copy - do not mention "original text" or reference that you're modifying anything
2. Do not use quotation marks in your response
3. Do not use placeholder text like "New Text" or "Button" 
4. Write as if a marketer wrote this themselves directly for the user
5. Do not include the original text in your response
6. Do not say "based on your profile/interests/location" or similar phrases
7. If Content Instructions are provided, incorporate those specific words and phrases directly into your response
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiSettings.openAIKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a professional marketing copywriter who creates personalized, natural-sounding content. Write as if a human marketer created the text specifically for each individual user. Never mention that you are modifying existing content, never use quotation marks in your responses, and never reference AI or any personalization process.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content.trim();
    } else {
      console.error('No response from OpenAI API', data);
      return originalContent;
    }
  } catch (error) {
    console.error('Error generating personalized content:', error);
    return originalContent;
  }
}

// New function to generate personalized content in batches
async function generatePersonalizedContentBatch(
  elementsToPersonalize: Array<{
    elementId: string;
    content: string;
    elementType: string;
    aiSettings: any;
  }>,
  userProfile: UserProfileData
): Promise<Record<string, string>> {
  // If no elements to personalize, return empty result
  if (elementsToPersonalize.length === 0) {
    return {};
  }

  // Get OpenAI key from the first element (all should have the same key)
  const openAIKey = elementsToPersonalize[0].aiSettings.openAIKey;
  
  if (!openAIKey) {
    console.warn('OpenAI API key not provided');
    return {};
  }
  
  try {
    // Process elements and handle @ variables
    const processedElements = elementsToPersonalize.map(element => {
      // Deep clone the element to avoid modifying the original
      const processedElement = { ...element };
      
      // Process @ mentions in content instructions
      let processedInstructions = processedElement.aiSettings.contentInstructions || '';
      
      // Replace @ variables with actual user data
      if (userProfile) {
        processedInstructions = processedInstructions
          .replace(/@Name/g, userProfile.name || 'User')
          .replace(/@City/g, userProfile.location || 'your area')
          .replace(/@Hobby/g, userProfile.hobbies?.[0] || 'your favorite activities')
          .replace(/@Sport/g, userProfile.sports?.[0] || 'your favorite sport')
          .replace(/@PastPurchases/g, userProfile.ownedProducts?.[0] || 'your previous purchases');
      }
      
      // Update the element with processed instructions
      return {
        ...processedElement,
        aiSettings: {
          ...processedElement.aiSettings,
          processedInstructions
        }
      };
    });
    
    // Prepare an array of all elements to personalize with their specific settings
    const elementsData = processedElements.map((element, index) => {
      const elementTypePrompt = element.elementType === 'button' 
        ? 'This content is for a button element. Keep it concise and action-oriented.'
        : 'This content is for a text element.';

      return {
        id: element.elementId,
        originalContent: element.content,
        elementType: element.elementType,
        elementTypePrompt,
        settings: element.aiSettings
      };
    });

    // Create a batch prompt that includes all elements
    const batchPrompt = `
You are a professional marketing copywriter who creates personalized content for multiple elements on a webpage.

User profile:
- Name: ${userProfile.name || 'Unknown'}
- Location: ${userProfile.location || 'Unknown'}
- Hobbies: ${userProfile.hobbies?.join(', ') || 'Unknown'}
- Sports: ${userProfile.sports?.join(', ') || 'Unknown'}
- Owned Products: ${userProfile.ownedProducts?.join(', ') || 'Unknown'}

I need you to personalize ${elementsData.length} different content elements on a screen. 
For each element, I'll provide the original content, type of element, and personalization settings.

IMPORTANT GLOBAL RULES:
1. Write natural marketing copy - do not mention "original text" or reference that you're modifying anything
2. Do not use quotation marks in your response
3. Do not use placeholder text like "New Text" or "Button" 
4. Write as if a marketer wrote this themselves directly for the user
5. Do not include the original text in your response
6. Do not say "based on your profile/interests/location" or similar phrases
7. Maintain a consistent tone across all elements
8. Create a cohesive narrative across all elements - they should work together to tell a complete story
9. For header/subheader pairs, ensure they complement each other and build on the same message
10. For buttons, ensure their CTAs align with and support the messaging in the text elements
11. If Content Instructions are provided for an element, incorporate those exact words/phrases into your response for that element

ANALYZE ELEMENTS AND THEIR RELATIONSHIPS:
First, analyze how these elements should work together:

${elementsData.map((element, index) => `
ELEMENT ${index + 1} (ID: ${element.id}):
Type: ${element.elementType}
${element.elementType === 'text' ? 'Consider this element\'s role in the overall messaging hierarchy (header, subheader, body text, etc.)' : ''}
${element.elementType === 'button' ? 'This is a call-to-action element that should align with the messaging in text elements' : ''}

Original Content: ${element.originalContent}
`).join('\n')}

Now, create a cohesive messaging strategy that:
1. Identifies the main message/theme for this screen
2. Determines how each element contributes to that message
3. Ensures elements build on each other rather than repeating the same message
4. Creates a natural flow from headers to subheaders to body text to CTAs

Then, generate personalized content for each element that supports this cohesive strategy.

ELEMENT DETAILS AND SETTINGS:
${elementsData.map((element, index) => `
ELEMENT ${index + 1} (ID: ${element.id}):
Type: ${element.elementType}
${element.elementTypePrompt}

Personalization Settings:
- Type: ${element.settings.personalizationType}
- Goal: ${element.settings.campaignGoal}
- Level: ${element.settings.personalizationLevel}
- Custom rules: ${element.settings.contentRules || 'None provided'}
${element.settings.processedInstructions ? `- Content Instructions: ${element.settings.processedInstructions} - IMPORTANT: Use these exact words/phrases in your response for this element. These represent specific wording the user wants in the final output.` : ''}
`).join('\n')}

Please respond with a JSON object where each key is the element ID and the value is the personalized content.
Example format:
{
  "element-id-1": "Personalized content for element 1",
  "element-id-2": "Personalized content for element 2"
}

IMPORTANT: Before generating the final content:
1. First analyze how all elements should work together to create a cohesive message
2. Create a messaging strategy that ensures elements complement each other
3. Generate content for each element while maintaining that cohesion
4. Ensure headers and subheaders work together to tell a story
5. Make sure CTAs align with and support the messaging in text elements
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional marketing copywriter who creates personalized, natural-sounding content. Write as if a human marketer created the text specifically for each individual user. Never mention that you are modifying existing content, never use quotation marks in your responses, and never reference AI or any personalization process.' 
          },
          { role: 'user', content: batchPrompt }
        ],
        max_tokens: 1500, // Increased token limit for multiple elements
        temperature: 0.7,
        response_format: { type: "json_object" } // Ensure response is a valid JSON
      })
    });
    
    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      try {
        // Parse the JSON response
        const contentUpdates = JSON.parse(data.choices[0].message.content.trim());
        return contentUpdates;
      } catch (error) {
        console.error('Error parsing JSON response from OpenAI API:', error);
        return {};
      }
    } else {
      console.error('No response from OpenAI API', data);
      return {};
    }
  } catch (error) {
    console.error('Error generating personalized content batch:', error);
    return {};
  }
}

// Function to process quiz content and replace text with AI-generated personalized text
async function personalizeQuizContent(
  quiz: any, 
  screenIndex: number, 
  userProfile: UserProfileData,
  profileId: string
): Promise<{ html: string, css: string }> {
  if (!quiz || !quiz.screens || quiz.screens.length === 0 || screenIndex >= quiz.screens.length) {
    return { html: '', css: '' };
  }
  
  const screen = { ...quiz.screens[screenIndex] };
  let needsPersonalization = false;
  
  // Deep clone the screen to avoid modifying the original
  const clonedScreen = JSON.parse(JSON.stringify(screen));
  
  // Collection of elements to personalize
  const elementsToPersonalize: Array<{
    elementId: string;
    content: string;
    elementType: string;
    aiSettings: any;
  }> = [];
  
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
  
  // Get all brand pages
  const brandPages = getBrandPages();
  
  // Define the type for brand page
  interface BrandPage {
    url: string;
    title: string;
    type: string;
  }
  
  // Create a cache for brand page matches based on button content + user profile
  // This will ensure consistent matching throughout a session
  const matchCache: Record<string, string> = {};
  
  // Log which profile we're using
  console.log("🧑‍💼 Using user profile:", profileId);
  
  // Function to find matching brand page based on keywords in content
  const findMatchingBrandPage = (content: string, userProfile: UserProfileData): BrandPage | null => {
    // Create a cache key from content + user key to ensure consistent matching
    const cacheKey = `${content}_${profileId}`;
    
    // Check if we have a cached match for this content+user combination
    if (matchCache[cacheKey]) {
      console.log("🔄 Using cached match for:", content);
      
      // Find the page from the cached URL
      const cachedPage = brandPages.find((page: BrandPage) => page.url === matchCache[cacheKey]);
      if (cachedPage) {
        console.log("✅ Retrieved cached match:", cachedPage.title);
        return cachedPage;
      }
    }
    
    if (!brandPages || brandPages.length === 0) return null;
    
    console.log("🔍 Finding brand page match for:", content);
    console.log("👤 Using profile:", userProfile);
    
    // Get user's interests and hobbies for better matching
    const userInterests = [
      ...(userProfile.hobbies || []),
      ...(userProfile.ownedProducts || [])
    ].map(item => item.toLowerCase());
    
    console.log("🏷️ User interests:", userInterests);
    
    // Split content into words and extract significant keywords
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3) // Only consider words longer than 3 chars
      .filter(word => !['with', 'that', 'this', 'your', 'from', 'about', 'have', 'will', 'more'].includes(word)); // Exclude common words
    
    console.log("🔑 Keywords extracted:", words);
    
    // Hard match override: exact word matches page title or URL segment
    const hardMatches = brandPages.filter((page: BrandPage) => {
      const pageTitle = page.title.toLowerCase();
      const pageUrl = page.url.toLowerCase();
      return words.some(word =>
        pageTitle === word ||
        pageUrl.endsWith(`/${word}`) ||
        pageUrl === word ||
        pageUrl.split('/').includes(word)
      );
    });
    if (hardMatches.length > 0) {
      // Pick the most specific (shortest URL) if multiple
      const bestHardMatch = hardMatches.reduce((a: BrandPage, b: BrandPage) =>
        a.url.length <= b.url.length ? a : b
      );
      console.log("🚨 Hard match override:", bestHardMatch.title, bestHardMatch.url);
      return bestHardMatch;
    }
    
    // Score pages based on relevance
    const scoredPages = brandPages.map((page: BrandPage) => {
      const pageTitle = page.title.toLowerCase();
      const pageUrl = page.url.toLowerCase();
      let score = 0;
      
      // Check each word against the page title and URL
      for (const word of words) {
        // Check for exact matches in title (highest priority)
        if (pageTitle === word || 
            pageTitle.includes(` ${word} `) || 
            pageTitle.startsWith(`${word} `) || 
            pageTitle.endsWith(` ${word}`)) {
          score += 25; // Much higher score for exact title matches
          console.log(`   ✓ "${word}" exact match in title of "${page.title}" (+25)`);
        }
        // Check for partial matches in title
        else if (pageTitle.includes(word)) {
          score += 5; // Lower score for partial title matches
          console.log(`   ✓ "${word}" partial match in title of "${page.title}" (+5)`);
        }
        
        // Check for exact matches in URL
        if (pageUrl === word || 
            pageUrl.includes(`/${word}/`) || 
            pageUrl.endsWith(`/${word}`)) {
          score += 20; // High score for exact URL matches
          console.log(`   ✓ "${word}" exact match in URL of "${page.title}" (+20)`);
        }
        // Check for partial matches in URL
        else if (pageUrl.includes(word)) {
          score += 3; // Lower score for partial URL matches
          console.log(`   ✓ "${word}" partial match in URL of "${page.title}" (+3)`);
        }
        
        // Check for exact matches with user interests
        if (userInterests.some(interest => {
          const normalizedInterest = interest.toLowerCase();
          return normalizedInterest === word || 
                 normalizedInterest.includes(` ${word} `) || 
                 normalizedInterest.startsWith(`${word} `) || 
                 normalizedInterest.endsWith(` ${word}`);
        })) {
          score += 30; // Highest score for matching user interests exactly
          console.log(`   ✓ "${word}" exact match with user interests (+30)`);
        }
        // Check for partial matches with user interests
        else if (userInterests.some(interest => interest.includes(word) || word.includes(interest))) {
          score += 10; // Lower score for partial interest matches
          console.log(`   ✓ "${word}" partial match with user interests (+10)`);
        }
      }
      
      // Bonus score if page type is "product" and we're in a conversion goal
      if (page.type === 'product') {
        score += 2;
        console.log(`   ✓ "${page.title}" is a product page (+2)`);
      }
      
      // Additional bonus for pages that match both title and URL exactly
      if (words.some(word => 
        (pageTitle === word || pageTitle.includes(` ${word} `) || pageTitle.startsWith(`${word} `) || pageTitle.endsWith(` ${word}`)) &&
        (pageUrl === word || pageUrl.includes(`/${word}/`) || pageUrl.endsWith(`/${word}`))
      )) {
        score += 15; // Bonus for matching both title and URL exactly
        console.log(`   ✓ "${page.title}" matches both title and URL exactly (+15)`);
      }
      
      return { page, score };
    });
    
    // Sort pages by score (descending)
    scoredPages.sort((a: {page: BrandPage, score: number}, b: {page: BrandPage, score: number}) => b.score - a.score);
    
    // Log the top 3 matches with detailed scoring
    console.log("📊 Top matches:");
    scoredPages.slice(0, 3).forEach((item: {page: BrandPage, score: number}, index: number) => {
      console.log(`   ${index + 1}. "${item.page.title}" (score: ${item.score})`);
      console.log(`      URL: ${item.page.url}`);
      console.log(`      Type: ${item.page.type}`);
    });
    
    // Store successful match in cache
    if (scoredPages.length > 0 && scoredPages[0].score > 0) {
      console.log("✅ Selected match:", scoredPages[0].page.title);
      console.log(`   Final score: ${scoredPages[0].score}`);
      console.log(`   URL: ${scoredPages[0].page.url}`);
      
      // Store in cache for future uses
      matchCache[cacheKey] = scoredPages[0].page.url;
      
      return scoredPages[0].page;
    }
    
    console.log("❌ No suitable match found");
    return null;
  };

  // First pass: Collect all elements that need personalization
  async function collectElements(element: any) {
    // Process text and button elements with AI settings
    if ((element.type === 'text' || element.type === 'button') && element.attributes?.aiSettings) {
      try {
        const aiSettings = JSON.parse(element.attributes.aiSettings);
        
        // Check if we have all needed data for personalization
        if (aiSettings.openAIKey && userProfile) {
          needsPersonalization = true;
          
          // Add to elements to personalize
          elementsToPersonalize.push({
            elementId: element.id,
            content: element.content,
            elementType: element.type,
            aiSettings
          });
        }
      } catch (error) {
        console.error('Error parsing AI settings:', error);
      }
    }
    
    // Process children recursively if it's a group
    if (element.isGroup && element.children) {
      for (const child of element.children) {
        await collectElements(child);
      }
    }
  }
  
  // Second pass: Apply personalized content to the elements
  function updateElements(element: any, personalizedContent: Record<string, string>, updatedDestinations: Record<string, string>) {
    // Update element if it has personalized content
    if (personalizedContent[element.id]) {
      element.content = personalizedContent[element.id];
      
      // If this is a button and we have a matching destination, update the URL
      if (element.type === 'button' && updatedDestinations[element.id]) {
        // Set the action type to 'open-url' and set the URL
        element.attributes = {
          ...element.attributes,
          actionType: 'open-url',
          url: updatedDestinations[element.id]
        };
      }
    }
    
    // Process children recursively if it's a group
    if (element.isGroup && element.children) {
      for (const child of element.children) {
        updateElements(child, personalizedContent, updatedDestinations);
      }
    }
  }
  
  // Process each section in the screen
  for (const sectionKey in clonedScreen.sections) {
    const section = clonedScreen.sections[sectionKey];
    
    if (!section.enabled) continue;
    
    // Process all elements in the section
    for (const element of section.elements) {
      await collectElements(element);
    }
  }
  
  // Process personalization if needed
  if (needsPersonalization && elementsToPersonalize.length > 0) {
    // Generate personalized content for all elements in a batch
    const personalizedContent = await generatePersonalizedContentBatch(elementsToPersonalize, userProfile);
    
    // Track updated destinations for buttons
    const updatedDestinations: Record<string, string> = {};
    
    // For each button element with destination matching enabled, find a matching brand page
    for (const element of elementsToPersonalize) {
      if (element.elementType === 'button' && personalizedContent[element.elementId]) {
        try {
          // Get the aiSettings by parsing it from attributes if it exists as a string
          let aiSettings = element.aiSettings || {}; 
          
          // Check if the element has attributes property
          const elementWithAttributes = element as any;
          
          // If aiSettings is stored as a string in attributes, parse it
          if (elementWithAttributes.attributes?.aiSettings && 
              typeof elementWithAttributes.attributes.aiSettings === 'string') {
            try {
              aiSettings = JSON.parse(elementWithAttributes.attributes.aiSettings);
              console.log('📋 Parsed AI settings from attributes:', aiSettings);
            } catch (e) {
              console.error('Failed to parse aiSettings from attributes:', e);
            }
          }
          
          // Better debugging: Log the enableDestinationMatching value
          console.log(`Button element ${element.elementId}:`);
          console.log(`- Original text: ${element.content}`);
          console.log(`- Personalized text: ${personalizedContent[element.elementId]}`);
          console.log(`- enableDestinationMatching:`, aiSettings.enableDestinationMatching);
          console.log(`- enableDestinationMatching type: ${typeof aiSettings.enableDestinationMatching}`);
          
          // Fix the comparison: Check both 'true' string and true boolean, as it could be stored either way
          if ((aiSettings.enableDestinationMatching === true || aiSettings.enableDestinationMatching === 'true') && 
              brandPages && brandPages.length > 0) {
            console.log(`✅ Destination matching is enabled for button ${element.elementId}`);
            
            // Collect all text content for the current screen
            let fullPageText = elementsToPersonalize
              .filter(e => e.elementType === 'text')
              .map(e => personalizedContent[e.elementId] || e.content)
              .join(' ');
            
            // Find matching brand page based on full page text
            const matchingPage = findMatchingBrandPage(fullPageText, userProfile);
            
            // If we found a matching page, store it for later application
            if (matchingPage) {
              updatedDestinations[element.elementId] = matchingPage.url;
              console.log(`🔗 Setting destination for button ${element.elementId} to ${matchingPage.url}`);
            } else {
              console.log(`❌ No matching page found for button ${element.elementId}`);
            }
          } else {
            console.log(`⚠️ Destination matching is NOT enabled for button ${element.elementId}`);
          }
        } catch (error) {
          console.error('Error processing destination matching:', error);
        }
      }
    }
    
    // Update elements with personalized content and destinations
    for (const sectionKey in clonedScreen.sections) {
      const section = clonedScreen.sections[sectionKey];
      
      if (!section.enabled) continue;
      
      for (const element of section.elements) {
        updateElements(element, personalizedContent, updatedDestinations);
      }
    }
  }
  
  // Generate HTML and CSS for the screen
  return {
    html: generateScreenHtml(clonedScreen),
    css: generateScreenCss(clonedScreen)
  };
}

interface PreviewPageProps {
  params: {
    quizId: string;
  };
  searchParams: {
    profile?: string;
  };
}

export default function PreviewPage({ params, searchParams }: PreviewPageProps) {
  const { quizId } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  
  // Add state for selected user profile
  const [selectedProfile, setSelectedProfile] = useState<string>('default');
  const [isPersonalizing, setIsPersonalizing] = useState<boolean>(false);
  
  // Add state for profile panel expansion
  const [isProfileExpanded, setIsProfileExpanded] = useState<boolean>(false);
  
  // Get functions from store
  const loadQuiz = useQuizStore((state) => state.loadQuiz);
  const quiz = useQuizStore((state) => state.quiz);
  
  // Analytics store functions
  const startSession = useAnalyticsStore((state) => state.startSession);
  const recordScreenView = useAnalyticsStore((state) => state.recordScreenView);
  const endSession = useAnalyticsStore((state) => state.endSession);

  // Get current user profile data with proper typing
  const currentUserProfile = useMemo(() => {
    if (selectedProfile === 'default') {
      return null;
    }
    return USER_PROFILES[selectedProfile as keyof typeof USER_PROFILES];
  }, [selectedProfile]);

  // Function to handle profile changes and update content
  const handleProfileChange = async (profileId: string) => {
    setSelectedProfile(profileId);
    
    // Only personalize if not on default profile
    if (profileId !== 'default') {
      setIsPersonalizing(true);
      const userProfile = USER_PROFILES[profileId as keyof typeof USER_PROFILES].data;
      
      try {
        const { html, css } = await personalizeQuizContent(
          quiz,
          currentScreenIndex,
          userProfile,
          profileId
        );
        
        setHtml(html);
        setCss(css);
      } catch (error) {
        console.error('Error personalizing content:', error);
      } finally {
        setIsPersonalizing(false);
      }
    } else {
      // If default, use standard content
      const screen = quiz.screens[currentScreenIndex];
      const generatedHtml = generateScreenHtml(screen);
      const generatedCss = generateScreenCss(screen);
      
      setHtml(generatedHtml);
      setCss(generatedCss);
    }
  };
  
  // Initialize quiz
  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        console.log(`Loading quiz with ID: ${quizId} for preview`);
        
        // Use the store's loadQuiz function
        const success = await loadQuiz(quizId);
        
        if (!success) {
          console.error(`Failed to load quiz with ID: ${quizId}`);
          setError("Quiz not found");
          return;
        }
        
        // Get the updated quiz from store after loading
        const updatedQuiz = useQuizStore.getState().quiz;
        
        // Start analytics session with user agent
        if (typeof window !== 'undefined') {
          // Create a session with the quizId and user agent
          const session = startSession(updatedQuiz.id, navigator.userAgent);
          setSessionId(session.id);
          setStartTime(Date.now());
        }
        
        // Always start on the first screen (index 0)
        setCurrentScreenIndex(0);
        
        // Generate HTML and CSS for the first screen
        const firstScreen = updatedQuiz.screens[0];
        if (firstScreen) {
          const generatedHtml = generateScreenHtml(firstScreen);
          const generatedCss = generateScreenCss(firstScreen);
          
          setHtml(generatedHtml);
          setCss(generatedCss);
          
          // We'll record the first screen view after a short delay to get accurate timing
          setTimeout(() => {
            if (sessionId) {
              // Record with a small initial duration since this is the first screen
              recordScreenView(sessionId, firstScreen.id, 1);
            }
          }, 1000);
        } else {
          console.error('No screens found in the quiz');
          setError("Failed to load quiz content");
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading quiz for preview:', error);
        setError("Failed to load quiz");
      }
    };
    
    initializeQuiz();
    
    // Clean up when component unmounts
    return () => {
      if (sessionId) {
        // End the session when leaving the page
        // Completed is true only if we reached the last screen
        const isCompleted = currentScreenIndex === quiz?.screens?.length - 1;
        endSession(sessionId, isCompleted);
      }
    };
  }, [quizId, loadQuiz, startSession]);
  
  // Function to render the current screen
  const renderCurrentScreen = async () => {
    if (!quiz || !quiz.screens || quiz.screens.length === 0) {
      console.error('No screens available in the quiz');
      setError("No content to display");
      return;
    }
    
    if (currentScreenIndex < 0 || currentScreenIndex >= quiz.screens.length) {
      console.error(`Invalid screen index: ${currentScreenIndex}`);
      setError("Invalid screen");
      return;
    }
    
    // Calculate time spent on the previous screen
    const now = Date.now();
    const timeSpent = (now - startTime) / 1000; // Convert to seconds
    setStartTime(now); // Reset for next screen
    
    // Record screen view for analytics
    if (sessionId && timeSpent > 0) {
      const screen = quiz.screens[currentScreenIndex];
      recordScreenView(sessionId, screen.id, timeSpent);
    }
    
    // Handle personalized content if needed
    if (selectedProfile !== 'default') {
      setIsPersonalizing(true);
      
      try {
        const userProfile = USER_PROFILES[selectedProfile as keyof typeof USER_PROFILES].data;
        
        const { html, css } = await personalizeQuizContent(
          quiz,
          currentScreenIndex,
          userProfile,
          selectedProfile
        );
        
        setHtml(html);
        setCss(css);
      } catch (error) {
        console.error('Error personalizing content:', error);
        
        // Fallback to standard content
        const screen = quiz.screens[currentScreenIndex];
        const generatedHtml = generateScreenHtml(screen);
        const generatedCss = generateScreenCss(screen);
        
        setHtml(generatedHtml);
        setCss(generatedCss);
      } finally {
        setIsPersonalizing(false);
      }
    } else {
      // Standard non-personalized content
      const screen = quiz.screens[currentScreenIndex];
      const generatedHtml = generateScreenHtml(screen);
      const generatedCss = generateScreenCss(screen);
      
      setHtml(generatedHtml);
      setCss(generatedCss);
    }
  };
  
  // When current screen index changes, update the preview
  useEffect(() => {
    if (!isLoading && !error) {
      renderCurrentScreen();
    }
  }, [currentScreenIndex, isLoading, error]);
  
  // Handle messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'buttonClick') {
        // Check if there's a specific action defined
        const actionType = event.data.actionType || 'next-screen';
        const targetScreenId = event.data.targetScreenId;
        const url = event.data.url;
        
        switch (actionType) {
          case 'none':
            // Do nothing
            break;
            
          case 'next-screen':
            // Navigate to the next screen
            const nextScreenIndex = currentScreenIndex + 1;
            if (nextScreenIndex < quiz.screens.length) {
              setCurrentScreenIndex(nextScreenIndex);
            } else {
              // Don't loop back - stay on the last screen
              console.log('Reached the last screen');
              
              // If we're on the last screen and this is a button click, mark the quiz as completed
              if (sessionId && currentScreenIndex === quiz.screens.length - 1) {
                endSession(sessionId, true);
                // Generate a new session ID to prevent double-counting
                setSessionId(null);
              }
            }
            break;
            
          case 'specific-screen':
            // Navigate to a specific screen by ID
            if (targetScreenId) {
              const screenIndex = quiz.screens.findIndex(screen => screen.id === targetScreenId);
              if (screenIndex !== -1) {
                setCurrentScreenIndex(screenIndex);
              }
            }
            break;
            
          case 'open-url':
          case 'brand-page': // Handle brand pages like open-url
            // Open a URL based on target window setting
            if (url) {
              const targetWindow = event.data.targetWindow || '_blank';
              if (targetWindow === '_self') {
                window.location.href = url;
              } else {
                window.open(url, '_blank');
              }
            }
            break;
            
          default:
            // Default to next screen behavior
            const defaultNextIndex = currentScreenIndex + 1;
            if (defaultNextIndex < quiz.screens.length) {
              setCurrentScreenIndex(defaultNextIndex);
            }
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [currentScreenIndex, quiz, sessionId, endSession]);
  
  // Handle beforeunload event to record session end
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionId) {
        // End the session when leaving the page
        // Completed is true only if we reached the last screen
        const isCompleted = currentScreenIndex === quiz?.screens?.length - 1;
        endSession(sessionId, isCompleted);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionId, currentScreenIndex, quiz, endSession]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-xl">Loading preview...</div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-xl text-destructive mb-4">{error}</div>
        <a 
          href="/dashboard"
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          Back to Dashboard
        </a>
      </div>
    );
  }
  
  // Create the full HTML document for the preview
  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quiz Preview</title>
      <!-- Import common web fonts with security attributes -->
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&family=Lato:wght@300;400;700&family=Montserrat:wght@300;400;500;600;700&family=Source+Sans+Pro:wght@300;400;600;700&family=Raleway:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" referrerpolicy="no-referrer">
      <!-- Backup local font declarations in case Google Fonts fails -->
      <style>
        /* Base styles */
        html, body {
          margin: 0;
          padding: 0;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          width: 100%;
          height: 100%;
          overflow: hidden;
          box-sizing: border-box;
        }
        
        /* Ensure all elements use border-box */
        *, *::before, *::after {
          box-sizing: border-box;
        }
        
        /* Fallback font definitions */
        @font-face {
          font-family: 'Roboto';
          font-style: normal;
          font-weight: 400;
          src: local('Roboto'), local('Helvetica Neue'), local('Arial'), local('sans-serif');
        }
        
        @font-face {
          font-family: 'Open Sans';
          font-style: normal;
          font-weight: 400;
          src: local('Open Sans'), local('Helvetica Neue'), local('Arial'), local('sans-serif');
        }
        
        @font-face {
          font-family: 'Lato';
          font-style: normal;
          font-weight: 400;
          src: local('Lato'), local('Helvetica Neue'), local('Arial'), local('sans-serif');
        }
        
        @font-face {
          font-family: 'Montserrat';
          font-style: normal;
          font-weight: 400;
          src: local('Montserrat'), local('Helvetica Neue'), local('Arial'), local('sans-serif');
        }
        
        @font-face {
          font-family: 'Source Sans Pro';
          font-style: normal;
          font-weight: 400;
          src: local('Source Sans Pro'), local('Helvetica Neue'), local('Arial'), local('sans-serif');
        }
        
        @font-face {
          font-family: 'Raleway';
          font-style: normal;
          font-weight: 400;
          src: local('Raleway'), local('Helvetica Neue'), local('Arial'), local('sans-serif');
        }
        
        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 400;
          src: local('Poppins'), local('Helvetica Neue'), local('Arial'), local('sans-serif');
        }
        
        /* Base styles for quiz */
        .quiz-screen {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          overflow: hidden;
        }
        
        /* Base styles for sections */
        .quiz-section {
          position: relative;
          box-sizing: border-box;
          display: flex;
        }
        
        /* Global text alignment for all elements */
        p, h1, h2, h3, h4, h5, h6, button, a, label, span, div, input, select, textarea {
          margin: 0;
        }
        
        /* Default section styling */
        .quiz-section-header {
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .quiz-section-body {
          flex: 1;
          overflow: auto;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        
        .quiz-section-footer {
          background-color: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
        
        /* Default element styles */
        button {
          padding: 8px 16px;
          border-radius: 4px;
          background-color: #000000;
          color: white;
          border: none;
          font-size: 16px;
          cursor: pointer;
          display: inline-block;
          line-height: normal;
          box-sizing: border-box;
          font-family: inherit;
          text-align: center;
          max-width: 100%;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        
        p {
          margin: 0;
          font-size: 16px;
          line-height: 1.5;
          color: #000000;
          font-family: inherit;
          max-width: 100%;
        }
        
        img {
          max-width: 100%;
          height: auto;
          display: block;
        }
        
        a {
          color: #355DF9;
          text-decoration: underline;
          font-size: 16px;
          cursor: pointer;
          display: inline-block;
          font-family: inherit;
          text-align: center;
          max-width: 100%;
        }
        
        .element-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 8px;
          box-sizing: border-box;
          width: 100%;
          font-family: inherit;
          max-width: 100%;
        }
        
        /* Apply layout attributes */
        [data-direction="row"] { flex-direction: row; }
        [data-direction="column"] { flex-direction: column; }
        [data-direction="row-reverse"] { flex-direction: row-reverse; }
        [data-direction="column-reverse"] { flex-direction: column-reverse; }
        
        [data-wrap="nowrap"] { flex-wrap: nowrap; }
        [data-wrap="wrap"] { flex-wrap: wrap; }
        [data-wrap="wrap-reverse"] { flex-wrap: wrap-reverse; }
        
        [data-justify="flex-start"] { justify-content: flex-start; }
        [data-justify="flex-end"] { justify-content: flex-end; }
        [data-justify="center"] { justify-content: center; }
        [data-justify="space-between"] { justify-content: space-between; }
        [data-justify="space-around"] { justify-content: space-around; }
        [data-justify="space-evenly"] { justify-content: space-evenly; }
        
        [data-align-items="flex-start"] { align-items: flex-start; }
        [data-align-items="flex-end"] { align-items: flex-end; }
        [data-align-items="center"] { align-items: center; }
        [data-align-items="stretch"] { align-items: stretch; }
        [data-align-items="baseline"] { align-items: baseline; }
        
        [data-align-content="flex-start"] { align-content: flex-start; }
        [data-align-content="flex-end"] { align-content: flex-end; }
        [data-align-content="center"] { align-content: center; }
        [data-align-content="stretch"] { align-content: stretch; }
        [data-align-content="space-between"] { align-content: space-between; }
        [data-align-content="space-around"] { align-content: space-around; }
        
        /* Typography overrides to ensure styles are applied */
        body * {
          line-height: 1.5;
        }
        
        /* !important rules for typography - ensure they always apply */
        [style*="font-family"] { font-family: attr(style font-family) !important; }
        [style*="font-size"] { font-size: attr(style font-size) !important; }
        [style*="font-weight"] { font-weight: attr(style font-weight) !important; }
        [style*="color"] { color: attr(style color) !important; }
        [style*="text-align"] { text-align: attr(style text-align) !important; }
        
        /* Custom CSS */
        ${css}
      </style>
      <script>
        // Add click event listeners to all buttons and interactive text elements
        document.addEventListener('DOMContentLoaded', function() {
          // Handle button clicks
          const buttons = document.querySelectorAll('button');
          buttons.forEach(button => {
            button.addEventListener('click', function() {
              // Get action type and target from data attributes
              const actionType = this.getAttribute('data-action-type') || 'next-screen';
              const targetScreenId = this.getAttribute('data-target-screen-id');
              const url = this.getAttribute('data-url');
              const targetWindow = this.getAttribute('data-target-window') || '_blank';
              
              // Send message to parent window
              window.parent.postMessage({
                type: 'buttonClick',
                actionType,
                targetScreenId,
                url,
                targetWindow
              }, '*');
            });
          });
          
          // Handle text (paragraph) clicks
          const paragraphs = document.querySelectorAll('p');
          paragraphs.forEach(paragraph => {
            // Check if paragraph has action type attribute
            const actionType = paragraph.getAttribute('data-action-type');
            
            if (actionType && actionType !== 'none') {
              paragraph.style.cursor = 'pointer';
              paragraph.addEventListener('click', function() {
                const targetScreenId = this.getAttribute('data-target-screen-id');
                const url = this.getAttribute('data-url');
                const targetWindow = this.getAttribute('data-target-window') || '_blank';
                
                // Send message to parent window
                window.parent.postMessage({
                  type: 'buttonClick',
                  actionType,
                  targetScreenId,
                  url,
                  targetWindow
                }, '*');
              });
            }
          });
          
          // Handle link clicks
          const links = document.querySelectorAll('a[data-link-element="true"]');
          links.forEach(link => {
            link.addEventListener('click', function(e) {
              e.preventDefault(); // Prevent default navigation
              
              // Get action type and target from data attributes
              const actionType = this.getAttribute('data-action-type') || 'open-url';
              const targetScreenId = this.getAttribute('data-target-screen-id');
              const url = this.getAttribute('data-url') || this.getAttribute('href');
              const targetWindow = this.getAttribute('data-target-window') || this.getAttribute('target') || '_blank';
              
              // Send message to parent window
              window.parent.postMessage({
                type: 'buttonClick',
                actionType,
                targetScreenId,
                url,
                targetWindow
              }, '*');
            });
          });
          
          // Handle image clicks
          const images = document.querySelectorAll('img');
          images.forEach(image => {
            // Check if image has action type attribute
            const actionType = image.getAttribute('data-action-type');
            
            if (actionType && actionType !== 'none') {
              image.style.cursor = 'pointer';
              image.addEventListener('click', function() {
                const targetScreenId = this.getAttribute('data-target-screen-id');
                const url = this.getAttribute('data-url');
                const targetWindow = this.getAttribute('data-target-window') || '_blank';
                
                // Send message to parent window
                window.parent.postMessage({
                  type: 'buttonClick',
                  actionType, 
                  targetScreenId,
                  url,
                  targetWindow
                }, '*');
              });
            }
          });
        });
      </script>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;
  
  // Enhanced preview controls with user profile selection
  const previewControls = (
    <div className="fixed bottom-4 right-4 flex flex-col items-end space-y-2">
      <div className="flex flex-col bg-primary/90 text-primary-foreground rounded overflow-hidden">
        {/* Profile Selection Header */}
        <div 
          className="flex items-center justify-between gap-2 p-2 cursor-pointer" 
          onClick={() => setIsProfileExpanded(prev => !prev)}
        >
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="text-sm">User Profile:</span>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedProfile}
              onValueChange={handleProfileChange}
              onOpenChange={(open) => {
                // Prevent click propagation to parent
                if (open) {
                  event?.stopPropagation();
                }
              }}
            >
              <SelectTrigger className="w-32 h-8 text-xs bg-background/10 border-none" onClick={(e) => e.stopPropagation()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="connor">Connor</SelectItem>
                <SelectItem value="sarah">Sarah</SelectItem>
                <SelectItem value="michael">Michael</SelectItem>
                <SelectItem value="emma">Emma</SelectItem>
                <SelectItem value="david">David</SelectItem>
                <SelectItem value="sophia">Sophia</SelectItem>
                <SelectItem value="james">James</SelectItem>
              </SelectContent>
            </Select>
            {isProfileExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
        
        {/* Profile Details Panel */}
        {isProfileExpanded && currentUserProfile && (
          <div className="p-3 border-t border-white/20 bg-primary/95 text-sm max-w-xs">
            <div className="font-semibold mb-1">User Profile: {currentUserProfile.name}</div>
            
            {currentUserProfile.data.name && (
              <div className="mb-1">
                <span className="font-medium">Name:</span> {currentUserProfile.data.name}
              </div>
            )}
            
            {currentUserProfile.data.location && (
              <div className="mb-1">
                <span className="font-medium">Location:</span> {currentUserProfile.data.location}
              </div>
            )}
            
            {currentUserProfile.data.hobbies && currentUserProfile.data.hobbies.length > 0 && (
              <div className="mb-1">
                <span className="font-medium">Hobbies:</span> {currentUserProfile.data.hobbies.join(', ')}
              </div>
            )}
            
            {currentUserProfile.data.ownedProducts && currentUserProfile.data.ownedProducts.length > 0 && (
              <div className="mb-1">
                <span className="font-medium">Owned Products:</span> {currentUserProfile.data.ownedProducts.join(', ')}
              </div>
            )}
            
            {currentUserProfile.data.id && (
              <div className="mb-1">
                <span className="font-medium">ID:</span> {currentUserProfile.data.id}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="px-3 py-2 bg-primary/90 text-primary-foreground rounded font-mono text-sm">
        Screen {currentScreenIndex + 1} / {quiz?.screens?.length || 0}
      </div>
    </div>
  );
  
  return (
    <>
      {isPersonalizing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <div className="text-sm">Personalizing content...</div>
          </div>
        </div>
      )}
      
      <iframe 
        srcDoc={fullHtml}
        className="w-full h-screen border-0"
        title="Quiz Preview"
        sandbox="allow-scripts allow-same-origin allow-popups allow-top-navigation allow-forms"
        referrerPolicy="no-referrer"
      />
      
      {!isLoading && !error && previewControls}
    </>
  );
} 