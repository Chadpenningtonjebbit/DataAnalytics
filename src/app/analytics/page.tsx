"use client";

import { AppHeader } from '@/components/layout/AppHeader';
import { SectionCards } from '@/components/section-cards';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { DatePickerWithRange } from '@/components/date-picker-with-range';

export default function Analytics() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader pageType="dashboard" />
      
      <main className="flex flex-1 flex-col bg-muted">
        <div className="max-w-7xl mx-auto w-full px-4">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <PageHeader
              title="Analytics"
              description="View performance metrics for all your quizzes"
            >
              <DatePickerWithRange />
            </PageHeader>
            
            <SectionCards />
            <ChartAreaInteractive />
            <DataTable />
          </div>
        </div>
      </main>
      
      <footer className="border-t border-border py-4 text-center text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4">
          SimpleBuilder © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
} 