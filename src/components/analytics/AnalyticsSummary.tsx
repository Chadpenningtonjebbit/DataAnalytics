"use client"

import * as React from "react"
import { useAnalyticsStore } from "@/store/useAnalyticsStore"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function AnalyticsSummary() {
  // Create state for summary data
  const [summaryData, setSummaryData] = React.useState({
    totalSessions: 0,
    totalCompletions: 0,
    completionRate: 0,
    totalScreenViews: 0,
    avgScreensPerSession: 0
  })
  
  // Add force refresh trigger
  const [refresh, setRefresh] = React.useState(0)

  // Force a refresh every 5 seconds when the component is visible
  React.useEffect(() => {
    const timer = setInterval(() => {
      setRefresh(prev => prev + 1);
    }, 5000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Use useEffect to prevent hydration mismatch and update with the current data
  React.useEffect(() => {
    // Get analytics data from store
    const getAllQuizAnalytics = useAnalyticsStore.getState().getAllQuizAnalytics
    const analyticsData = getAllQuizAnalytics()
    
    console.log('Analytics data loaded:', analyticsData);
    
    // Calculate summary metrics
    let sessions = 0
    let completions = 0
    let screenViews = 0
    
    analyticsData.forEach(quiz => {
      sessions += quiz.totalSessions
      completions += quiz.completions
      
      // Calculate screen views by summing up views from each screen
      quiz.screenAnalytics.forEach(screen => {
        screenViews += screen.views
      })
    })
    
    const completionRate = sessions > 0 ? Math.round((completions / sessions) * 100) : 0
    const avgScreensPerSession = sessions > 0 ? Math.round((screenViews / sessions) * 10) / 10 : 0
    
    setSummaryData({
      totalSessions: sessions,
      totalCompletions: completions,
      completionRate,
      totalScreenViews: screenViews,
      avgScreensPerSession
    })
  }, [refresh]) // Dependency on refresh means this will update periodically
  
  const { totalSessions, totalCompletions, completionRate, totalScreenViews, avgScreensPerSession } = summaryData

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSessions.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Quiz starts across all content
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate}%</div>
          <p className="text-xs text-muted-foreground">
            {totalCompletions.toLocaleString()} completed sessions
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Screen Views</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <path d="M2 10h20" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalScreenViews.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Total individual screen views
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Screens Per Session</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgScreensPerSession}</div>
          <p className="text-xs text-muted-foreground">
            Average engagement depth
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 