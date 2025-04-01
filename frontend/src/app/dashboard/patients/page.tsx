"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "../../../utils/apiClient";

type Patient = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  gender: string;
  birth_date: string;
  mrn?: string;
};

export default function PatientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<"name" | "mrn">("name");
  const [refreshKey, setRefreshKey] = useState(0); // Add a key to force refresh
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [shouldSearch, setShouldSearch] = useState(false);

  // Helper to add debug information
  const addDebugInfo = (info: string) => {
    console.log("DEBUG:", info);
    setDebugInfo(prev => [...prev, `${new Date().toISOString().substr(11, 8)} - ${info}`]);
  };

  // Check if we should auto-refresh (coming from add/new patient page)
  useEffect(() => {
    const shouldRefresh = searchParams.get('refresh') === 'true';
    if (shouldRefresh) {
      addDebugInfo(`Detected refresh=true parameter. Triggering refresh.`);
      
      // Remove the refresh param from URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete('refresh');
      window.history.replaceState({}, '', url.toString());
      
      // Trigger a refresh by updating refreshKey
      setRefreshKey(prev => prev + 1);
    }
  }, [searchParams]);

  // Create a debounced search function to avoid too many requests
  const debouncedSearch = useCallback(
    // Debounce time: 500ms
    debounce((query: string, field: string) => {
      if (query.trim()) {
        fetchPatients(query.trim(), field);
      } else {
        fetchPatients(); // No query, fetch all patients
      }
      setShouldSearch(false);
    }, 500),
    []
  );

  // Trigger the debounced search when searchQuery changes or shouldSearch is true
  useEffect(() => {
    if (searchQuery.trim() || shouldSearch) {
      debouncedSearch(searchQuery, searchField);
    }
  }, [searchQuery, shouldSearch, searchField, debouncedSearch]);

  const fetchPatients = async (query?: string, field?: string) => {
    setLoading(true);
    setError("");
    setIsSearching(!!query);
    
    try {
      addDebugInfo(query 
        ? `Searching for patients with ${field} containing: ${query}` 
        : "Fetching all patients (no search query)");
      
      // Use apiClient to get patients, with search query if provided
      let data;
      if (query) {
        // Flask API search endpoint
        data = await apiClient.request(`/patients/search?${field}=${encodeURIComponent(query)}`);
      } else {
        // Get all patients
        data = await apiClient.getPatients();
      }
      
      addDebugInfo(`Patient data received. Total patients: ${data.length || 0}`);
      
      // Format the patients for display
      setPatients(data);
      
      // Log some recent patients for debugging
      if (data.length > 0) {
        const recentPatients = data.slice(-3); // Last 3 patients
        recentPatients.forEach((patient: any, idx: number) => {
          addDebugInfo(`${query ? 'Search result' : 'Recent patient'} ${idx+1}: ${patient.name} (ID: ${patient.id}, MRN: ${patient.mrn})`);
        });
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching patients:", err);
      addDebugInfo(`Error fetching patients: ${err.message}`);
      setError("Failed to load patients");
      setLoading(false);
    }
  };

  // Fetch all patients when the component mounts or refreshKey changes
  useEffect(() => {
    addDebugInfo(`Initial load or refresh triggered (key: ${refreshKey})`);
    fetchPatients();
  }, [refreshKey]);

  const handleRefresh = () => {
    addDebugInfo("Manual refresh requested");
    setRefreshKey(prev => prev + 1); // Increment to trigger useEffect
    setSearchQuery(""); // Clear search on manual refresh
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShouldSearch(true);
  };

  const handleSearchFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchField(e.target.value as "name" | "mrn");
    // Only trigger a search if there's already a query
    if (searchQuery.trim()) {
      setShouldSearch(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShouldSearch(true);
    }
  };

  if (loading && !isSearching) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">Loading patients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <p>{error}</p>
        <button 
          onClick={handleRefresh}
          className="mt-2 px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Brain Cancer Registry Patients
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <Link 
            href="/dashboard/patients/add"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Patient
          </Link>
          <Link 
            href="/dashboard/upload"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Upload Patient Data
          </Link>
        </div>
      </div>

      <div className="mt-4 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="w-full sm:w-1/4">
            <label htmlFor="searchField" className="block text-sm font-medium text-gray-700 mb-1">Search by</label>
            <select
              id="searchField"
              name="searchField"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={searchField}
              onChange={handleSearchFieldChange}
            >
              <option value="name">Name</option>
              <option value="mrn">MRN</option>
            </select>
          </div>
          
          <div className="w-full sm:w-3/4">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search patients</label>
            <div className="relative flex">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="search"
                name="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-l-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={`Search by ${searchField}`}
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Search
              </button>
            </div>
            {isSearching && loading && (
              <div className="mt-2 text-sm text-gray-500 flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </div>
            )}
          </div>
        </form>
      </div>
      
      {/* Debug information collapsible section */}
      <div className="mb-6 border border-gray-200 rounded-md overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <details>
            <summary className="text-sm font-medium text-gray-700 cursor-pointer">
              Debug Information ({debugInfo.length} entries)
            </summary>
            <div className="mt-2 bg-gray-100 p-2 rounded text-xs font-mono overflow-auto max-h-60">
              {debugInfo.map((info, idx) => (
                <div key={idx} className="mb-1">{info}</div>
              ))}
              {debugInfo.length === 0 && <div>No debug information available</div>}
            </div>
          </details>
        </div>
      </div>
      
      {patients.length > 0 ? (
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        MRN
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gender
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Birth Date
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">View</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patients.map((patient) => (
                      <tr key={patient.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{patient.mrn}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 capitalize">{patient.gender}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{patient.birth_date}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link href={`/dashboard/patients/${patient.id}`} className="text-indigo-600 hover:text-indigo-900">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 text-center rounded shadow">
          {searchQuery ? (
            <p>No patients match your search criteria.</p>
          ) : (
            <div>
              <p>No patients found in the registry.</p>
              <button 
                onClick={handleRefresh}
                className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Utility function for debouncing
function debounce<F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
): (...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<F>): void => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
}