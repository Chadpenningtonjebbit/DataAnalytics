"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"
import { useAnalyticsStore } from "@/store/useAnalyticsStore"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Chart configuration with direct hexcodes
const config = {
  completed: {
    label: "Completed",
    color: "#f6339a", // Primary pink
  },
  incomplete: {
    label: "Incomplete",
    color: "#ffa6d1", // Lighter pink
  },
} satisfies ChartConfig

export function SessionsChart() {
  // Define state for analytics data with proper types
  const [sessionsData, setSessionsData] = React.useState<{
    totalSessions: number;
    totalCompletions: number;
    chartData: Array<{type: string; sessions: number; fill: string}>;
  }>({
    totalSessions: 0,
    totalCompletions: 0,
    chartData: []
  })
  
  // Use useEffect to fetch data client-side only
  React.useEffect(() => {
    // Get analytics data from store
    const getAllQuizAnalytics = useAnalyticsStore.getState().getAllQuizAnalytics
    const analyticsData = getAllQuizAnalytics()
    
    // Calculate total sessions and completions
    let sessions = 0
    let completions = 0
    
    analyticsData.forEach(quiz => {
      sessions += quiz.totalSessions
      completions += quiz.completions
    })
    
    // Prepare data for pie chart
    const chartData = [
      { type: "completed", sessions: completions, fill: "#f6339a" }, // Primary pink
      { type: "incomplete", sessions: sessions - completions, fill: "#ffa6d1" } // Lighter pink
    ]
    
    setSessionsData({
      totalSessions: sessions,
      totalCompletions: completions,
      chartData
    })
  }, [])
  
  const { totalSessions, totalCompletions, chartData } = sessionsData

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Sessions Overview</CardTitle>
        <CardDescription>Completed vs Incomplete</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="sessions"
              nameKey="type"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalSessions.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Sessions
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-center text-center gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          {totalCompletions > 0 && totalSessions > 0 ? (
            <>
              {Math.round((totalCompletions / totalSessions) * 100)}% completion rate
              <TrendingUp className="h-4 w-4" />
            </>
          ) : (
            "No data available yet"
          )}
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total sessions across all quizzes
        </div>
      </CardFooter>
    </Card>
  )
} 