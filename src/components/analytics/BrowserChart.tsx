"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Pie, PieChart } from "recharts"

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

// Chart configuration with direct hex colors
const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  chrome: {
    label: "Chrome",
    color: "#3B82F6", // Blue
  },
  firefox: {
    label: "Firefox",
    color: "#F97316", // Orange
  },
  safari: {
    label: "Safari",
    color: "#8B5CF6", // Purple
  },
  edge: {
    label: "Edge",
    color: "#10B981", // Green
  },
  other: {
    label: "Other",
    color: "#F43F5E", // Red
  },
} satisfies ChartConfig

export function BrowserChart() {
  // State for browser data with proper types
  const [browserData, setBrowserData] = React.useState<{
    chartData: Array<{browser: string; visitors: number; fill: string}>;
    totalVisitors: number;
    trendPercentage: number;
  }>({
    chartData: [
      { browser: "chrome", visitors: 275, fill: "#3B82F6" },
      { browser: "safari", visitors: 200, fill: "#8B5CF6" },
      { browser: "firefox", visitors: 187, fill: "#F97316" },
      { browser: "edge", visitors: 173, fill: "#10B981" },
      { browser: "other", visitors: 90, fill: "#F43F5E" },
    ],
    totalVisitors: 925,
    trendPercentage: 5.2
  })
  
  // In a real implementation, we would fetch actual data from analytics store here

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Browser Usage</CardTitle>
        <CardDescription>Across all quizzes</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie 
              data={browserData.chartData} 
              dataKey="visitors" 
              nameKey="browser" 
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-center text-center gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by {browserData.trendPercentage}% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Browser distribution from all sessions
        </div>
      </CardFooter>
    </Card>
  )
} 