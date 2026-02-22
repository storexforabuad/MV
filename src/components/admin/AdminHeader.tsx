'use client';

import { LogOut } from 'lucide-react';
import { SpinnerCircle } from '../Spinner';

import { StoreMeta } from '../../types/store';

interface AdminHeaderProps {
  onLogout: () => Promise<void>;
  isRefreshing: boolean;
  storeMeta?: StoreMeta | null;
}

const AdminHeader = ({ onLogout, isRefreshing, storeMeta }: AdminHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Control Center</h1>
          {isRefreshing && <SpinnerCircle className="w-5 h-5 text-indigo-500" />}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onLogout}
            className="group flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-all active:scale-95"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
