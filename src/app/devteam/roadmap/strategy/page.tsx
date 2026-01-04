import StrategyDashboard from '@/components/admin/StrategyDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Strategy & Hiring | Roadmap',
    description: 'The Scaling Playbook for 10,000 vendors.',
};

export default function StrategyPage() {
    return <StrategyDashboard />;
}
