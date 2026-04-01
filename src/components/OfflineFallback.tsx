import { WifiOff } from 'lucide-react';

export default function OfflineFallback() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <WifiOff className="w-16 h-16 text-text-secondary mx-auto" />
        
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-text-primary">
            No Internet Connection
          </h1>
          
          <p className="text-text-secondary max-w-md mx-auto">
            Please check your internet connection and try again.
            The app requires an internet connection to show products and process orders.
          </p>
        </div>

        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 px-6 py-3 bg-[var(--button-primary)] text-white 
            rounded-full font-medium hover:bg-opacity-90 active:scale-95 
            transition-all inline-flex items-center gap-2"
        >
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
}
