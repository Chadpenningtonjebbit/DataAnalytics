"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Device metadata
export interface DeviceMetadata {
  deviceType: string; // desktop, mobile, tablet
  browser: string;
  os: string;
  screenWidth?: number;
  screenHeight?: number;
  location?: string; // IP-based general location
}

// Track interactions on a screen
export interface ScreenInteraction {
  id: string;
  timestamp: number;
  duration: number; // in seconds
}

export interface QuizSession {
  id: string;
  quizId: string;
  startTime: number;
  endTime?: number;
  completed: boolean;
  screenInteractions: ScreenInteraction[];
  userAgent: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'other';
  browserName: string;
}

export interface ScreenAnalytics {
  id: string;
  title: string;
  views: number;
  avgTimeSpent: number; // in seconds
  dropoffs: number;
}

export interface QuizAnalytics {
  id: string;
  title: string;
  totalSessions: number;
  completions: number;
  screenAnalytics: ScreenAnalytics[];
  browserBreakdown: Record<string, number>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
    other: number;
  };
}

interface AnalyticsState {
  sessions: QuizSession[];
  
  // Actions
  startSession: (quizId: string, userAgent: string) => QuizSession;
  recordScreenView: (sessionId: string, screenId: string, duration: number) => void;
  endSession: (sessionId: string, completed: boolean) => void;
  
  // Getters
  getQuizAnalytics: (quizId: string) => QuizAnalytics;
  getAllQuizAnalytics: () => QuizAnalytics[];
  getScreenAnalytics: (quizId: string, screenId: string) => ScreenAnalytics | null;
  
  // Admin
  clearAnalytics: () => void;
}

// Helper type to extract just the state portion without the methods
export type AnalyticsStateData = Pick<AnalyticsState, 'sessions'>;

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      sessions: [],
      
      startSession: (quizId, userAgent) => {
        const newSession: QuizSession = {
          id: `session_${Date.now()}`,
          quizId,
          startTime: Date.now(),
          completed: false,
          screenInteractions: [],
          userAgent,
          deviceType: detectDeviceType(userAgent),
          browserName: detectBrowser(userAgent),
        };
        
        set((state) => ({
          sessions: [...state.sessions, newSession]
        }));
        
        return newSession;
      },
      
      recordScreenView: (sessionId, screenId, duration) => {
        set((state) => ({
          sessions: state.sessions.map(session => {
            if (session.id === sessionId) {
              return {
                ...session,
                screenInteractions: [
                  ...session.screenInteractions,
                  {
                    id: screenId,
                    timestamp: Date.now(),
                    duration
                  }
                ]
              };
            }
            return session;
          })
        }));
      },
      
      endSession: (sessionId, completed) => {
        set((state) => ({
          sessions: state.sessions.map(session => {
            if (session.id === sessionId) {
              return {
                ...session,
                endTime: Date.now(),
                completed
              };
            }
            return session;
          })
        }));
      },
      
      getQuizAnalytics: (quizId) => {
        const { sessions } = get();
        const quizSessions = sessions.filter(s => s.quizId === quizId);
        
        // Basic analytics calculation
        const totalSessions = quizSessions.length;
        const completions = quizSessions.filter(s => s.completed).length;
        
        // Screen analytics
        const screenMap = new Map<string, ScreenAnalytics>();
        
        quizSessions.forEach(session => {
          session.screenInteractions.forEach((interaction, index) => {
            const isExistingScreen = screenMap.has(interaction.id);
            const screenData = isExistingScreen 
              ? screenMap.get(interaction.id)! 
              : {
                  id: interaction.id,
                  title: `Screen ${interaction.id}`,
                  views: 0,
                  avgTimeSpent: 0,
                  dropoffs: 0
                };
            
            // Update screen data
            const newViews = screenData.views + 1;
            const newAvgTime = ((screenData.avgTimeSpent * screenData.views) + interaction.duration) / newViews;
            
            // Detect if this was the last screen viewed in an incomplete session
            const isDropoff = !session.completed && 
              index === session.screenInteractions.length - 1;
            
            screenMap.set(interaction.id, {
              ...screenData,
              views: newViews,
              avgTimeSpent: newAvgTime,
              dropoffs: isDropoff ? screenData.dropoffs + 1 : screenData.dropoffs
            });
          });
        });
        
        // Browser breakdown
        const browsers: Record<string, number> = {};
        quizSessions.forEach(session => {
          const browser = session.browserName;
          browsers[browser] = (browsers[browser] || 0) + 1;
        });
        
        // Device breakdown
        const devices = {
          desktop: quizSessions.filter(s => s.deviceType === 'desktop').length,
          mobile: quizSessions.filter(s => s.deviceType === 'mobile').length,
          tablet: quizSessions.filter(s => s.deviceType === 'tablet').length,
          other: quizSessions.filter(s => s.deviceType === 'other').length,
        };
        
        return {
          id: quizId,
          title: `Quiz ${quizId}`,
          totalSessions,
          completions,
          screenAnalytics: Array.from(screenMap.values()),
          browserBreakdown: browsers,
          deviceBreakdown: devices
        };
      },
      
      getAllQuizAnalytics: () => {
        const { sessions } = get();
        const quizIds = new Set(sessions.map(s => s.quizId));
        
        return Array.from(quizIds).map(id => get().getQuizAnalytics(id));
      },
      
      getScreenAnalytics: (quizId, screenId) => {
        const analytics = get().getQuizAnalytics(quizId);
        return analytics.screenAnalytics.find(s => s.id === screenId) || null;
      },
      
      clearAnalytics: () => {
        set({ sessions: [] });
      }
    }),
    {
      name: 'analytics-storage',
    }
  )
);

// Helper function to detect device type from user agent
function detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' | 'other' {
  const ua = userAgent.toLowerCase();
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  
  if (/windows|macintosh|linux/i.test(ua)) {
    return 'desktop';
  }
  
  return 'other';
}

// Helper function to detect browser from user agent
function detectBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('chrome')) {
    return 'chrome';
  } else if (ua.includes('firefox')) {
    return 'firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    return 'safari';
  } else if (ua.includes('edge')) {
    return 'edge';
  } else {
    return 'other';
  }
} 