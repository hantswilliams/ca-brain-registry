"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import apiClient from "@/utils/apiClient";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [patientCount, setPatientCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Check if user has admin role
  const hasAdminRole = () => {
    if (!user || !user.roles) return false;
    
    if (Array.isArray(user.roles)) {
      return user.roles.includes("admin") || 
        user.roles.some(role => typeof role === 'object' && (role.name === "admin" || role === "admin"));
    } else if (typeof user.roles === 'object') {
      return Object.values(user.roles).includes("admin");
    }
    
    return false;
  };
  
  // If user is not admin, show access denied message
  if (!hasAdminRole()) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        <p>Access denied. Admin privileges required.</p>
      </div>
    );
  }
  
  const handleGenerateData = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // Use apiClient instead of direct fetch
      const data = await apiClient.post("/seed/generate-data", { patientCount });
      
      setResult({
        success: true,
        message: `Successfully generated ${data.patientsCreated} patients, ${data.observationsCreated} observations, and ${data.conditionsCreated} conditions.`,
      });
    } catch (error: any) {
      console.error("Error generating data:", error);
      setResult({
        success: false,
        message: error.message || "An error occurred during data generation",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Admin Dashboard
          </h2>
          <p className="mt-1 text-gray-500">
            Manage the Brain Cancer Registry system
          </p>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Generate Sample Data
        </h3>
        <p className="mb-4 text-gray-600">
          Generate sample brain cancer registry data for testing. This will create patients with brain cancer conditions and relevant observations.
        </p>
        <div className="mb-4">
          <label htmlFor="patientCount" className="block text-sm font-medium text-gray-700 mb-1">
            Number of patients to generate
          </label>
          <input
            type="number"
            id="patientCount"
            min="1"
            max="50"
            value={patientCount}
            onChange={(e) => setPatientCount(parseInt(e.target.value) || 10)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>
        <button
          onClick={handleGenerateData}
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Data"}
        </button>
        {result && (
          <div className={`mt-4 p-3 rounded ${result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            <p>{result.message}</p>
          </div>
        )}
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          System Information
        </h3>
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <tbody className="divide-y divide-gray-200 bg-white">
              <tr>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  API Server URL
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005"}
                </td>
              </tr>
              <tr>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  Environment
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {process.env.NODE_ENV}
                </td>
              </tr>
              <tr>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                  Current User
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {user?.username || user?.email} (Role: {Array.isArray(user?.roles) ? user?.roles[0]?.name || user?.roles[0] : 'admin'})
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}