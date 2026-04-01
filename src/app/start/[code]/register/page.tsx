import WizardContainer from '@/components/start/WizardContainer';

export const metadata = {
    title: 'Create Your Store | Compass 🧭',
    description: 'Start your business in minutes.',
};

interface PageProps {
    params: {
        code: string;
    };
}

export default function RegisterPage({ params }: PageProps) {
    return <WizardContainer referralCode={params.code} />;
}
