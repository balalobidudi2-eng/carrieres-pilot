'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { setAccessToken } from '@/lib/axios';
import { Sidebar } from '@/components/shared/Sidebar';
import { AppHeader } from '@/components/shared/AppHeader';
import { SupportChat } from '@/components/shared/SupportChat';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    // After Google OAuth callback the access token arrives via a short-lived cookie
    const oauthToken = getCookie('cp_access_token');
    if (oauthToken) {
      setAccessToken(oauthToken);
      deleteCookie('cp_access_token');
    }
    fetchMe();
  }, [fetchMe]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F8FC] dark:bg-[#0D1B2A]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6" id="main-content">
          {children}
        </main>
      </div>
      <SupportChat />
    </div>
  );
}
