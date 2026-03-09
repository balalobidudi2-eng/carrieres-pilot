'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F2F8] dark:bg-[#0A1628]">
      <AdminSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6" id="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
