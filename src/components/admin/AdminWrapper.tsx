'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Loader2, BarChart3, Database, Upload, FileText, Menu, X, LogOut } from 'lucide-react';
import Link from 'next/link';
import { VersionInfo } from '@/components/VersionInfo';

interface AdminWrapperProps {
  children: React.ReactNode;
}

export function AdminWrapper({ children }: AdminWrapperProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    // Check current session
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (!session) {
          setUser(null);
          setIsLoading(false);
          // Use window.location for more reliable redirect
          window.location.href = '/admin/login';
          return;
        }
        
        setUser(session.user);
        setIsLoading(false);
      } catch {
        if (mounted) {
          setIsLoading(false);
          window.location.href = '/admin/login';
        }
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          window.location.href = '/admin/login';
        } else if (session) {
          setUser(session.user);
          setIsLoading(false);
        }
      }
    );

    checkAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const navigationItems = [
    { href: '/admin', icon: BarChart3, label: 'Dashboard', exact: true },
    { href: '/admin/manage', icon: Database, label: 'จัดการข้อมูล' },
    { href: '/admin/upload', icon: Upload, label: 'อัพโหลดข้อมูล' },
    { href: '/admin/logs', icon: FileText, label: 'บันทึกค้นหา' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">
            Survey Admin
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = item.exact 
                ? pathname === item.href 
                : pathname.startsWith(item.href) && item.href !== '/admin';
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <item.icon 
                    className={`mr-3 h-5 w-5 transition-colors ${
                      isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                    }`} 
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 truncate">
                เข้าสู่ระบบในนาม
              </p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="ml-3 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="ออกจากระบบ"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          
          {/* Version info at bottom */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-center">
              <VersionInfo />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              Survey Admin
            </h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}