"use client"

import { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4 mb-6 w-full pb-6 border-b border-border">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {children}
        </div>
      )}
    </div>
  )
} 