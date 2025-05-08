"use client";

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useQuizStore } from '@/store/useQuizStore';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { MoreVertical, Plus, Trash2, FileEdit, Copy, ExternalLink, ArrowDownAZ, Calendar, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Sort options type
type SortOption = 'lastEdited' | 'dateCreated' | 'alphabetical';

export function QuizManager() {
  const { quiz, quizList, createQuiz, loadQuiz, deleteQuiz, renameQuiz, duplicateQuiz } = useQuizStore();
  const [newQuizName, setNewQuizName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [quizToRename, setQuizToRename] = useState<{id: string, name: string} | null>(null);
  const [newName, setNewName] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('lastEdited');
  const router = useRouter();
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Add state for active menu
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  
  // Add state for menu position
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  
  // Add state for search term
  const [searchTerm, setSearchTerm] = useState('');
  
  // Handle document clicks to close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }
    
    if (activeMenu !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [activeMenu]);
  
  // Toggle menu function with position calculation
  const toggleMenu = (e: React.MouseEvent, quizId: string) => {
    e.stopPropagation();
    
    // If opening the menu, calculate position
    if (activeMenu !== quizId) {
      const button = e.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      
      // Position the menu near the button
      setMenuPosition({
        top: rect.bottom + 5, // 5px below the button
        left: rect.right - 160 // Aligned with button's right edge, adjusted to center menu
      });
    }
    
    setActiveMenu(activeMenu === quizId ? null : quizId);
  };

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sort the quiz list based on selected option
  const sortedQuizList = useMemo(() => {
    if (!quizList) return [];
    
    return [...quizList].sort((a, b) => {
      switch (sortOption) {
        case 'lastEdited':
          return new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime();
        case 'dateCreated':
          // For date created, we'll use the ID as a proxy since it's a UUID which is created when the quiz is
          // We're comparing IDs as a simple heuristic - newer quizzes have "greater" UUIDs
          return a.id > b.id ? -1 : a.id < b.id ? 1 : 0;
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [quizList, sortOption]);

  // Filter quizzes based on search term
  const filteredQuizList = useMemo(() => {
    if (!searchTerm.trim()) {
      return sortedQuizList;
    }
    
    const lowercasedSearch = searchTerm.toLowerCase();
    return sortedQuizList.filter(quiz => 
      quiz.name.toLowerCase().includes(lowercasedSearch)
    );
  }, [sortedQuizList, searchTerm]);

  if (!isClient) {
    return null;
  }

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

  const confirmDeleteQuiz = (id: string) => {
    setQuizToDelete(id);
    setShowConfirmDelete(true);
  };

  // Helper function for showing notifications
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    
    // Clear notification after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleDeleteQuiz = () => {
    if (quizToDelete) {
      // Store the name for the notification
      const quizName = quizList.find(q => q.id === quizToDelete)?.name || 'Quiz';
      
      deleteQuiz(quizToDelete);
      setQuizToDelete(null);
      setShowConfirmDelete(false);
      
      // Show success notification
      showNotification(`Quiz "${quizName}" was deleted successfully`, 'success');
    }
  };

  const openRenameDialog = (id: string, name: string) => {
    setQuizToRename({id, name});
    setNewName(name);
    setIsRenaming(true);
  };

  const handleRenameQuiz = () => {
    if (quizToRename && newName.trim()) {
      // Store old name for the notification
      const oldName = quizToRename.name;
      
      // Use the renameQuiz function from the store
      const success = renameQuiz(quizToRename.id, newName);
      if (success) {
        showNotification(`Quiz renamed from "${oldName}" to "${newName}"`, 'success');
        console.log(`Quiz renamed to ${newName}`);
      } else {
        showNotification(`Failed to rename quiz "${oldName}"`, 'error');
        console.error('Failed to rename quiz');
      }
      
      setQuizToRename(null);
      setNewName('');
      setIsRenaming(false);
    }
  };

  const handleDuplicateQuiz = async (id: string, name: string) => {
    // Use the duplicateQuiz function from the store
    const newId = await duplicateQuiz(id);
    if (newId) {
      showNotification(`Quiz "${name}" was duplicated successfully`, 'success');
      console.log(`Quiz duplicated: ${name} -> ${name} (Copy), new ID: ${newId}`);
    } else {
      showNotification(`Failed to duplicate quiz "${name}"`, 'error');
      console.error(`Failed to duplicate quiz: ${name}`);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get icon for the current sort option
  const getSortIcon = () => {
    switch (sortOption) {
      case 'lastEdited':
        return <Clock className="h-4 w-4 mr-2" />;
      case 'dateCreated':
        return <Calendar className="h-4 w-4 mr-2" />;
      case 'alphabetical':
        return <ArrowDownAZ className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="mb-4 flex justify-between items-center">
        <div className="relative w-[300px]">
          <Input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 bg-background"
          />
          <div className="absolute left-2.5 top-2.5 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={sortOption}
            onValueChange={(value) => setSortOption(value as SortOption)}
          >
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue>
                <div className="flex items-center">
                  {getSortIcon()}
                  {sortOption === 'lastEdited' ? 'Last edited' : 
                   sortOption === 'dateCreated' ? 'Date created' : 
                   'Alphabetical'}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lastEdited">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Last edited
                </div>
              </SelectItem>
              <SelectItem value="dateCreated">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date created
                </div>
              </SelectItem>
              <SelectItem value="alphabetical">
                <div className="flex items-center">
                  <ArrowDownAZ className="h-4 w-4 mr-2" />
                  Alphabetical
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {quizList.length === 0 ? (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm text-center py-16">
          <h3 className="text-lg font-medium mb-2">No quizzes found</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Create your first quiz to get started. You can build interactive quizzes with various question types.
          </p>
        </div>
      ) : filteredQuizList.length === 0 ? (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm text-center py-16">
          <h3 className="text-lg font-medium mb-2">No matches found</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            No quizzes match your search criteria. Try a different search term.
          </p>
          <Button variant="outline" onClick={() => setSearchTerm('')}>
            Clear search
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-visible">
          <div className="relative w-full overflow-visible">
            {searchTerm && (
              <div className="p-2 border-b border-border bg-muted/30 flex justify-between items-center">
                <span className="text-xs text-muted-foreground px-3">
                  Search results: {filteredQuizList.length} matching {filteredQuizList.length === 1 ? "quiz" : "quizzes"}
                </span>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Name</TableHead>
                  <TableHead>Last Edited</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuizList.map((quiz) => {
                  const handleRowClick = () => {
                    loadQuiz(quiz.id);
                    router.push(`/editor/${quiz.id}`);
                  };
                  
                  const isMenuOpen = activeMenu === quiz.id;
                  
                  return (
                    <TableRow 
                      key={quiz.id}
                      onClick={handleRowClick}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-medium hover:bg-muted/10">
                        {quiz.name}
                      </TableCell>
                      <TableCell className="hover:bg-muted/10">
                        {formatDate(quiz.lastEdited)}
                      </TableCell>
                      <TableCell className="text-right relative overflow-visible">
                        <div ref={isMenuOpen ? menuRef : null}>
                          <Button 
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => toggleMenu(e, quiz.id)}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          
                          {isMenuOpen && (
                            <div 
                              className="fixed w-56 rounded-md shadow-lg bg-popover border border-border z-[100]" 
                              style={{
                                top: `${menuPosition.top}px`,
                                left: `${menuPosition.left}px`,
                              }}
                            >
                              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                <button
                                  className="w-full flex items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    loadQuiz(quiz.id);
                                    router.push(`/editor/${quiz.id}`);
                                  }}
                                >
                                  <FileEdit className="mr-2 h-4 w-4" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  className="w-full flex items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openRenameDialog(quiz.id, quiz.name);
                                    setActiveMenu(null);
                                  }}
                                >
                                  <FileEdit className="mr-2 h-4 w-4" />
                                  <span>Rename</span>
                                </button>
                                <button
                                  className="w-full flex items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateQuiz(quiz.id, quiz.name);
                                    setActiveMenu(null);
                                  }}
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  <span>Duplicate</span>
                                </button>
                                <div className="border-t border-border my-1"></div>
                                <button
                                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-accent hover:text-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmDeleteQuiz(quiz.id);
                                    setActiveMenu(null);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quiz</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this quiz? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                variant="destructive" 
                onClick={handleDeleteQuiz}
              >
                Delete
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Quiz</DialogTitle>
            <DialogDescription>
              Enter a new name for your quiz.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="New quiz name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleRenameQuiz} disabled={!newName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {notification && (
        <div 
          className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg transition-opacity duration-300 ${
            notification.type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 
            'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
          }`}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
} 