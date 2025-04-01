"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/utils/apiClient";

// Define TypeScript interfaces for our form data
interface PatientFormData {
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
}

interface ValueSetOption {
  code: string;
  display: string;
  description?: string;
}

export default function AddPatientPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [genderOptions, setGenderOptions] = useState<ValueSetOption[]>([]);
  
  // Initialize form state
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: "",
    lastName: "",
    gender: "",
    birthDate: "",
  });

  // Helper to add debug information
  const addDebugInfo = (info: string) => {
    console.log("DEBUG:", info);
    setDebugInfo(prev => [...prev, `${new Date().toISOString().substr(11, 8)} - ${info}`]);
  };

  // Check authentication status
  useEffect(() => {
    addDebugInfo(`Auth status: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}. User: ${user ? 'Available' : 'None'}`);
    if (!isAuthenticated) {
      addDebugInfo("User is not authenticated. This will cause patient creation to fail.");
    }
  }, [isAuthenticated, user]);

  // Fetch our gender value set
  useEffect(() => {
    const fetchGenderOptions = async () => {
      try {
        addDebugInfo("Fetching gender options...");
        const data = await apiClient.getGenders();
        if (data) {
          addDebugInfo(`Received ${data.length} gender options`);
          setGenderOptions(data);
        }
      } catch (err: any) {
        console.error("Error fetching gender options:", err);
        addDebugInfo(`Error fetching gender options: ${err.message}`);
        setError("Failed to load form options");
      }
    };
    
    fetchGenderOptions();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      addDebugInfo("Starting patient submission...");
      
      // Check authentication status
      if (!isAuthenticated) {
        addDebugInfo("Warning: User not authenticated. Request may fail.");
      } else {
        addDebugInfo(`User authenticated as: ${user?.username || user?.email}`);
      }
      
      // Format data for Flask API
      const patientData = {
        name: `${formData.firstName} ${formData.lastName}`,
        gender: formData.gender,
        birth_date: formData.birthDate
      };
      
      addDebugInfo("Submitting patient to API...");
      
      // Submit to Flask API using our ApiClient
      const result = await apiClient.createPatient(patientData);
      
      addDebugInfo(`Success! Created patient with ID: ${result.id}`);
      setSuccess(true);
      
      // Modified redirect logic - send to patient list with refresh param
      setTimeout(() => {
        // Navigate back to the patient list with a refresh parameter
        router.push(`/dashboard/patients?refresh=true`);
      }, 1500);
    } catch (err: any) {
      console.error("Error creating patient:", err);
      addDebugInfo(`Error: ${err.message}`);
      setError(err.message || "Failed to create patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Add New Patient</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Success! </strong>
          <span className="block sm:inline">Patient created successfully. Redirecting...</span>
        </div>
      )}

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

      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-xl font-semibold mb-4">Patient Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-gray-700 text-sm font-bold mb-2">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-gray-700 text-sm font-bold mb-2">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-gray-700 text-sm font-bold mb-2">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">Select Gender</option>
              {genderOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.display}
                </option>
              ))}
            </select>
          </div>
          
          {/* Date of Birth */}
          <div>
            <label htmlFor="birthDate" className="block text-gray-700 text-sm font-bold mb-2">
              Date of Birth *
            </label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-8">
          <Link href="/dashboard/patients" 
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || success}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              (loading || success) && "opacity-50 cursor-not-allowed"
            }`}
          >
            {loading ? "Saving..." : "Add Patient"}
          </button>
        </div>
      </form>
    </div>
  );
}