"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface PropertyGroupProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
}

export function PropertyGroup({ 
  title, 
  children, 
  className, 
  icon, 
  action,
  expanded = true,
  onToggle
}: PropertyGroupProps) {
  // Always keep the property group expanded
  const [isExpanded] = useState(true);

  return (
    <div className={cn(
      "property-group border-b border-x-0 border-t-0 bg-card max-w-full overflow-hidden",
      className
    )}>
      <div 
        className="flex items-center justify-between gap-2" 
      >
        <div className="flex items-center gap-2">
          <h3 className="property-group-title text-m font-bold ">{title}</h3>
        </div>
        {action && (
          <div className="property-group-action">
            {action}
          </div>
        )}
      </div>
      <div className="property-group-content">
        {children}
      </div>
    </div>
  );
} 