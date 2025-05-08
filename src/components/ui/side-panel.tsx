"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { PanelHeader } from '@/components/ui/panel-header';

interface SidePanelProps {
  title: string;
  color?: string;
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  width?: number;
}

export function SidePanel({
  title,
  color,
  isOpen,
  onClose,
  children,
  className,
  width = 340,
}: SidePanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col border-r bg-background shadow-sm transition-all duration-300 ease-in-out",
        {
          "w-0 opacity-0 overflow-hidden": !isOpen,
        },
        className
      )}
      style={{
        width: isOpen ? `${width}px` : '0px',
      }}
    >
      {isOpen && (
        <>
          <PanelHeader title={title} onClose={onClose} color={color} />
          <div className="flex-1 overflow-auto">{children}</div>
        </>
      )}
    </div>
  );
} 