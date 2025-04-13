"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  HeaderGroup,
  Header,
  Cell,
} from "@tanstack/react-table"
import { useEffect, useState } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pie, PieChart, Cell as PieCell, Legend, Tooltip } from "recharts"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"

// Define the data structure for our table
type QuizResult = {
  id: string
  quizName: string
  completions: number
  avgScore: number
  avgTimeMin: number
  dateCreated: string
}

// Sample data for the table
const dummyData: QuizResult[] = [
  {
    id: "1",
    quizName: "Product Knowledge Test",
    completions: 845,
    avgScore: 78,
    avgTimeMin: 4.2,
    dateCreated: "2023-06-15",
  },
  {
    id: "2",
    quizName: "Customer Service Assessment",
    completions: 725,
    avgScore: 82,
    avgTimeMin: 5.8,
    dateCreated: "2023-07-02",
  },
  {
    id: "3",
    quizName: "Technical Skills Evaluation",
    completions: 510,
    avgScore: 65,
    avgTimeMin: 8.5,
    dateCreated: "2023-08-10",
  },
  {
    id: "4",
    quizName: "Onboarding Quiz",
    completions: 310,
    avgScore: 92,
    avgTimeMin: 3.2,
    dateCreated: "2023-09-22",
  },
  {
    id: "5",
    quizName: "Safety Procedures Quiz",
    completions: 190,
    avgScore: 88,
    avgTimeMin: 6.7,
    dateCreated: "2023-10-08",
  },
]

// Sample data for the pie chart
const pieData = [
  { name: "Passed", value: 75, color: "hsl(var(--chart-2))" },
  { name: "Failed", value: 25, color: "hsl(var(--chart-1))" },
]

// Chart config for pie chart
const pieChartConfig = {
  passed: {
    label: "Passed",
    color: "hsl(var(--chart-2))",
  },
  failed: {
    label: "Failed",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

// Column definitions for our table
const columns: ColumnDef<QuizResult>[] = [
  {
    accessorKey: "quizName",
    header: "Quiz Name",
    cell: ({ row }) => <div className="font-medium">{row.getValue("quizName")}</div>,
  },
  {
    accessorKey: "completions",
    header: "Completions",
    cell: ({ row }) => <div className="text-right">{row.getValue("completions")}</div>,
  },
  {
    accessorKey: "avgScore",
    header: "Avg. Score",
    cell: ({ row }) => (
      <div className="text-right">
        {row.getValue("avgScore")}%
      </div>
    ),
  },
  {
    accessorKey: "avgTimeMin",
    header: "Avg. Time",
    cell: ({ row }) => (
      <div className="text-right">
        {row.getValue("avgTimeMin")} min
      </div>
    ),
  },
  {
    accessorKey: "dateCreated",
    header: "Created On",
    cell: ({ row }) => {
      const date = new Date(row.getValue("dateCreated"));
      return <div className="text-right">{date.toLocaleDateString()}</div>;
    },
  },
]

interface DataTableProps {
  data?: QuizResult[]
}

export function DataTable({ data = dummyData }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [tableData, setTableData] = useState<QuizResult[]>([])

  useEffect(() => {
    // Set the data when component mounts
    setTableData(data)
  }, [data])

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Quiz Results</CardTitle>
              <CardDescription>Analyze completion rates and scores across all quizzes</CardDescription>
            </div>
            <div className="flex h-[140px] w-[140px]">
              <ChartContainer config={pieChartConfig} className="h-full w-full">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((entry, index) => (
                      <PieCell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ChartContainer>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup: HeaderGroup<QuizResult>) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header: Header<QuizResult, unknown>) => {
                      return (
                        <TableHead key={header.id} className={header.id !== "quizName" ? "text-right" : ""}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row: Row<QuizResult>) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell: Cell<QuizResult, unknown>) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {table.getRowModel().rows.length} of {dummyData.length} quizzes
          </div>
          <Button variant="outline" size="sm">
            Export Report
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 