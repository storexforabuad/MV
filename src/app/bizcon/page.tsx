import { Suspense } from 'react';
import BizconContent from './BizconContent';

export default function BizconPage() {
  return (
    <Suspense>
      <BizconContent />
    </Suspense>
  );
}