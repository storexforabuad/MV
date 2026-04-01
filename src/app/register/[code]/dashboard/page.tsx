import { getReferralDashboardData } from '@/app/actions/referralActions';
import ReferralDashboardClient from '@/components/referral/ReferralDashboardClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Referral Dashboard | Compass 🧭',
    description: 'Track your referrals and earnings on Compass 🧭.',
    manifest: '/referral-manifest.json',
};

export default async function ReferralDashboardPage({ params }: { params: { code: string } }) {
    const data = await getReferralDashboardData(params.code);

    return (
        <main className="bg-black min-h-screen">
            <ReferralDashboardClient initialData={data} />
        </main>
    );
}
