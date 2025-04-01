"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/utils/apiClient';

type PatientSummary = {
  id: string;
  name: string;
};

export default function AddObservationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = params.id as string;
  const returnTo = searchParams.get('return') || 'detail';
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [patient, setPatient] = useState<PatientSummary | null>(null);
  
  const [formData, setFormData] = useState({
    observation_code: "",
    observation_name: "",
    value: "",
    unit: "",
    reference_range: "",
    status: "final",
    observation_date: new Date().toISOString().slice(0, 16), // Default to current date/time in format YYYY-MM-DDTHH:MM
  });

  // Fetch patient info
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      
      try {
        // Fetch patient basic details
        const patientData = await apiClient.getPatientById(patientId);
        
        setPatient({
          id: patientData.id.toString(),
          name: patientData.name,
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching patient data:", err);
        setError("Failed to load patient data");
        setLoading(false);
      }
    }
    
    fetchData();
  }, [patientId]);

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    
    try {
      // Validate form
      if (!formData.observation_code) {
        throw new Error("Please enter an observation code");
      }
      
      if (!formData.observation_name) {
        throw new Error("Please enter an observation name");
      }
      
      if (!formData.value) {
        throw new Error("Please enter a value for the observation");
      }
      
      // Create observation using our API client
      const observationData = {
        ...formData,
        patient_id: parseInt(patientId),
      };
      
      const result = await apiClient.createObservation(observationData);
      
      setSuccess(true);
      
      // Redirect back to patient detail page with refresh parameter
      setTimeout(() => {
        router.push(`/dashboard/patients/${patientId}?refresh=true`);
      }, 1500);
      
    } catch (err: any) {
      console.error("Error submitting observation:", err);
      setError(err.message || 'Failed to create observation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">Loading patient data...</p>
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <p>{error}</p>
        <div className="mt-3">
          <button
            onClick={() => router.push("/dashboard/patients")}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Return to Patient List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Add Observation
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            For patient: {patient?.name}
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href={`/dashboard/patients/${patientId}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Patient
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
          <p>Observation added successfully! Redirecting back to patient record...</p>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Observation Details</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Record a new clinical observation for this patient
          </p>
        </div>
        <div className="border-t border-gray-200">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Observation Code */}
              <div className="sm:col-span-3">
                <label htmlFor="observation_code" className="block text-sm font-medium text-gray-700">
                  Observation Code*
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="observation_code"
                    id="observation_code"
                    value={formData.observation_code}
                    onChange={handleInputChange}
                    placeholder="e.g., 8480-6 (for Systolic BP)"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Standard code for the observation (e.g., LOINC code)
                </p>
              </div>

              {/* Observation Name */}
              <div className="sm:col-span-3">
                <label htmlFor="observation_name" className="block text-sm font-medium text-gray-700">
                  Observation Name*
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="observation_name"
                    id="observation_name"
                    value={formData.observation_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Systolic blood pressure"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              {/* Value */}
              <div className="sm:col-span-2">
                <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                  Value*
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="value"
                    id="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    placeholder="e.g., 120"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              {/* Unit */}
              <div className="sm:col-span-2">
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                  Unit
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="unit"
                    id="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    placeholder="e.g., mm[Hg]"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* Reference Range */}
              <div className="sm:col-span-2">
                <label htmlFor="reference_range" className="block text-sm font-medium text-gray-700">
                  Reference Range
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="reference_range"
                    id="reference_range"
                    value={formData.reference_range}
                    onChange={handleInputChange}
                    placeholder="e.g., 90-120"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="sm:col-span-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="mt-1">
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="registered">Registered</option>
                    <option value="preliminary">Preliminary</option>
                    <option value="final">Final</option>
                    <option value="amended">Amended</option>
                    <option value="corrected">Corrected</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="entered-in-error">Entered in Error</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>

              {/* Date and Time */}
              <div className="sm:col-span-3">
                <label htmlFor="observation_date" className="block text-sm font-medium text-gray-700">
                  Observation Date and Time*
                </label>
                <div className="mt-1">
                  <input
                    type="datetime-local"
                    name="observation_date"
                    id="observation_date"
                    value={formData.observation_date}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Link
                href={`/dashboard/patients/${patientId}`}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || success}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  submitting || success 
                    ? "bg-indigo-400 cursor-not-allowed" 
                    : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                }`}
              >
                {submitting ? "Saving..." : "Save Observation"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}