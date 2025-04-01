"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type PatientSummary = {
  id: string;
  name: string;
  mrn?: string;
};

type ProcedureType = {
  code: string;
  display: string;
  system: string;
};

export default function AddProcedurePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [procedureTypes, setProcedureTypes] = useState<ProcedureType[]>([]);
  
  const [formData, setFormData] = useState({
    procedureType: "",
    customProcedureName: "",
    customProcedureCode: "",
    status: "completed",
    performedDate: new Date().toISOString().split('T')[0],
    bodySite: "",
    notes: ""
  });

  // Derived values
  const showCustomProcedure = formData.procedureType === "custom";
  const selectedProcedureType = procedureTypes.find(p => p.code === formData.procedureType);
  const procedureName = showCustomProcedure 
    ? formData.customProcedureName 
    : selectedProcedureType?.display || "";

  // Fetch procedure types and patient info
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      
      try {
        // Fetch procedure types
        const procTypesResponse = await fetch('/api/valuesets/procedures');
        if (!procTypesResponse.ok) {
          throw new Error("Failed to load procedure types");
        }
        const procTypesData = await procTypesResponse.json();
        setProcedureTypes(procTypesData);
        
        // Fetch patient basic details
        const patientResponse = await fetch(`/api/fhir/Patient/${patientId}`);
        if (!patientResponse.ok) {
          throw new Error("Failed to load patient data");
        }
        const patientData = await patientResponse.json();
        
        // Extract name and MRN
        const name = patientData.name && patientData.name[0]
          ? `${patientData.name[0].given?.[0] || ''} ${patientData.name[0].family || ''}`
          : 'Unknown';
          
        // Extract MRN identifier if present
        const mrnIdentifier = patientData.identifier?.find((id: any) => 
          id.system?.includes('mrn') || id.type?.text?.toLowerCase().includes('mrn')
        );
        
        setPatient({
          id: patientData.id,
          name: name.trim(),
          mrn: mrnIdentifier?.value || 'N/A'
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load required data");
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
      if (!formData.procedureType) {
        throw new Error("Please select a procedure type");
      }
      
      if (formData.procedureType === "custom" && !formData.customProcedureName) {
        throw new Error("Please enter a name for the custom procedure");
      }
      
      // Prepare procedure code
      const procedureCode = formData.procedureType === "custom" 
        ? { 
            coding: [{ 
              system: "http://snomed.info/sct", 
              code: formData.customProcedureCode || "387713003", // Default to "surgical procedure"
              display: formData.customProcedureName
            }],
            text: formData.customProcedureName
          }
        : { 
            coding: [{ 
              system: selectedProcedureType?.system || "http://snomed.info/sct", 
              code: formData.procedureType,
              display: procedureName
            }],
            text: procedureName
          };
      
      // Create FHIR Procedure resource
      const procedureResource = {
        resourceType: "Procedure",
        subject: {
          reference: `Patient/${patientId}`,
          display: patient?.name
        },
        status: formData.status,
        code: procedureCode,
        performedDateTime: `${formData.performedDate}T00:00:00Z`,
        bodySite: formData.bodySite ? [{
          coding: [{
            system: "http://snomed.info/sct",
            code: "12738006", // Brain structure
            display: formData.bodySite
          }]
        }] : undefined,
        note: formData.notes ? [{ text: formData.notes }] : undefined
      };
      
      // Submit to FHIR server
      const response = await fetch('/api/fhir/Procedure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(procedureResource),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create procedure');
      }
      
      setSuccess(true);
      
      // Immediately redirect to patient detail with refresh parameter
      router.push(`/dashboard/patients/${patientId}?refresh=true`);
      
    } catch (err: any) {
      console.error("Error submitting procedure:", err);
      setError(err.message || 'Failed to create procedure. Please try again.');
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
            Add Procedure
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            For patient: {patient?.name} (MRN: {patient?.mrn})
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
          <p>Procedure added successfully! Redirecting back to patient record...</p>
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Procedure Details</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Record a medical procedure performed on this patient
          </p>
        </div>
        <div className="border-t border-gray-200">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Procedure Type */}
              <div className="sm:col-span-3">
                <label htmlFor="procedureType" className="block text-sm font-medium text-gray-700">
                  Procedure Type*
                </label>
                <div className="mt-1">
                  <select
                    id="procedureType"
                    name="procedureType"
                    value={formData.procedureType}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select a procedure</option>
                    {procedureTypes.map(proc => (
                      <option key={proc.code} value={proc.code}>
                        {proc.display}
                      </option>
                    ))}
                    <option value="custom">Custom Procedure</option>
                  </select>
                </div>
              </div>
              
              {/* Procedure Status */}
              <div className="sm:col-span-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status*
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
                    <option value="preparation">Preparation</option>
                    <option value="in-progress">In Progress</option>
                    <option value="not-done">Not Done</option>
                    <option value="on-hold">On Hold</option>
                    <option value="stopped">Stopped</option>
                    <option value="completed">Completed</option>
                    <option value="entered-in-error">Entered in Error</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>
              
              {/* Custom Procedure Name (conditional) */}
              {showCustomProcedure && (
                <>
                  <div className="sm:col-span-3">
                    <label htmlFor="customProcedureName" className="block text-sm font-medium text-gray-700">
                      Custom Procedure Name*
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="customProcedureName"
                        id="customProcedureName"
                        value={formData.customProcedureName}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required={showCustomProcedure}
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="customProcedureCode" className="block text-sm font-medium text-gray-700">
                      SNOMED Code (if known)
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="customProcedureCode"
                        id="customProcedureCode"
                        value={formData.customProcedureCode}
                        onChange={handleInputChange}
                        placeholder="e.g., 116004"
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </>
              )}
              
              {/* Performance Date */}
              <div className="sm:col-span-3">
                <label htmlFor="performedDate" className="block text-sm font-medium text-gray-700">
                  Date Performed*
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="performedDate"
                    id="performedDate"
                    value={formData.performedDate}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              
              {/* Body Site */}
              <div className="sm:col-span-3">
                <label htmlFor="bodySite" className="block text-sm font-medium text-gray-700">
                  Body Site
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="bodySite"
                    id="bodySite"
                    value={formData.bodySite}
                    onChange={handleInputChange}
                    placeholder="e.g., brain, left temporal lobe"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Anatomical location of the procedure</p>
              </div>
              
              {/* Notes */}
              <div className="sm:col-span-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Procedure Notes
                </label>
                <div className="mt-1">
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Additional details about the procedure..."
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
                {submitting ? "Saving..." : "Save Procedure"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}