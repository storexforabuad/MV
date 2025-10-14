'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const ReferralHandler = () => {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams) {
      const referralCode = searchParams.get('ref');
      if (referralCode) {
        localStorage.setItem('referrerId', referralCode);
      }
    }
  }, [searchParams]);

  return null;
};

export default ReferralHandler;
