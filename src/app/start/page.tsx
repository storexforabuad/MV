import StartLandingClient from '@/components/start/StartLandingClient';
import CodeEntryForm from '@/components/referral/CodeEntryForm';
import { Suspense } from 'react';

export const metadata = {
    title: 'Start Your Business | BizConnect',
    description: 'The premium platform for modern commerce. Launch your online store in minutes.',
};

export default function StartPage() {
    return (
        <main className="bg-black min-h-screen">
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-white">Loading...</div></div>}>
                <div className="flex flex-col lg:flex-row items-stretch min-h-screen">
                    {/* Landing section - hide on mobile, show on desktop */}
                    <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-8">
                        <StartLandingClient />
                    </div>

                    {/* Code entry section - full width on mobile, half on desktop */}
                    <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
                        <CodeEntryForm />
                    </div>
                </div>
            </Suspense>
        </main>
    );
}
