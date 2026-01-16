'use client';
import { useState, useEffect } from 'react';
import { Gift, Loader2, ServerCrash, Users, ChevronDown, ChevronUp, Copy, Store } from 'lucide-react';
import { collection, query, getDocs, orderBy, collectionGroup } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ReferralItem {
  id: string;
  businessName: string;
  ceoName?: string;
  code: string; // referralCode OR referrerStoreId
  source: 'url' | 'ambassador';
  createdAt: any;
  status?: string;
}

interface ReferralGroup {
  code: string;
  count: number;
  items: ReferralItem[];
  source: 'url' | 'ambassador' | 'mixed';
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
      // 1. Fetch URL Referrals (from registrations collection)
      const registrationsQuery = query(
        collection(db, 'registrations'),
        orderBy('createdAt', 'desc')
      );
      const regSnapshot = await getDocs(registrationsQuery);
      const urlReferrals: ReferralItem[] = regSnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            businessName: data.businessName,
            ceoName: data.ceoName,
            code: data.referralCode,
            source: 'url',
            createdAt: data.createdAt,
            status: data.status
          } as ReferralItem;
        })
        .filter(r => r.code && r.code.trim() !== '' && (r.status === 'active' || r.status === 'trial' || r.status === 'completed'));

      // 2. Fetch Ambassador Referrals (from referrals subcollections via collectionGroup)
      const ambassadorQuery = query(
        collectionGroup(db, 'referrals'),
        orderBy('createdAt', 'desc')
      );
      const ambSnapshot = await getDocs(ambassadorQuery);
      const ambassadorReferrals: ReferralItem[] = ambSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          businessName: data.businessName,
          ceoName: 'N/A', // Ambassador referrals might not have CEO name initially
          code: data.referrerStoreId, // The store that referred them
          source: 'ambassador',
          createdAt: data.createdAt,
          status: data.status
        } as ReferralItem;
      });

      // 3. Merge and Group
      const allReferrals = [...urlReferrals, ...ambassadorReferrals];
      const groups: Record<string, ReferralItem[]> = {};

      allReferrals.forEach(ref => {
        const code = ref.code?.toLowerCase() || 'unknown';
        if (!groups[code]) {
          groups[code] = [];
        }
        groups[code].push(ref);
      });

      // 4. Convert to array and sort
      const groupArray: ReferralGroup[] = Object.keys(groups).map(code => {
        const items = groups[code];
        // Determine source type for the group
        const hasUrl = items.some(i => i.source === 'url');
        const hasAmb = items.some(i => i.source === 'ambassador');
        const source = (hasUrl && hasAmb ? 'mixed' : hasUrl ? 'url' : 'ambassador') as 'url' | 'ambassador' | 'mixed';

        return {
          code,
          count: items.length,
          items,
          source
        };
      }).sort((a, b) => b.count - a.count);

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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold uppercase ${group.source === 'ambassador' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                    {group.source === 'ambassador' ? <Store className="w-5 h-5" /> : group.code.substring(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-lg uppercase tracking-wide">{group.code}</h3>
                      {group.source === 'ambassador' && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/30 uppercase font-bold">Ambassador</span>
                      )}
                    </div>
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
                        <th className="px-4 py-3">Source</th>
                        <th className="px-4 py-3 rounded-r-lg">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((biz) => (
                        <tr key={biz.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                          <td className="px-4 py-3 font-medium text-white">{biz.businessName}</td>
                          <td className="px-4 py-3 text-slate-400">{biz.ceoName || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${biz.source === 'ambassador'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              }`}>
                              {biz.source === 'ambassador' ? 'Ambassador' : 'Link'}
                            </span>
                          </td>
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
