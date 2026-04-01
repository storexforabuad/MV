import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
}

export default function PullToRefresh({ onRefresh }: PullToRefreshProps) {
  const { isPulling } = usePullToRefresh(onRefresh);

  if (!isPulling) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center">
      <div className="bg-card-background rounded-full shadow-lg p-3 m-4 transform-gpu animate-bounce">
        <RefreshCw className="w-6 h-6 text-text-primary animate-spin" />
      </div>
    </div>
  );
}
