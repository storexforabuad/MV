import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Join as an Influencer | Compass 🧭 — Get Paid. Professionally.',
    description:
        'Stop getting ghosted after the work is done. Compass 🧭 secures brand payments in Escrow before you press Record. Register your creator profile today.',
    openGraph: {
        title: 'Join as an Influencer | Compass 🧭',
        description:
            'Stop chasing payments. We hold the brand\'s money in Escrow before you start creating.',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Join as an Influencer | Compass 🧭',
        description: 'Stop chasing payments. Escrow-protected influencer commerce.',
    },
};

export default function MediaLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
