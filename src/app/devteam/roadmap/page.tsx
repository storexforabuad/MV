import RoadmapDashboard from '@/components/admin/RoadmapDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '2026 Scaling Roadmap | Admin',
    description: 'Track your path to 10,000 vendors.',
};

export default function RoadmapPage() {
    return <RoadmapDashboard />;
}
