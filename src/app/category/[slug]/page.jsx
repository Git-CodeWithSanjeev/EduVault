'use client';

import React from 'react';
import { CategoryView } from '@/views/CategoryDetail';
import { useSaved } from '@/hooks/useEduVault';

export default function CategoryDetailRoute() {
  const { saved, toggle } = useSaved();
  return <CategoryView saved={saved} toggle={toggle} />;
}
