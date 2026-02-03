import { getAmbassadorProfile } from '@/app/actions/ambassadorActions';
import AmbassadorProfileClient from '@/components/referral/AmbassadorProfileClient';

interface PageProps {
    params: { code: string };
}

export const metadata = {
    title: 'Ambassador Profile | ATLAS',
    description: 'Manage your ambassador profile and earnings details'
};

export default async function AmbassadorProfilePage({ params }: PageProps) {
    const profile = await getAmbassadorProfile(params.code);

    return (
        <main className="bg-black min-h-screen">
            <AmbassadorProfileClient referralCode={params.code} initialProfile={profile} />
        </main>
    );
}
