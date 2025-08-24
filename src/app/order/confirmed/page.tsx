import React from 'react';
import ConfirmationClient from './ConfirmationClient';

export default function ConfirmationPage() {
  return (
    <React.Suspense fallback={null}>
      <ConfirmationClient />
    </React.Suspense>
  );
}
