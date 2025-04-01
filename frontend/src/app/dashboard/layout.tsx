"use client";
import { redirect } from "next/navigation";
import Image from "next/image";
import DashboardNav from "@/components/DashboardNav";
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAuthenticated } = useAuth();
  
  // Check authentication status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    redirect("/auth/signin");
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <DashboardNav />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 flex-grow w-full">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Image 
                src="/brain-color.png" 
                alt="Cancer Brain Registry Logo" 
                width={24} 
                height={24}
                className="rounded-sm"
              />
              <span className="text-sm font-medium">Cancer Brain Registry</span>
            </div>
            
            <div className="text-xs text-gray-400 text-center md:text-left">
              <p>A FHIR-based registry for brain cancer research data</p>
              <p>For research purposes only. Not for clinical use.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Sponsored by University of Virginia</span>
              <Image 
                src="/uva_logo.png" 
                alt="UVA Logo" 
                width={18} 
                height={18}
                className="object-contain"
              />
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-500 mt-4">
            <p>© {new Date().getFullYear()} Cancer Brain Registry | <a href="/" className="hover:text-white">Home</a> | <a href="/docs" className="hover:text-white">Documentation</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}