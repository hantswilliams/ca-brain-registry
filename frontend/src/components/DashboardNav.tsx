"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // Debug user object
  console.log("User object in DashboardNav:", user);
  
  // Safely check if user has admin role
  const hasAdminRole = () => {
    if (!user || !user.roles) return false;
    
    // Handle different possible structures of roles
    if (Array.isArray(user.roles)) {
      return user.roles.includes("admin") || user.roles.some(role => 
        typeof role === 'object' && (role.name === "admin" || role === "admin")
      );
    } else if (typeof user.roles === 'object') {
      return Object.values(user.roles).includes("admin");
    }
    return false;
  };
  
  // Safely get the first role as string for display
  const getRoleDisplay = () => {
    if (!user || !user.roles) return null;
    
    if (Array.isArray(user.roles) && user.roles.length > 0) {
      const firstRole = user.roles[0];
      return typeof firstRole === 'string' 
        ? firstRole 
        : (firstRole.name || firstRole.toString());
    } else if (typeof user.roles === 'object') {
      const roleValues = Object.values(user.roles);
      return roleValues.length > 0 ? roleValues[0].toString() : null;
    }
    return null;
  };
  
  const handleSignOut = () => {
    logout();
    router.push("/");
  };
  
  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex-shrink-0 flex items-center gap-2 hover:opacity-90">
              <Image 
                src="/brain-color.png" 
                alt="Cancer Brain Registry Logo" 
                width={32} 
                height={32}
                className="rounded-sm"
              />
              <h1 className="text-xl font-bold">Cancer Brain Registry</h1>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === "/dashboard"
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/patients"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === "/dashboard/patients"
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  Patients
                </Link>
                <Link
                  href="/dashboard/upload"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === "/dashboard/upload"
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  Upload Data
                </Link>
                {hasAdminRole() && (
                  <Link
                    href="/dashboard/admin"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === "/dashboard/admin"
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <div className="text-sm text-gray-300 mr-4">
                {user?.username || user?.email || "User"}
                {getRoleDisplay() && (
                  <span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded">
                    {getRoleDisplay()}
                  </span>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="bg-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}