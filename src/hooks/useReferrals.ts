
"use client";

import { useEffect, useState } from 'react';
import { useCustomer } from '@/context/CustomerContext';
import { db } from '@/lib/db';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface Referral {
  id: string;
  refereeName: string;
  productName: string;
  commissionEarned: number;
  orderDate: { toDate: () => Date };
}

export const useReferrals = () => {
  const { customer } = useCustomer();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReferrals = async () => {
    if (!customer) {
        setIsLoading(false);
        return;
    };

    setIsLoading(true);
    try {
      const referralsRef = collection(db, 'customers', customer.id, 'referrals');
      const q = query(referralsRef, orderBy('orderDate', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedReferrals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
      setReferrals(fetchedReferrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      toast.error("Couldn't load referral details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [customer]);

  return { referrals, isLoading, refetchReferrals: fetchReferrals };
};
