"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface PropertyGroupProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function PropertyGroup({ title, children, className, icon, action }: PropertyGroupProps) {
  return (
    <div className={cn(
      "property-group p-4 border rounded-md bg-card shadow-sm max-w-full overflow-hidden",
      className
    )}>
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          {icon || <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <h3 className="property-group-title text-sm font-medium">{title}</h3>
        </div>
        {action && (
          <div className="property-group-action">
            {action}
          </div>
        )}
      </div>
      <div className="property-group-content space-y-4 max-w-full">
        {children}
      </div>
    </div>
  );
} 