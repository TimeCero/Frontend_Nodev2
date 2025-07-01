'use client';
import { Suspense } from 'react';
import AuthSuccessPage from './AuthSuccessPage';

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando autenticación...</div>}>
      <AuthSuccessPage />
    </Suspense>
  );
}
