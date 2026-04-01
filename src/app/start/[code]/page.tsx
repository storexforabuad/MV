import StartLandingClient from '@/components/start/StartLandingClient';

export const metadata = {
    title: 'You\'ve Been Invited | Compass 🧭',
    description: 'Claim your free store and start selling today.',
};

interface PageProps {
    params: {
        code: string;
    };
}

export default function ReferralStartPage({ params }: PageProps) {
    return <StartLandingClient referralCode={params.code} />;
}
