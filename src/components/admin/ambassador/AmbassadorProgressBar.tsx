'use client';
import { FC } from 'react';
import { Trophy } from 'lucide-react';

interface AmbassadorProgressBarProps {
  ambassadorTier: string;
  activeReferrals: number;
}

const TIERS = {
  bronze: { name: 'Bronze', next: 'Silver', goal: 5, color: '#cd7f32' },
  silver: { name: 'Silver', next: 'Gold', goal: 15, color: '#c0c0c0' },
  gold: { name: 'Gold', next: 'Platinum', goal: 20, color: '#ffd700' },
  platinum: { name: 'Platinum', next: null, goal: Infinity, color: '#e5e4e2' },
};

const AmbassadorProgressBar: FC<AmbassadorProgressBarProps> = ({ ambassadorTier, activeReferrals }) => {
  const tierKey = ambassadorTier.toLowerCase() as keyof typeof TIERS;
  const currentTier = TIERS[tierKey] || TIERS.bronze;
  const nextTier = currentTier.next ? TIERS[currentTier.next.toLowerCase() as keyof typeof TIERS] : null;

  const progressPercentage = nextTier 
    ? Math.min((activeReferrals / nextTier.goal) * 100, 100) 
    : 100;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Your Ambassador Tier</h3>
        <span 
          className="font-bold py-1 px-3 rounded-full text-sm capitalize"
          style={{ backgroundColor: currentTier.color, color: '#333' }}
        >
          {currentTier.name}
        </span>
      </div>
      
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-2">
        <div 
          className="h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%`, backgroundColor: currentTier.color }}
        ></div>
      </div>

      <div className="text-center text-sm text-slate-600 dark:text-slate-300">
        {nextTier ? (
          <p>You have <span className="font-bold text-slate-800 dark:text-white">{activeReferrals}</span> active referrals. Refer <span className="font-bold text-orange-500">{nextTier.goal - activeReferrals}</span> more to reach <span className="font-bold" style={{color: nextTier.color}}>{nextTier.name}</span>!</p>
        ) : (
          <div className="flex items-center justify-center font-bold" style={{color: currentTier.color}}>
            <Trophy className="w-5 h-5 mr-2"/>
            <p>Congratulations! You've reached the highest tier!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AmbassadorProgressBar;
