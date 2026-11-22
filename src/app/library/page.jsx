'use client';

import React from 'react';
import { Library } from '@/views/LibraryPage';
import { useSaved } from '@/hooks/useEduVault';

export default function LibraryRoute() {
  const { saved, toggle } = useSaved();
  return <Library saved={saved} toggle={toggle} />;
}
