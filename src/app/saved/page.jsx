'use client';

import React from 'react';
import { SavedPage } from '@/views/SavedWishlistPage';
import { useSaved } from '@/hooks/useEduVault';

export default function SavedRoute() {
  const { saved, toggle } = useSaved();
  return <SavedPage saved={saved} toggle={toggle} />;
}
