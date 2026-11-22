'use client';

import React from 'react';
import { Detail } from '@/views/BookDetailPage';
import { useSaved } from '@/hooks/useEduVault';

export function ResourceClient() {
  const { saved, toggle } = useSaved();
  return <Detail saved={saved} toggle={toggle} />;
}
