"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToAddPatient() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/dashboard/patients/add');
  }, [router]);
  
  return (
    <div className="container mx-auto py-6">
      <p>Redirecting to patient form...</p>
    </div>
  );
}