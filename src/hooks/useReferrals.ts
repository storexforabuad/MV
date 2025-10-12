
"use client";

import { useEffect, useState, useCallback } from 'react';
import { db } from '@/lib/db';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface Referral {
  id: string;
  refereeName: string;
  productName: string;
  commissionEarned: number;
  orderDate: { toDate: () => Date };
}

export const useReferrals = (customerId: string | null, storeId: string) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReferrals = useCallback(async () => {
    if (!customerId || !storeId) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    try {
      const referralsRef = collection(db, 'customers', customerId, 'referrals');
      const q = query(
        referralsRef, 
        where('storeId', '==', storeId), 
        orderBy('orderDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedReferrals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
      setReferrals(fetchedReferrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      toast.error("Couldn't load referral details.");
    } finally {
      setIsLoading(false);
    }
  }, [customerId, storeId]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  return { referrals, isLoading, refetchReferrals: fetchReferrals };
};
