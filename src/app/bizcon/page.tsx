import { Suspense } from 'react';
import compassContent from './compassContent';

export default function compassPage() {
  return (
    <Suspense>
      <compassContent />
    </Suspense>
  );
}
