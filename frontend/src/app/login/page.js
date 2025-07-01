'use client';
import { Suspense } from 'react';
import LoginPage from './LoginPage';

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando login...</div>}>
      <LoginPage />
    </Suspense>
  );
}
