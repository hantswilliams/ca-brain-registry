"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import apiClient from "@/utils/apiClient";

export default function UploadPage() {
  const { user } = useAuth();
  const [patientFile, setPatientFile] = useState<File | null>(null);
  const [observationFile, setObservationFile] = useState<File | null>(null);
  const [conditionFile, setConditionFile] = useState<File | null>(null);
  const [procedureFile, setProcedureFile] = useState<File | null>(null);
  const [patientId, setPatientId] = useState("");
  const [uploadType, setUploadType] = useState<"patients" | "observations" | "conditions" | "procedures">("patients");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "patients" | "observations" | "conditions" | "procedures") => {
    if (e.target.files && e.target.files.length > 0) {
      if (type === "patients") {
        setPatientFile(e.target.files[0]);
      } else if (type === "observations") {
        setObservationFile(e.target.files[0]);
      } else if (type === "conditions") {
        setConditionFile(e.target.files[0]);
      } else if (type === "procedures") {
        setProcedureFile(e.target.files[0]);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Create form data for upload
      const formData = new FormData();

      if (uploadType === "patients" && patientFile) {
        formData.append("file", patientFile);

        // Use our apiClient instead of direct fetch
        try {
          const response = await apiClient.post("/upload/patients", formData, {
            "Content-Type": "multipart/form-data",
          });

          setResult({
            success: true,
            message: `Successfully uploaded ${response.patientsCreated || 0} patients`,
          });
        } catch (error: any) {
          setResult({
            success: false,
            message: error.message || "Failed to upload patients file",
          });
        }
      } else if (
        (uploadType === "observations" && observationFile) ||
        (uploadType === "conditions" && conditionFile) ||
        (uploadType === "procedures" && procedureFile)
      ) {
        if (!patientId) {
          setResult({
            success: false,
            message: `Patient ID is required for uploading ${uploadType}`,
          });
          setLoading(false);
          return;
        }

        let file;
        if (uploadType === "observations") {
          file = observationFile;
        } else if (uploadType === "conditions") {
          file = conditionFile;
        } else {
          file = procedureFile;
        }

        formData.append("file", file!);

        // Use our apiClient instead of direct fetch
        try {
          const response = await apiClient.post(`/upload/${uploadType}?patientId=${patientId}`, formData, {
            "Content-Type": "multipart/form-data",
          });

          setResult({
            success: true,
            message: `Successfully uploaded ${response.count || 0} ${uploadType} for patient ${patientId}`,
          });
        } catch (error: any) {
          setResult({
            success: false,
            message: error.message || `Failed to upload ${uploadType} file`,
          });
        }
      } else {
        setResult({
          success: false,
          message: "Please select a file to upload",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setResult({
        success: false,
        message: "An error occurred during the upload",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Upload Registry Data</h2>
          <p className="mt-1 text-gray-500">
            Upload patient data, clinical observations, medical conditions, or procedures to the brain cancer registry
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">Select upload type</label>
          <div className="flex flex-wrap space-x-4">
            <button
              type="button"
              onClick={() => setUploadType("patients")}
              className={`px-4 py-2 rounded-md mb-2 ${
                uploadType === "patients"
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                  : "bg-white border border-gray-300"
              }`}
            >
              Patient Data
            </button>
            <button
              type="button"
              onClick={() => setUploadType("observations")}
              className={`px-4 py-2 rounded-md mb-2 ${
                uploadType === "observations"
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                  : "bg-white border border-gray-300"
              }`}
            >
              Clinical Observations
            </button>
            <button
              type="button"
              onClick={() => setUploadType("conditions")}
              className={`px-4 py-2 rounded-md mb-2 ${
                uploadType === "conditions"
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                  : "bg-white border border-gray-300"
              }`}
            >
              Medical Conditions
            </button>
            <button
              type="button"
              onClick={() => setUploadType("procedures")}
              className={`px-4 py-2 rounded-md mb-2 ${
                uploadType === "procedures"
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                  : "bg-white border border-gray-300"
              }`}
            >
              Medical Procedures
            </button>
          </div>
        </div>

        <form onSubmit={handleUpload}>
          {uploadType === "patients" ? (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Patient Data CSV/Excel File</label>
                <Link
                  href="/templates/patient_template.csv"
                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                  download
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Template
                </Link>
              </div>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="patient-file"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="patient-file"
                        name="patient-file"
                        type="file"
                        className="sr-only"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => handleFileChange(e, "patients")}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">CSV or Excel files up to 10MB</p>
                  {patientFile && <p className="text-sm text-indigo-600">Selected: {patientFile.name}</p>}
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                File should contain columns for: FirstName, LastName, Gender, DateOfBirth, MRN, Address, City, State, ZipCode, Phone
              </p>
              <p className="mt-1 text-sm text-gray-500">
                <span className="text-indigo-600 font-medium">Tip:</span> Download our template file above for the correct format
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label htmlFor="patient-id" className="block text-sm font-medium text-gray-700 mb-2">
                  Patient ID (FHIR resource ID)
                </label>
                <input
                  type="text"
                  id="patient-id"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  Enter the FHIR resource ID for the patient these {uploadType} belong to
                </p>
              </div>

              {uploadType === "observations" ? (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Clinical Observations CSV/Excel File</label>
                    <Link
                      href="/templates/observation_template.csv"
                      className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                      download
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download Template
                    </Link>
                  </div>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="observation-file"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="observation-file"
                            name="observation-file"
                            type="file"
                            className="sr-only"
                            accept=".csv,.xlsx,.xls"
                            onChange={(e) => handleFileChange(e, "observations")}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">CSV or Excel files up to 10MB</p>
                      {observationFile && <p className="text-sm text-indigo-600">Selected: {observationFile.name}</p>}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    File should contain columns for: Date, ObservationName, LoincCode, Value, Unit, UnitCode
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    <span className="text-indigo-600 font-medium">Tip:</span> Download our template file above for the correct format
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    For brain cancer registry, consider including: tumor size, biomarker results, pathology findings, treatment response
                    metrics
                  </p>
                </div>
              ) : uploadType === "conditions" ? (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Medical Conditions CSV/Excel File</label>
                    <Link
                      href="/templates/condition_template.csv"
                      className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                      download
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download Template
                    </Link>
                  </div>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="condition-file"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="condition-file"
                            name="condition-file"
                            type="file"
                            className="sr-only"
                            accept=".csv,.xlsx,.xls"
                            onChange={(e) => handleFileChange(e, "conditions")}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">CSV or Excel files up to 10MB</p>
                      {conditionFile && <p className="text-sm text-indigo-600">Selected: {conditionFile.name}</p>}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    File should contain columns for: SnomedCode, ConditionName, OnsetDate, Status, Notes
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    <span className="text-indigo-600 font-medium">Tip:</span> Download our template file above for the correct format
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    For brain cancer registry, include diagnoses, comorbidities, complications, and neurological symptoms
                  </p>
                </div>
              ) : (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Medical Procedures CSV/Excel File</label>
                    <Link
                      href="/templates/procedure_template.csv"
                      className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                      download
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download Template
                    </Link>
                  </div>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="procedure-file"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="procedure-file"
                            name="procedure-file"
                            type="file"
                            className="sr-only"
                            accept=".csv,.xlsx,.xls"
                            onChange={(e) => handleFileChange(e, "procedures")}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">CSV or Excel files up to 10MB</p>
                      {procedureFile && <p className="text-sm text-indigo-600">Selected: {procedureFile.name}</p>}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    File should contain columns for: SnomedCode, ProcedureName, PerformedDate, Status, BodySite, Notes
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    <span className="text-indigo-600 font-medium">Tip:</span> Download our template file above for the correct format
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    For brain cancer registry, include diagnostic procedures, surgeries, radiation treatments, and chemotherapy sessions
                  </p>
                </div>
              )}
            </>
          )}

          <div className="mt-8">
            <button
              type="submit"
              disabled={
                loading ||
                (!patientFile && uploadType === "patients") ||
                (!observationFile && uploadType === "observations") ||
                (!conditionFile && uploadType === "conditions") ||
                (!procedureFile && uploadType === "procedures") ||
                ((uploadType === "observations" || uploadType === "conditions" || uploadType === "procedures") && !patientId)
              }
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Upload File"}
            </button>
          </div>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded-md ${result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            <p>{result.message}</p>
          </div>
        )}

        <div className="mt-8 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900">File Format Guidelines</h3>
          <div className="mt-4 prose prose-sm text-gray-500">
            <p>For brain cancer registry data, please ensure your files follow these guidelines:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All dates should be in YYYY-MM-DD format</li>
              <li>Patient files should include first and last name, gender, date of birth, and MRN at minimum</li>
              <li>Observation files should specify which LOINC codes are being used for tumor measurements and biomarkers</li>
              <li>Condition and procedure files should include SNOMED CT codes when possible</li>
              <li>Include tumor location, size, WHO grade, and molecular markers when available</li>
              <li>Treatment-related observations should be clearly labeled</li>
            </ul>
            <div className="mt-4 flex flex-wrap space-x-4">
              <Link
                href="/templates/patient_template.csv"
                className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500 mb-2"
                download
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Patient Data Template
              </Link>
              <Link
                href="/templates/observation_template.csv"
                className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500 mb-2"
                download
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Observation Data Template
              </Link>
              <Link
                href="/templates/condition_template.csv"
                className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500 mb-2"
                download
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Condition Data Template
              </Link>
              <Link
                href="/templates/procedure_template.csv"
                className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500 mb-2"
                download
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Procedure Data Template
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}