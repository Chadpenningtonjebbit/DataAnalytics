"use client";

import { useState } from 'react';
import { QuizManager } from '@/components/QuizManager';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useQuizStore } from '@/store/useQuizStore';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [isCreating, setIsCreating] = useState(false);
  const [newQuizName, setNewQuizName] = useState('');
  const createQuiz = useQuizStore((state) => state.createQuiz);
  const router = useRouter();

  const handleCreateQuiz = () => {
    if (newQuizName.trim()) {
      createQuiz(newQuizName.trim());
      setNewQuizName('');
      setIsCreating(false);
      
      // Get the current quiz ID and navigate to editor
      const currentQuizId = useQuizStore.getState().quiz.id;
      router.push(`/editor/${currentQuizId}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader pageType="dashboard" />
      
      <main className="flex-1 p-12 bg-muted">
        <div className="max-w-6xl mx-auto">
          <PageHeader
            title="Dashboard"
            description="Create and manage your interactive quizzes"
          >
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New Quiz
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Quiz</DialogTitle>
                  <DialogDescription>Enter a name for your new quiz.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="Quiz name"
                    value={newQuizName}
                    onChange={(e) => setNewQuizName(e.target.value)}
                    className="w-full"
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleCreateQuiz} disabled={!newQuizName.trim()}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </PageHeader>
          
          <QuizManager />
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