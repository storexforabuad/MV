import ReferralDashboardClient from '@/components/referral/ReferralDashboardClient';
import { getCommissionDashboardData } from '@/app/actions/startActions';

export const metadata = {
    title: 'Ambassador Dashboard | BizConnect',
    description: 'Track your referrals and earnings.',
};

interface PageProps {
    params: {
        code: string;
    };
}

export default async function DashboardPage({ params }: PageProps) {
    const data = await getCommissionDashboardData(params.code);

    // We cast the data to any because the types might not match exactly if we mocked it loosely
    // In a real scenario we'd ensure types match
    return <ReferralDashboardClient initialData={data as any} />;
}
