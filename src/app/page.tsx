"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the dashboard
    router.push('/dashboard');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-pulse text-xl">Redirecting to dashboard...</div>
    </div>
  );
}
