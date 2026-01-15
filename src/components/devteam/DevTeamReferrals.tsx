'use client';
import { useState, useEffect, useMemo } from 'react';
import { Gift, Loader2, ServerCrash, Users, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Registration {
  id: string;
  businessName: string;
  ceoName: string;
  referralCode?: string;
  status: string;
  createdAt: any;
}

interface ReferralGroup {
  code: string;
  count: number;
  businesses: Registration[];
}

const DevTeamReferrals: React.FC = () => {
  const [referralGroups, setReferralGroups] = useState<ReferralGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const fetchReferrals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all registrations that have a referral code
      // Note: Firestore doesn't support "where field exists" easily in client SDK without a specific value check or order by
      // So we'll fetch all non-pending registrations and filter client-side for now, or use a composite index if needed.
      // For simplicity and since volume might not be huge yet, fetching all active/trial registrations is okay.

      const q = query(
        collection(db, 'registrations'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const allRegs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration));

      // Filter for those with referral codes and valid status
      const validRegs = allRegs.filter(r =>
        r.referralCode &&
        r.referralCode.trim() !== '' &&
        (r.status === 'active' || r.status === 'trial' || r.status === 'completed')
      );

      // Group by referral code
      const groups: Record<string, Registration[]> = {};
      validRegs.forEach(reg => {
        const code = reg.referralCode!.toLowerCase(); // Normalize code
        if (!groups[code]) {
          groups[code] = [];
        }
        groups[code].push(reg);
      });

      // Convert to array and sort by count
      const groupArray: ReferralGroup[] = Object.keys(groups).map(code => ({
        code,
        count: groups[code].length,
        businesses: groups[code]
      })).sort((a, b) => b.count - a.count);

      setReferralGroups(groupArray);
    } catch (err) {
      console.error("Error fetching referrals:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const toggleExpand = (code: string) => {
    setExpandedCode(expandedCode === code ? null : code);
  };

  const copyLink = (code: string) => {
    const url = `https://ladevida.vercel.app/register/${code}`;
    navigator.clipboard.writeText(url);
    alert(`Copied: ${url}`);
  };

  return (
    <div className="bg-slate-900 shadow-lg rounded-2xl p-6 border border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Gift className="w-6 h-6 text-emerald-500 mr-3" />
          <h2 className="text-xl font-bold text-white">Referral Tracking</h2>
        </div>
        <button
          onClick={fetchReferrals}
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : error ? (
        <div className="text-center p-8 rounded-lg bg-red-900/10 border border-red-900/30">
          <ServerCrash className="mx-auto h-10 w-10 text-red-500 mb-2" />
          <p className="font-semibold text-red-400">Error Loading Referrals</p>
          <p className="text-sm text-red-400/80">{error}</p>
        </div>
      ) : referralGroups.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No referrals found yet.</p>
          <p className="text-sm mt-2">Share links like <code className="bg-slate-800 px-2 py-1 rounded text-emerald-400">/register/yourname</code> to start tracking.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {referralGroups.map((group) => (
            <div key={group.code} className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
              <div
                onClick={() => toggleExpand(group.code)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold uppercase">
                    {group.code.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg uppercase tracking-wide">{group.code}</h3>
                    <p className="text-xs text-slate-400">{group.count} Referred Business{group.count !== 1 ? 'es' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyLink(group.code);
                    }}
                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                    title="Copy Link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {expandedCode === group.code ? (
                    <ChevronUp className="w-5 h-5 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  )}
                </div>
              </div>

              {expandedCode === group.code && (
                <div className="bg-slate-900/50 border-t border-slate-700 p-4">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-800/50">
                      <tr>
                        <th className="px-4 py-3 rounded-l-lg">Business Name</th>
                        <th className="px-4 py-3">CEO</th>
                        <th className="px-4 py-3 rounded-r-lg">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.businesses.map((biz) => (
                        <tr key={biz.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                          <td className="px-4 py-3 font-medium text-white">{biz.businessName}</td>
                          <td className="px-4 py-3 text-slate-400">{biz.ceoName}</td>
                          <td className="px-4 py-3 text-slate-500">
                            {biz.createdAt?.seconds ? new Date(biz.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DevTeamReferrals;
