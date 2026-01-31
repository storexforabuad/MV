'use client';

import { DownloadCloud, Box, Instagram, MessageSquare } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';

export default function SuccessNextSteps({ storeId }: { storeId: string }) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-black mb-3">Next steps</h3>
      <div className="grid grid-cols-1 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-slate-900">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-50 rounded-md text-emerald-600"><DownloadCloud className="w-5 h-5" /></div>
            <div>
              <div className="font-bold">Install the dashboard</div>
              <div className="text-sm text-slate-500">Install the dashboard app to manage orders and products on the go.</div>
            </div>
            <div className="ml-auto"><StatusBadge variant="info">Recommended</StatusBadge></div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-slate-900">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-50 rounded-md text-slate-700"><Box className="w-5 h-5" /></div>
            <div>
              <div className="font-bold">Upload a product</div>
              <div className="text-sm text-slate-500">Add one product with a clear photo and price so customers can buy right away.</div>
            </div>
            <div className="ml-auto"><StatusBadge variant="pending">Pending</StatusBadge></div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-slate-900">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-50 rounded-md text-pink-500"><Instagram className="w-5 h-5" /></div>
            <div>
              <div className="font-bold">Share on Instagram & WhatsApp</div>
              <div className="text-sm text-slate-500">Add your store link to your Instagram bio and share it with contacts on WhatsApp.</div>
            </div>
            <div className="ml-auto"><StatusBadge variant="info">Share</StatusBadge></div>
          </div>
        </div>
      </div>
    </div>
  );
}
