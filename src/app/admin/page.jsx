'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const AdminPanel = dynamic(
  () => import('@/views/AdminDashboard').then((mod) => mod.AdminPanel),
  {
    ssr: false,
    loading: () => (
      <div className="admin-login-wrapper" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#0F5E53', fontWeight: 600, fontSize: '14px' }}>
          Loading Admin Console…
        </div>
      </div>
    ),
  }
);

export default function AdminPageRoute() {
  return <AdminPanel />;
}
