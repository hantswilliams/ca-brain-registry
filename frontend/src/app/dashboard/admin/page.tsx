"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import apiClient from "@/utils/apiClient";

const FHIR_RESOURCES = [
  'Patient',
  'Observation',
  'Condition',
  'Procedure',
  'MedicationRequest',
  'CarePlan',
  'Encounter',
  'DiagnosticReport',
  'DocumentReference',
  'Immunization',
  'AllergyIntolerance',
  'MedicationStatement',
  'FamilyMemberHistory',
  'Goal',
  'CareTeam',
  'Organization',
  'Practitioner',
  'Location',
  'Device',
  'DeviceUseStatement'
];

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [patientCount, setPatientCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // FHIR Query states
  const [fhirResource, setFhirResource] = useState('Patient');
  const [fhirQuery, setFhirQuery] = useState('');
  const [fhirFormat, setFhirFormat] = useState('json');
  const [fhirResult, setFhirResult] = useState<any>(null);
  const [fhirError, setFhirError] = useState<string | null>(null);
  const [fhirLoading, setFhirLoading] = useState(false);
  
  // Check if user has admin role
  const hasAdminRole = () => {
    if (!user || !user.roles) return false;
    
    if (Array.isArray(user.roles)) {
      return user.roles.includes("admin") || 
        user.roles.some((role: string | { name: string }) => 
          (typeof role === 'object' && role.name === "admin") || 
          (typeof role === 'string' && role === "admin")
        );
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

  const handleFhirQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setFhirLoading(true);
    setFhirError(null);
    setFhirResult(null);

    try {
      const baseUrl = 'http://localhost:8091/fhir';
      const url = `${baseUrl}/${fhirResource}${fhirQuery ? '?' + fhirQuery : ''}`;
      const response = await fetch(url, {
        headers: {
          'Accept': fhirFormat === 'json' ? 'application/fhir+json' : 'application/fhir+xml',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFhirResult(data);
    } catch (error) {
      setFhirError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setFhirLoading(false);
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

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          FHIR Query Interface
        </h3>
        <form onSubmit={handleFhirQuery} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resource Type
            </label>
            <select
              value={fhirResource}
              onChange={(e) => setFhirResource(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={fhirLoading}
            >
              {FHIR_RESOURCES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Query Parameters (optional)
            </label>
            <input
              type="text"
              value={fhirQuery}
              onChange={(e) => setFhirQuery(e.target.value)}
              placeholder="e.g., _count=10&_sort=-_lastUpdated"
              className="w-full p-2 border rounded-md"
              disabled={fhirLoading}
            />
            <p className="mt-1 text-sm text-gray-500">
              Use standard FHIR search parameters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Response Format
            </label>
            <select
              value={fhirFormat}
              onChange={(e) => setFhirFormat(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={fhirLoading}
            >
              <option value="json">JSON</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={fhirLoading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              fhirLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {fhirLoading ? 'Querying...' : 'Execute Query'}
          </button>
        </form>

        {fhirError && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">
            {fhirError}
          </div>
        )}

        {fhirResult && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Query Results:</h4>
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 h-6 bg-gray-800 rounded-t-md flex items-center px-3">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-auto max-h-96 font-mono text-sm mt-6 border border-gray-700">
                {JSON.stringify(fhirResult, null, 2)}
              </pre>
            </div>
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
                  FHIR Server URL
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  http://localhost:8091/fhir
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