import { Suspense } from 'react';
import CompassContent from './compassContent';

export default function CompassPage() {
  return (
    <Suspense>
      <CompassContent />
    </Suspense>
  );
}
