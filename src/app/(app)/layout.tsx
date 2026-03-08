'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Sidebar } from '@/components/shared/Sidebar';
import { AppHeader } from '@/components/shared/AppHeader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F8FC]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
