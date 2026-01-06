import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import { SpinnerCircle } from '../Spinner';

import { StoreMeta } from '../../types/store';

interface AdminHeaderProps {
  onLogout: () => Promise<void>;
  isRefreshing: boolean;
  storeMeta?: StoreMeta | null;
}

const AdminHeader = ({ onLogout, isRefreshing, storeMeta }: AdminHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/70 backdrop-blur-lg shadow-sm dark:shadow-md px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">Control Center</h1>
          {isRefreshing && <SpinnerCircle className="w-5 h-5 text-blue-500 dark:text-blue-400" />}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-2 w-10 h-10 sm:w-auto sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white font-medium rounded-full sm:rounded-lg transition-all duration-300 ease-in-out"
            aria-label="Logout"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
