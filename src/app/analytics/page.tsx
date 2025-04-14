"use client";

import { AppHeader } from '@/components/layout/AppHeader';
import { PageHeader } from '@/components/page-header';
import { SessionsChart } from '@/components/analytics/SessionsChart';
import { BrowserChart } from '@/components/analytics/BrowserChart';
import { DeviceChart } from '@/components/analytics/DeviceChart';
import { AnalyticsSummary } from '@/components/analytics/AnalyticsSummary';
import { MonthlySessionsChart } from '@/components/analytics/MonthlySessionsChart';
import { ScreenTimeChart } from '@/components/analytics/ScreenTimeChart';

export default function Analytics() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader pageType="dashboard" />
      
      <main className="flex-1 p-12 bg-muted">
        <div className="max-w-6xl mx-auto">
          <PageHeader
            title="Analytics Dashboard"
            description="Track performance and user engagement metrics for your quizzes"
          />
          
          <div className="mt-6">
            <AnalyticsSummary />
          </div>
          
          <div className="mt-6">
            <MonthlySessionsChart />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <SessionsChart />
            <BrowserChart />
            <DeviceChart />
          </div>
          
          <div className="mt-6">
            <ScreenTimeChart />
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