import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Start Your Creator Journey | Compass 🧭',
    description:
        'Turn your followers into a business. Compass 🧭 gives you the storefront and tools to sell services and physical products. Register today.',
    openGraph: {
        title: 'Start Your Creator Journey | Compass 🧭',
        description: 'Monetize your influence with Compass 🧭. Secure payments, professional storefront, zero admin.',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Start Your Creator Journey | Compass 🧭',
        description: 'Turn your followers into a business. Get paid professionally.',
    },
};

export default function NewMediaLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
