"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import apiClient from "@/utils/apiClient";

type PatientDetail = {
  id: string;
  name: string;
  gender: string;
  birthDate: string;
  fhir_id?: string;
  sync_status?: string;
  synced_at?: string;
};

type Observation = {
  id: string;
  date: string;
  name: string;
  value: string;
  unit?: string;
};

type Condition = {
  id: string;
  name: string;
  onsetDate: string;
  status: string;
  category?: string;
};

type Procedure = {
  id: string;
  name: string;
  performedDate: string;
  status: string;
  bodySite?: string;
  notes?: string;
};

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [activeTab, setActiveTab] = useState<"observations" | "conditions" | "procedures">("observations");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const shouldRefresh = searchParams.get("refresh") === "true";
    if (shouldRefresh) {
      console.log("Detected refresh=true parameter. Triggering data refresh.");
      const url = new URL(window.location.href);
      url.searchParams.delete("refresh");
      window.history.replaceState({}, "", url.toString());
      setRefreshKey((prev) => prev + 1);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchPatientData() {
      setLoading(true);
      setError("");
      try {
        // Get patient data using our API client
        const patientData = await apiClient.getPatientById(patientId);
        
        setPatient({
          id: patientData.id.toString(),
          name: patientData.name,
          gender: patientData.gender || "unknown",
          birthDate: patientData.birth_date || "Unknown",
          fhir_id: patientData.fhir_id,
          sync_status: patientData.sync_status,
          synced_at: patientData.synced_at,
        });

        // Get conditions for this patient
        try {
          const conditionsData = await apiClient.getConditions(patientId);
          
          if (conditionsData && Array.isArray(conditionsData)) {
            const formattedConditions = conditionsData.map(condition => ({
              id: condition.id.toString(),
              name: condition.condition_code,
              onsetDate: new Date(condition.onset_date).toLocaleDateString(),
              status: condition.status,
            }));
            
            setConditions(formattedConditions);
          }
        } catch (condErr) {
          console.error("Error fetching conditions:", condErr);
          // Don't fail the whole page load if conditions fail
        }

        // Get observations for this patient
        try {
          const observationsData = await apiClient.getObservations(patientId);
          
          if (observationsData && Array.isArray(observationsData)) {
            const formattedObservations = observationsData.map(observation => ({
              id: observation.id.toString(),
              date: new Date(observation.observation_date).toLocaleDateString(),
              name: observation.observation_name,
              value: observation.value,
              unit: observation.unit || "",
            }));
            
            setObservations(formattedObservations);
          }
        } catch (obsErr) {
          console.error("Error fetching observations:", obsErr);
          // Don't fail the whole page load if observations fail
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching patient data:", err);
        setError(err.message || "Failed to load patient data");
        setLoading(false);
      }
    }
    
    if (patientId) {
      fetchPatientData();
    }
  }, [patientId, refreshKey]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">Loading patient data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
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

  if (!patient) {
    return (
      <div
        className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <p>Patient not found</p>
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
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {patient.name}
          </h2>
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span className="mr-1.5">DOB:</span>
              <span className="font-medium">{patient.birthDate}</span>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span className="mr-1.5">Gender:</span>
              <span className="font-medium capitalize">{patient.gender}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => setRefreshKey((prev) => prev + 1)}
            className="mr-2 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg
              className="h-4 w-4 mr-1"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
          <Link
            href="/dashboard/patients"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Patients
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Patient Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Brain Cancer Registry Patient Details</p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.name}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Gender</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">
                {patient.gender}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.birthDate}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">HAPI-FHIR Sync Status</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">FHIR Server Synchronization Information</p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">FHIR ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {patient.fhir_id || "Not synced"}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Sync Status</dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2">
                {patient.sync_status ? (
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${patient.sync_status === 'success' ? 'bg-green-100 text-green-800' : 
                        patient.sync_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        patient.sync_status === 'failed' ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800'}`
                    }
                  >
                    {patient.sync_status}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">Not synced</span>
                )}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Last Synced</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {patient.synced_at ? new Date(patient.synced_at).toLocaleString() : "Never"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Clinical Data</h3>

            <div className="flex space-x-1 rounded-lg p-0.5 bg-gray-100">
              <button
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  activeTab === "observations"
                    ? "bg-white shadow"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("observations")}
              >
                Observations
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  activeTab === "conditions"
                    ? "bg-white shadow"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("conditions")}
              >
                Conditions
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  activeTab === "procedures"
                    ? "bg-white shadow"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("procedures")}
              >
                Procedures
              </button>
            </div>
          </div>
        </div>

        {activeTab === "observations" && (
          <div className="border-t border-gray-200">
            <div className="flex justify-end p-4">
              <Link
                href={`/dashboard/patients/${patientId}/observations/add?return=detail`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Observation
              </Link>
            </div>
            {observations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Observation
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {observations.map((obs) => (
                      <tr key={obs.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {obs.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {obs.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {obs.value} {obs.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No observations found for this patient
              </div>
            )}
          </div>
        )}

        {activeTab === "conditions" && (
          <div className="border-t border-gray-200">
            <div className="flex justify-end p-4">
              <Link
                href={`/dashboard/patients/${patientId}/conditions/add?return=detail`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Condition
              </Link>
            </div>
            {conditions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Condition
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Onset Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {conditions.map((condition) => (
                      <tr key={condition.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {condition.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {condition.onsetDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {condition.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No conditions found for this patient
              </div>
            )}
          </div>
        )}

        {activeTab === "procedures" && (
          <div className="border-t border-gray-200">
            <div className="flex justify-end p-4">
              <Link
                href={`/dashboard/patients/${patientId}/procedures/add?return=detail`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Procedure
              </Link>
            </div>
            {procedures.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Procedure
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Body Site
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {procedures.map((procedure) => (
                      <tr key={procedure.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {procedure.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {procedure.performedDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {procedure.status}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {procedure.bodySite || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {procedure.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No procedures found for this patient
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}