import { RefreshCw } from 'lucide-react';

interface ConnectionErrorToastProps {
  onRetry: () => void;
}

export default function ConnectionErrorToast({ onRetry }: ConnectionErrorToastProps) {
  return (
    <div className="fixed inset-x-0 bottom-6 flex justify-center z-50 px-4">
      <div className="bg-[var(--navbar-bg)] border border-[var(--border-color)] 
        text-[var(--text-primary)] px-4 py-3 rounded-full shadow-lg 
        flex items-center gap-3 animate-fade-in max-w-md mx-auto">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            Checking connection...
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Please check your internet connection
          </p>
        </div>
        <button 
          onClick={onRetry}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full
            bg-[var(--button-primary)] text-white text-sm font-medium
            hover:bg-opacity-90 active:scale-95 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    </div>
  );
}
