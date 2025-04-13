"use client";

import React from 'react';
import { AppHeader } from './AppHeader';
import { useRouter } from 'next/navigation';

export function Header() {
  return (
    <AppHeader
      pageType="editor"
      showBackButton={true}
      backUrl="/dashboard"
    />
  );
} 