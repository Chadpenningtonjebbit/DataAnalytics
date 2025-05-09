"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  MoonIcon, 
  SunIcon, 
  EyeIcon, 
  ArrowLeft,
  HomeIcon,
  LayoutDashboard,
  BarChart,
  Image as ImageIcon
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  backUrl?: string;
  pageType?: 'dashboard' | 'editor' | 'generic';
  rightContent?: React.ReactNode;
}

export function AppHeader({ 
  title = "SimpleBuilder", 
  showBackButton = false,
  backUrl = "/dashboard",
  pageType = "generic",
  rightContent 
}: AppHeaderProps) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const params = useParams();
  
  // Extract quizId from URL if in editor page
  const quizId = pageType === 'editor' && params?.quizId ? params.quizId : null;
  
  return (
    <header className="border-b border-border h-12 flex items-center justify-between px-4 bg-background/95 backdrop-blur-sm z-40 sticky top-0 shadow-sm">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                  <Link href={backUrl}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Go Back</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Back to {backUrl === '/dashboard' ? 'Dashboard' : 'Previous Page'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {pageType === 'dashboard' && (
        <div className="flex items-center absolute left-1/2 -translate-x-1/2 space-x-8">
          <Link href="/dashboard" className={`text-sm font-medium hover:text-primary/80 ${pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}>
            Dashboard
          </Link>
          <Link href="/analytics" className={`text-sm font-medium hover:text-primary/80 ${pathname === '/analytics' ? 'text-primary' : 'text-muted-foreground'}`}>
            Analytics
          </Link>
          <Link href="/media" className={`text-sm font-medium hover:text-primary/80 ${pathname === '/media' ? 'text-primary' : 'text-muted-foreground'}`}>
            My Brand
          </Link>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        {rightContent}
        
        {pageType === 'editor' && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0" 
                    onClick={() => quizId && window.open(`/preview/${quizId}`, '_blank')}
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span className="sr-only">Preview</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Preview your project</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Toggle {theme === "dark" ? "light" : "dark"} mode</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
} 