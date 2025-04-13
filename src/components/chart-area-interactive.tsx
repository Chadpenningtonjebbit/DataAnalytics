"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Sample data for the chart
const chartData = [
  { month: "Jan", mobile: 120, desktop: 220 },
  { month: "Feb", mobile: 160, desktop: 320 },
  { month: "Mar", mobile: 210, desktop: 270 },
  { month: "Apr", mobile: 270, desktop: 250 },
  { month: "May", mobile: 230, desktop: 320 },
  { month: "Jun", mobile: 380, desktop: 300 },
  { month: "Jul", mobile: 320, desktop: 350 },
  { month: "Aug", mobile: 400, desktop: 380 },
]

const chartConfig = {
  mobile: {
    label: "Mobile Completions",
    color: "hsl(var(--chart-1))",
  },
  desktop: {
    label: "Desktop Completions", 
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Quiz Completions</CardTitle>
        <CardDescription>
          The chart shows total quiz completions over the last 8 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={10} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="desktop"
                stroke="var(--color-desktop)"
                strokeWidth={2}
                fill="var(--color-desktop)"
                fillOpacity={0.2}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="mobile"
                stroke="var(--color-mobile)"
                strokeWidth={2}
                fill="var(--color-mobile)"
                fillOpacity={0.2}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 