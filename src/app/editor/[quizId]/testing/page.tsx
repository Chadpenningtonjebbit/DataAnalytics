"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizStore } from '@/store/useQuizStore';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Thermometer, Beaker, BarChart3, Braces, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { Header } from '@/components/layout/Header';
import { PageAIPersonalizationPanel } from '@/components/quiz-builder/PageAIPersonalizationPanel';
import { FormSelect } from '@/components/ui/form-select';

// All user profiles from the preview page
const USER_PROFILES = {
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
  }
};

interface TestingPageProps {
  params: {
    quizId: string;
  };
}

export default function TestingPage({ params }: TestingPageProps) {
  const { quizId } = params;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [temperature, setTemperature] = useState([0.5]); // Actual temperature used for previews
  const [tempValue, setTempValue] = useState([0.5]); // Temporary value while dragging
  const [isDragging, setIsDragging] = useState(false); // Track whether user is actively dragging
  
  // Add state for personalization level similar to temperature
  const [personalizationLevel, setPersonalizationLevel] = useState([0.7]); // Actual personalization level used for previews
  const [persLevelValue, setPersLevelValue] = useState([0.7]); // Temporary value while dragging
  const [isPersonalizationDragging, setIsPersonalizationDragging] = useState(false); // Track whether user is actively dragging
  
  // State for the user profile (single profile for both previews)
  const [selectedProfile, setSelectedProfile] = useState('default');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Tab state - change default to strategy (formerly AI personalization)
  const [activeTab, setActiveTab] = useState('strategy');
  
  // Get functions from store
  const loadQuiz = useQuizStore((state) => state.loadQuiz);
  
  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        console.log(`Attempting to load quiz with ID: ${quizId}`);
        
        // Use the store's loadQuiz function
        const success = await loadQuiz(quizId);
        
        if (!success) {
          console.error(`Failed to load quiz with ID: ${quizId}`);
          // Instead of showing an error, redirect to dashboard
          router.replace('/dashboard');
          return;
        }
        
        console.log(`Successfully loaded quiz: ${quizId}`);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading quiz:', error);
        // For any error, also redirect to dashboard
        router.replace('/dashboard');
      }
    };
    
    initializeQuiz();
  }, [quizId, loadQuiz, router]);
  
  // Handle temperature commit
  const handleTemperatureCommit = (value: number[]) => {
    setTemperature(value);
    setIsDragging(false);
    // Increment refresh trigger to reload iframes
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle start of slider drag
  const handleSliderDragStart = () => {
    setIsDragging(true);
  };

  // Handle personalization level commit
  const handlePersonalizationLevelCommit = (value: number[]) => {
    setPersonalizationLevel(value);
    setIsPersonalizationDragging(false);
    // Increment refresh trigger to reload iframes
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle start of personalization slider drag
  const handlePersonalizationDragStart = () => {
    setIsPersonalizationDragging(true);
  };

  // Get label for personalization level
  const getPersonalizationLevelLabel = (value: number) => {
    if (value <= 0.05) return 'None';
    if (value <= 0.33) return 'Subtle';
    if (value <= 0.66) return 'Moderate';
    return 'Strong';
  };

  // Construct preview URLs with both temperature and personalization level parameters
  const previewUrl1 = `/preview/${quizId}?profile=${selectedProfile}&temperature=${temperature[0]}&personalizationLevelValue=${personalizationLevel[0]}&hideOverlay=true`;
  const previewUrl2 = `/preview/${quizId}?profile=${selectedProfile}&temperature=${temperature[0]}&personalizationLevelValue=${personalizationLevel[0]}&hideOverlay=true`;
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-xl">Loading quiz...</div>
      </div>
    );
  }
  
  // Show the testing interface with simplified layout 
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-12 bg-muted">
        <div className="max-w-6xl mx-auto">
          <PageHeader
            title="Personalization"
            description="Personalize your quiz with AI and test with different user profiles"
          />
          
          <div className="mt-6 grid grid-cols-12 gap-6">
            {/* Left sidebar with tabs */}
            <div className="col-span-3">
              <Tabs 
                defaultValue="strategy" 
                orientation="vertical" 
                className="w-full"
                onValueChange={setActiveTab}
              >
                <TabsList className="flex flex-col h-auto items-stretch space-y-2 bg-muted text-muted-foreground w-full rounded-lg p-0">
                  <TabsTrigger value="strategy" className="justify-start w-full px-4 py-2 text-sm mb-0">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Strategy
                  </TabsTrigger>
                  <TabsTrigger value="control" className="justify-start w-full px-4 py-2 text-sm mb-0">
                    <Beaker className="h-5 w-5 mr-2" />
                    Control
                  </TabsTrigger>
                  {/* Future tabs for expansion */}
                  {/*
                  <TabsTrigger value="analytics" className="justify-start w-full px-4 py-2 text-sm mb-0">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="justify-start w-full px-4 py-2 text-sm mb-0">
                    <Braces className="h-5 w-5 mr-2" />
                    Advanced
                  </TabsTrigger>
                  */}
                </TabsList>
              </Tabs>
            </div>
            
            {/* Right content area */}
            <div className="col-span-9">
              {activeTab === 'control' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="mb-1">Control</CardTitle>
                        <CardDescription>Compare personalized content across different user profiles</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* All controls with consistent gap spacing */}
                    <div className="flex flex-col gap-6">
                      {/* Temperature control */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium h-[14px]">Temperature</h3>
                          {isDragging && (
                            <span className="text-xs text-muted-foreground animate-pulse">
                              Release to apply...
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Low Variance</span>
                            <span className={`text-sm font-medium ${isDragging ? "text-primary" : ""}`}>
                              {tempValue[0].toFixed(1)}
                              {isDragging && temperature[0] !== tempValue[0] && 
                                ` (current: ${temperature[0].toFixed(1)})`}
                            </span>
                            <span className="text-sm text-muted-foreground">High Variance</span>
                          </div>
                          <Slider
                            value={tempValue}
                            onValueChange={setTempValue}
                            onValueCommit={handleTemperatureCommit}
                            min={0}
                            max={1}
                            step={0.1}
                            className="cursor-pointer"
                            onMouseDown={handleSliderDragStart}
                            onTouchStart={handleSliderDragStart}
                          />
                        </div>
                      </div>
                      
                      {/* Personalization Level control */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium h-[14px]">Personalization Level</h3>
                          {isPersonalizationDragging && (
                            <span className="text-xs text-muted-foreground animate-pulse">
                              Release to apply...
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">None</span>
                            <span className={`text-sm font-medium ${isPersonalizationDragging ? "text-primary" : ""}`}>
                              {getPersonalizationLevelLabel(persLevelValue[0])}
                              {isPersonalizationDragging && personalizationLevel[0] !== persLevelValue[0] && 
                                ` (current: ${getPersonalizationLevelLabel(personalizationLevel[0])})`}
                            </span>
                            <span className="text-sm text-muted-foreground">Strong</span>
                          </div>
                          <Slider
                            value={persLevelValue}
                            onValueChange={setPersLevelValue}
                            onValueCommit={handlePersonalizationLevelCommit}
                            min={0}
                            max={1}
                            step={0.1}
                            className="cursor-pointer"
                            onMouseDown={handlePersonalizationDragStart}
                            onTouchStart={handlePersonalizationDragStart}
                          />
                        </div>
                      </div>
                      
                      {/* User profile selector */}
                      <FormSelect
                        label="User profile"
                        id="userProfile"
                        value={selectedProfile}
                        onChange={setSelectedProfile}
                        options={Object.entries(USER_PROFILES).map(([id, profile]) => ({
                          value: id,
                          label: profile.name
                        }))}
                      />
                      
                      {/* Preview frames section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Preview 1 */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium h-[14px]">Preview 1</span>
                          </div>
                          
                          <div className="w-full aspect-[9/16] bg-background border border-border rounded-md overflow-hidden shadow-md">
                            <iframe 
                              key={`frame1-${refreshTrigger}`}
                              src={previewUrl1} 
                              className="w-full h-full" 
                              title="Preview 1"
                            />
                          </div>
                        </div>
                        
                        {/* Preview 2 */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium h-[14px]">Preview 2</span>
                          </div>
                          
                          <div className="w-full aspect-[9/16] bg-background border border-border rounded-md overflow-hidden shadow-md">
                            <iframe 
                              key={`frame2-${refreshTrigger}`}
                              src={previewUrl2} 
                              className="w-full h-full" 
                              title="Preview 2"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {activeTab === 'strategy' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="mb-1">Strategy</CardTitle>
                        <CardDescription>Configure AI personalization for all quiz content</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PageAIPersonalizationPanel isExperienceWide={true} />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 