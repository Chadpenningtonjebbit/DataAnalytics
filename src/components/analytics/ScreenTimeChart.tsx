"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts"
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

// Sample data structure - in a real app this would be calculated from actual analytics
const sampleChartData = [
  { month: "January", avgTime: 45 },
  { month: "February", avgTime: 62 },
  { month: "March", avgTime: 58 },
  { month: "April", avgTime: 73 },
  { month: "May", avgTime: 81 },
  { month: "June", avgTime: 76 },
]

const chartConfig = {
  avgTime: {
    label: "Avg. Time (sec)",
    color: "#f6339a", // Primary pink
  },
} satisfies ChartConfig

export function ScreenTimeChart() {
  // State for chart data with proper type
  const [chartData, setChartData] = React.useState<Array<{
    month: string;
    avgTime: number;
  }>>(sampleChartData)
  
  // State for trend percentage
  const [trendPercentage, setTrendPercentage] = React.useState(5.2)
  
  // Use useEffect to prevent hydration issues
  React.useEffect(() => {
    // In a real implementation, you would:
    // 1. Fetch all analytics data
    // 2. Calculate average time per screen per month
    // 3. Format the data for the chart
    
    // This is a simplified implementation using sample data
    const getAllQuizAnalytics = useAnalyticsStore.getState().getAllQuizAnalytics
    const analyticsData = getAllQuizAnalytics()
    
    // If there's real data available, we could calculate actual values
    // For now, we'll use the sample data
    
    // Calculate trend percentage (comparing last month to previous month)
    const lastMonthIdx = chartData.length - 1
    const prevMonthIdx = chartData.length - 2
    
    if (lastMonthIdx > 0 && prevMonthIdx >= 0) {
      const lastMonth = chartData[lastMonthIdx].avgTime
      const prevMonth = chartData[prevMonthIdx].avgTime
      
      if (prevMonth > 0) {
        const trend = ((lastMonth - prevMonth) / prevMonth) * 100
        setTrendPercentage(Math.round(trend * 10) / 10)
      }
    }
    
    // In a real implementation, we would set actual chart data here
    // setChartData(calculatedData)
  }, [chartData.length])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Average Time per Screen</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: string) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              type="monotone"
              dataKey="avgTime"
              stroke="#f6339a" // Primary pink
              strokeWidth={2}
              dot={{
                fill: "#f6339a", // Primary pink
              }}
              activeDot={{
                r: 6,
              }}
              isAnimationActive={true}
              animationDuration={500}
              animationEasing="ease-in-out"
            >
              <LabelList
                dataKey="avgTime"
                position="top"
                fill="#f6339a" // Primary pink
                formatter={(value: number) => {
                  return value.toFixed(2) + " sec";
                }}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-center text-center gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {trendPercentage > 0 ? "Trending up" : "Trending down"} by {Math.abs(trendPercentage)}% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Average time users spend on each screen in seconds
        </div>
      </CardFooter>
    </Card>
  )
} 