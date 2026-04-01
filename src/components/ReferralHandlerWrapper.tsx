import { Suspense } from 'react';
import ReferralHandler from './ReferralHandler';

export default function ReferralHandlerWrapper() {
  return (
    <Suspense>
      <ReferralHandler />
    </Suspense>
  );
}
