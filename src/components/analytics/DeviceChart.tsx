"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Pie, PieChart } from "recharts"
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

// Chart configuration with direct hex colors
const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Desktop",
    color: "#355DF9", // Primary blue
  },
  mobile: {
    label: "Mobile",
    color: "#22C55E", // Green
  },
  tablet: {
    label: "Tablet",
    color: "#EAB308", // Yellow
  },
  other: {
    label: "Other",
    color: "#9333EA", // Purple
  },
} satisfies ChartConfig

export function DeviceChart() {
  // State for device data
  const [deviceData, setDeviceData] = React.useState<{
    chartData: Array<{device: string; count: number; fill: string}>;
    totalDevices: number;
    growthRate: number;
  }>({
    chartData: [],
    totalDevices: 0,
    growthRate: 0
  })
  
  // Use useEffect to prevent hydration issues
  React.useEffect(() => {
    // Get analytics data from store
    const getAllQuizAnalytics = useAnalyticsStore.getState().getAllQuizAnalytics
    const analyticsData = getAllQuizAnalytics()
    
    // Initialize device counts
    let desktopCount = 0
    let mobileCount = 0
    let tabletCount = 0
    let otherCount = 0
    let total = 0
    
    // Aggregate device data from all quizzes
    analyticsData.forEach(quiz => {
      const { desktop, mobile, tablet, other } = quiz.deviceBreakdown
      desktopCount += desktop || 0
      mobileCount += mobile || 0
      tabletCount += tablet || 0
      otherCount += other || 0
      
      total += (desktop || 0) + (mobile || 0) + (tablet || 0) + (other || 0)
    })
    
    // Direct colors for each device type
    const colors = {
      desktop: "#f6339a", // Primary pink
      mobile: "#ffa6d1", // Lighter pink
    };
    
    // Convert to chart data format
    const chartData = [
      { device: "desktop", count: desktopCount, fill: colors.desktop },
      { device: "mobile", count: mobileCount, fill: colors.mobile },
      { device: "tablet", count: tabletCount, fill: "#EAB308" },
      { device: "other", count: otherCount, fill: "#9333EA" }
    ].filter(item => item.count > 0)
    
    // Calculate a simulated growth rate (could be based on real data in a real implementation)
    const growthRate = 5.2 // Using a fixed value for demonstration
    
    setDeviceData({
      chartData,
      totalDevices: total,
      growthRate
    })
  }, [])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Device Usage</CardTitle>
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
              data={deviceData.chartData} 
              dataKey="count" 
              nameKey="device"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-center text-center gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by {deviceData.growthRate}% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Device distribution from all sessions
        </div>
      </CardFooter>
    </Card>
  )
} 