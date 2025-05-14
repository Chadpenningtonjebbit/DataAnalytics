"use client";

import React from 'react';
import { AppHeader } from './AppHeader';
import { SaveStatus } from './SaveStatus';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export function Header() {
  const pathname = usePathname() || '';
  const params = useParams();
  const quizId = params?.quizId as string;
  
  const isEditorTab = !pathname.includes('/testing');
  
  return (
    <AppHeader
      pageType="editor"
      showBackButton={true}
      backUrl="/dashboard"
      rightContent={<SaveStatus />}
      centerContent={
        <div className="flex items-center space-x-8">
          <Link 
            href={`/editor/${quizId}`} 
            className={`text-sm font-medium hover:text-primary/80 ${isEditorTab ? 'text-primary' : 'text-muted-foreground'}`}
          >
            Editor
          </Link>
          <Link 
            href={`/editor/${quizId}/testing`} 
            className={`text-sm font-medium hover:text-primary/80 ${!isEditorTab ? 'text-primary' : 'text-muted-foreground'}`}
          >
            Personalization
          </Link>
        </div>
      }
    />
  );
} 