"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, Line, LineChart } from "recharts"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { Activity, Users, BarChart3, Clock, TrendingUp } from "lucide-react"

// Sample data for the miniature charts
const completionData = [
  { value: 350 },
  { value: 400 },
  { value: 380 },
  { value: 450 },
  { value: 460 },
  { value: 520 },
  { value: 580 },
]

const engagementData = [
  { value: 45 },
  { value: 52 },
  { value: 49 },
  { value: 62 },
  { value: 57 },
  { value: 66 },
  { value: 74 },
]

const timeData = [
  { value: 20 },
  { value: 24 },
  { value: 25 },
  { value: 22 },
  { value: 28 },
  { value: 27 },
  { value: 32 },
]

const conversionData = [
  { value: 6 },
  { value: 8 },
  { value: 9 },
  { value: 10 },
  { value: 12 },
  { value: 15 },
  { value: 17 },
]

// Chart configurations
const cardChartConfig = {
  value: {
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function SectionCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Completions</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2,580</div>
          <p className="text-xs text-muted-foreground">
            +20.1% from last month
          </p>
          <div className="h-[80px]">
            <ChartContainer config={cardChartConfig} className="mt-2 h-[80px] w-full">
              <BarChart data={completionData}>
                <Bar
                  dataKey="value"
                  fill="var(--color-value)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Average Engagement</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">74%</div>
          <p className="text-xs text-muted-foreground">
            +12.2% from last month
          </p>
          <div className="h-[80px]">
            <ChartContainer config={cardChartConfig} className="mt-2 h-[80px] w-full">
              <LineChart data={engagementData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Average Time Spent</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">3.2 min</div>
          <p className="text-xs text-muted-foreground">
            +4.5% from last month
          </p>
          <div className="h-[80px]">
            <ChartContainer config={cardChartConfig} className="mt-2 h-[80px] w-full">
              <BarChart data={timeData}>
                <Bar
                  dataKey="value"
                  fill="var(--color-value)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">17.3%</div>
          <p className="text-xs text-muted-foreground">
            +8.1% from last month
          </p>
          <div className="h-[80px]">
            <ChartContainer config={cardChartConfig} className="mt-2 h-[80px] w-full">
              <LineChart data={conversionData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 