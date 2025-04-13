"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { useQuizStore } from '@/store/useQuizStore';

interface EditorPageProps {
  params: {
    quizId: string;
  };
}

export default function EditorPage({ params }: EditorPageProps) {
  const { quizId } = params;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get functions from store
  const loadQuiz = useQuizStore((state) => state.loadQuiz);
  
  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        console.log(`Attempting to load quiz with ID: ${quizId}`);
        
        // Use the store's loadQuiz function
        const success = await loadQuiz(quizId);
        
        if (!success) {
          console.error(`Failed to load quiz with ID: ${quizId}`);
          // Instead of showing an error, redirect to dashboard
          router.replace('/dashboard');
          return;
        }
        
        console.log(`Successfully loaded quiz: ${quizId}`);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading quiz:', error);
        // For any error, also redirect to dashboard
        router.replace('/dashboard');
      }
    };
    
    initializeQuiz();
  }, [quizId, loadQuiz, router]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-xl">Loading quiz...</div>
      </div>
    );
  }
  
  // Show error state if for some reason we haven't redirected yet
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-xl text-destructive mb-4">{error}</div>
        <button 
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
          onClick={() => router.push('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }
  
  // Show the editor
  return (
    <Layout />
  );
} 