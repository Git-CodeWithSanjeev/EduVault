'use client';

import React from 'react';
import { Home } from '@/views/Home';
import { useSaved, useRecentlyVisited } from '@/hooks/useEduVault';

export default function Page() {
  const { saved, toggle } = useSaved();
  const { recentIds } = useRecentlyVisited();

  return <Home saved={saved} toggle={toggle} recentIds={recentIds} />;
}
