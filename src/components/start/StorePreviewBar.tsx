'use client';

import { useState } from 'react';
import { Copy, Smartphone } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { sendEvent } from '@/lib/analytics';

export default function StorePreviewBar({ storeId }: { storeId: string }) {
  const [copied, setCopied] = useState(false);
  const storeHref = storeId ? `${window.location.origin}/${storeId}` : window.location.origin;
  const { handleInstall, isInstallAvailable } = useInstallPrompt();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(storeHref);
      setCopied(true);
      sendEvent('copy_store_link', { storeId });
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // ignore
    }
  };

  const onInstall = () => {
    sendEvent('install_dashboard_click', { storeId });
    try {
      handleInstall();
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-emerald-600 font-black">{storeId?.charAt(0)?.toUpperCase() || 'S'}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="truncate text-sm font-bold text-slate-900">{storeId || 'Your store'}</div>
          <StatusBadge variant={isInstallAvailable ? 'info' : 'active'}>{isInstallAvailable ? 'Install available' : 'Installed'}</StatusBadge>
        </div>
        <div className="text-[13px] text-slate-500 truncate">{storeHref}</div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleCopy} aria-label="Copy store link" className="p-2 rounded-md bg-white border border-slate-200">
          <Copy className="w-4 h-4 text-slate-700" />
        </button>
        <button onClick={onInstall} aria-label="Install dashboard" className="p-2 rounded-md bg-emerald-600 text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          <span className="text-sm font-black">Install</span>
        </button>
      </div>
    </div>
  );
}
