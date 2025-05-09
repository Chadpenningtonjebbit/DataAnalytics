"use client";

import React from 'react';
import { AppHeader } from './AppHeader';
import { SaveStatus } from './SaveStatus';

export function Header() {
  return (
    <AppHeader
      pageType="editor"
      showBackButton={true}
      backUrl="/dashboard"
      rightContent={<SaveStatus />}
    />
  );
} 