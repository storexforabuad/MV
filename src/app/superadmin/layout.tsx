'use client';

import { Inter } from 'next/font/google';
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className={`${inter.className} min-h-screen bg-[#F8F9FE] text-slate-900 selection:bg-indigo-100`}>
            {/* 3D Background Elements (Mocks) */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 -right-24 w-64 h-64 bg-orange-100/40 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 left-1/4 w-80 h-80 bg-blue-100/30 rounded-full blur-3xl animate-bounce-slow" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <main className="flex-grow max-w-5xl mx-auto w-full px-4 pt-6 pb-24">
                    {children}
                </main>
            </div>

            <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 8s ease-in-out infinite;
        }
        /* Custom Squircle Logic */
        .squircle-32 {
          border-radius: 32px;
        }
      `}</style>
        </div>
    );
}
