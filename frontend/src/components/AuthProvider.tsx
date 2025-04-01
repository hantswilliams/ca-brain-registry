"use client";
import { AuthProvider as CustomAuthProvider } from "@/context/AuthContext";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <CustomAuthProvider>{children}</CustomAuthProvider>;
}