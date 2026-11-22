'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { useSaved } from '@/hooks/useEduVault';

const PDFReader = dynamic(
  () => import('@/components/PDFReader').then((mod) => mod.PDFReader || mod.default),
  {
    ssr: false,
    loading: () => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', color: '#0F5E53', fontWeight: 700 }}>
        Opening textbook…
      </div>
    ),
  }
);

export default function ReadRoute() {
  const { saved, toggle } = useSaved();
  return <PDFReader saved={saved} toggle={toggle} />;
}
