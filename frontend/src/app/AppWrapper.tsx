import { AuthProvider } from '@/context/AuthContext';
import { ReactNode } from 'react';

interface AppWrapperProps {
  children: ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}