"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from "@/utils/apiClient";

type PatientSummary = {
  id: string;
  name: string;
};

type ConditionType = {
  code: string;
  display: string;
  system?: string;
  description?: string;
  active?: boolean;
};

export default function AddConditionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [conditionTypes, setConditionTypes] = useState<ConditionType[]>([]);
  const [statuses, setStatuses] = useState<ConditionType[]>([]);
  
  const [formData, setFormData] = useState({
    conditionType: "",
    status: "active",
    onsetDate: new Date().toISOString().split('T')[0], // Default to today
  });

  // Fetch condition types and patient info
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      
      try {
        // Fetch neurological condition types
        const conditionsData = await apiClient.getNeurologicalConditions();
        if (conditionsData) {
          setConditionTypes(conditionsData);
        }
        
        // Fetch condition statuses
        const statusesData = await apiClient.getConditionStatuses();
        if (statusesData) {
          setStatuses(statusesData);
        }
        
        // Fetch patient basic details
        const patientData = await apiClient.getPatientById(patientId);
        
        // Extract name 
        const patientName = patientData.name || 'Unknown';
        
        setPatient({
          id: patientData.id.toString(),
          name: patientName
        });
        
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load required data");
        setLoading(false);
      }
    }
    
    fetchData();
  }, [patientId]);

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      if (!formData.conditionType) {
        throw new Error("Please select a condition type");
      }
      
      // Prepare condition data
      const conditionData = {
        condition_code: formData.conditionType,
        onset_date: formData.onsetDate,
        status: formData.status,
        patient_id: parseInt(patientId)
      };
      
      // Submit to API using our client
      await apiClient.createCondition(conditionData);
      
      setSuccess(true);
      
      // Immediately redirect to patient detail with refresh parameter
      router.push(`/dashboard/patients/${patientId}?refresh=true`);
      
    } catch (err: any) {
      console.error("Error submitting condition:", err);
      setError(err.message || 'Failed to create condition. Please try again.');
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
            Add Condition
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
          <p>Condition added successfully! Redirecting back to patient record...</p>
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Condition Details</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Record a new medical condition for this patient
          </p>
        </div>
        <div className="border-t border-gray-200">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Condition Type */}
              <div className="sm:col-span-3">
                <label htmlFor="conditionType" className="block text-sm font-medium text-gray-700">
                  Condition Type*
                </label>
                <div className="mt-1">
                  <select
                    id="conditionType"
                    name="conditionType"
                    value={formData.conditionType}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select a condition</option>
                    {conditionTypes.map(cond => (
                      <option key={cond.code} value={cond.code}>
                        {cond.display}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Clinical Status */}
              <div className="sm:col-span-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Clinical Status*
                </label>
                <div className="mt-1">
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  >
                    {statuses.length > 0 ? (
                      statuses.map(status => (
                        <option key={status.code} value={status.code}>
                          {status.display}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="resolved">Resolved</option>
                        <option value="unknown">Unknown</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              
              {/* Onset Date */}
              <div className="sm:col-span-3">
                <label htmlFor="onsetDate" className="block text-sm font-medium text-gray-700">
                  Onset Date*
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="onsetDate"
                    id="onsetDate"
                    value={formData.onsetDate}
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
                {submitting ? "Saving..." : "Save Condition"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}