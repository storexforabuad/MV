import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Media Dashboard — BizConNet',
    description: 'Super-admin analytics for all Media Influencer stores. Track escrow, platform cuts, and revenue per influencer.',
};

export default function MediaDashboardLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
