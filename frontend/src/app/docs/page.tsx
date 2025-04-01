import Link from "next/link";
import Image from "next/image";

export default function DocsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 bg-slate-50">
      <div className="w-full max-w-7xl">
        {/* Header with navigation back to home */}
        <div className="w-full flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Image 
              src="/brain-color.png" 
              alt="Cancer Brain Registry Logo" 
              width={24} 
              height={24}
              className="text-blue-700"
            />
            <h1 className="text-3xl font-bold text-blue-900">API Documentation</h1>
          </div>
          <Link href="/" className="text-blue-700 hover:text-blue-900 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Documentation Content */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="md:w-1/4">
            <div className="bg-white p-4 rounded-lg shadow-md sticky top-4">
              <h2 className="text-lg font-semibold mb-4 text-blue-800">Contents</h2>
              <ul className="space-y-2">
                <li>
                  <a href="#overview" className="text-blue-700 hover:text-blue-900">Overview</a>
                </li>
                <li>
                  <a href="#authentication" className="text-blue-700 hover:text-blue-900">Authentication</a>
                </li>
                <li>
                  <a href="#fhir-proxy" className="text-blue-700 hover:text-blue-900">FHIR Proxy Endpoints</a>
                </li>
                <li>
                  <a href="#file-uploads" className="text-blue-700 hover:text-blue-900">File Upload Endpoints</a>
                </li>
                <li>
                  <a href="#custom-endpoints" className="text-blue-700 hover:text-blue-900">Custom Endpoints</a>
                </li>
                <li>
                  <a href="#development" className="text-blue-700 hover:text-blue-900">Development Guide</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Main Documentation Content */}
          <div className="md:w-3/4">
            {/* Overview Section */}
            <section id="overview" className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-blue-900">FHIR API Middleware Overview</h2>
              <p className="mb-4 text-gray-700">
                The Cancer Brain Registry is built on a Next.js middleware layer that provides enhanced functionality 
                on top of a HAPI FHIR server. This middleware includes authentication, data validation, file uploads, 
                and simplified API endpoints specifically designed for brain cancer research data.
              </p>
              <p className="mb-4 text-gray-700">
                This documentation provides detailed information about available API endpoints and how to use them.
              </p>
              <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-500">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-blue-800 mb-0">Project Sponsorship</h3>
                  <Image 
                    src="/uva_logo.png" 
                    alt="UVA Logo" 
                    width={20} 
                    height={20}
                    className="object-contain"
                  />
                </div>
                <p className="text-sm text-blue-800">
                  This registry is sponsored by the University of Virginia (UVA) as a proof-of-concept implementation for brain cancer research.
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-500 mt-4">
                <h3 className="font-medium text-blue-800 mb-2">HAPI FHIR Server Access</h3>
                <p className="text-sm text-blue-800">
                  The backend server is accessible at <code className="bg-gray-100 p-1 rounded">http://localhost:5005</code>
                </p>
              </div>
            </section>

            {/* Authentication Section */}
            <section id="authentication" className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-blue-900">Authentication</h2>
              <p className="mb-4 text-gray-700">
                To use the API, you must first obtain a JWT token through the login endpoint.
              </p>
              
              <div className="mb-6">
                <h3 className="text-xl font-medium mb-2 text-blue-800">Login</h3>
                <div className="bg-gray-100 p-4 rounded-md mb-4">
                  <div className="flex items-center mb-2">
                    <span className="bg-blue-700 text-white px-2 py-1 rounded text-xs mr-2">POST</span>
                    <code>/api/auth/login</code>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">Request Body:</p>
                  <pre className="bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto text-sm">
{`{
  "username": "admin",
  "password": "password"
}`}
                  </pre>
                </div>
                <p className="text-gray-700 mb-2">Response:</p>
                <pre className="bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto text-sm">
{`{
  "token": "your_jwt_token",
  "user": {
    "id": "user_id",
    "username": "admin",
    "role": "admin"
  }
}`}
                </pre>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2 text-blue-800">Using the Token</h3>
                <p className="mb-2 text-gray-700">
                  Include the JWT token in the Authorization header for all API requests:
                </p>
                <pre className="bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto text-sm">
{`Authorization: Bearer your_jwt_token`}
                </pre>
              </div>
            </section>

            {/* FHIR Proxy Section */}
            <section id="fhir-proxy" className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-blue-900">FHIR Proxy Endpoints</h2>
              <p className="mb-4 text-gray-700">
                The middleware provides a proxy to the HAPI FHIR server with enhanced authentication and validation.
                All standard FHIR operations are supported through these endpoints.
              </p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium mb-2 text-blue-800">Search Resources</h3>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <span className="bg-green-700 text-white px-2 py-1 rounded text-xs mr-2">GET</span>
                      <code>/api/fhir/{'{resourceType}'}</code>
                    </div>
                    <p className="text-sm text-gray-700">
                      Search for resources of a specific type. Supports all FHIR search parameters.
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      Example: <code>/api/fhir/Patient?family=Smith</code>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium mb-2 text-blue-800">Get Resource by ID</h3>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <span className="bg-green-700 text-white px-2 py-1 rounded text-xs mr-2">GET</span>
                      <code>/api/fhir/{'{resourceType}/{id}'}</code>
                    </div>
                    <p className="text-sm text-gray-700">
                      Retrieve a specific resource by its ID.
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      Example: <code>/api/fhir/Patient/123</code>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium mb-2 text-blue-800">Create Resource</h3>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <span className="bg-blue-700 text-white px-2 py-1 rounded text-xs mr-2">POST</span>
                      <code>/api/fhir/{'{resourceType}'}</code>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      Create a new resource. The body should contain a valid FHIR resource.
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      Example: <code>/api/fhir/Patient</code> with Patient resource in body
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium mb-2 text-blue-800">Update Resource</h3>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <span className="bg-yellow-700 text-white px-2 py-1 rounded text-xs mr-2">PUT</span>
                      <code>/api/fhir/{'{resourceType}/{id}'}</code>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      Update an existing resource. The body should contain the updated FHIR resource.
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      Example: <code>/api/fhir/Patient/123</code> with updated Patient resource in body
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium mb-2 text-blue-800">Delete Resource</h3>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <span className="bg-red-700 text-white px-2 py-1 rounded text-xs mr-2">DELETE</span>
                      <code>/api/fhir/{'{resourceType}/{id}'}</code>
                    </div>
                    <p className="text-sm text-gray-700">
                      Delete a specific resource by its ID.
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      Example: <code>/api/fhir/Patient/123</code>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* File Uploads Section */}
            <section id="file-uploads" className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-blue-900">File Upload Endpoints</h2>
              <p className="mb-4 text-gray-700">
                The API provides endpoints for uploading patient data and observations from CSV/Excel files.
              </p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium mb-2 text-blue-800">Upload Patients</h3>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <span className="bg-blue-700 text-white px-2 py-1 rounded text-xs mr-2">POST</span>
                      <code>/api/upload/patients</code>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      Upload multiple patients from a CSV file. The file should be sent as form-data with the key 'file'.
                    </p>
                    <div className="bg-blue-50 p-3 rounded-md mt-2">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> A template for the patient CSV file can be downloaded from <code>/templates/patient_template.csv</code>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium mb-2 text-blue-800">Upload Observations</h3>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <span className="bg-blue-700 text-white px-2 py-1 rounded text-xs mr-2">POST</span>
                      <code>/api/upload/observations</code>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      Upload observations for a patient from a CSV file. The file should be sent as form-data with the key 'file'.
                    </p>
                    <p className="text-sm text-gray-700 mb-2">
                      Query Parameters:
                    </p>
                    <ul className="list-disc pl-6 text-sm text-gray-700 mb-2">
                      <li><code>patientId</code> - The ID of the patient to associate observations with</li>
                    </ul>
                    <div className="bg-blue-50 p-3 rounded-md mt-2">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> A template for the observations CSV file can be downloaded from <code>/templates/observation_template.csv</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Custom Endpoints Section */}
            <section id="custom-endpoints" className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-blue-900">Custom Endpoints</h2>
              <p className="mb-4 text-gray-700">
                The API includes simplified custom endpoints tailored for brain cancer research.
              </p>
              
              <div>
                <h3 className="text-xl font-medium mb-2 text-blue-800">Patient Summary</h3>
                <div className="bg-gray-100 p-4 rounded-md">
                  <div className="flex items-center mb-2">
                    <span className="bg-green-700 text-white px-2 py-1 rounded text-xs mr-2">GET</span>
                    <code>/api/custom/patient-summary/{'{id}'}</code>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    Get a comprehensive summary of a patient, including demographics, observations, and conditions.
                    This endpoint consolidates data from multiple FHIR resources into a single response.
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    Example Response:
                  </p>
                  <pre className="bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto text-sm">
{`{
  "patient": {
    "id": "123",
    "name": "John Smith",
    "birthDate": "1980-01-01",
    "gender": "male"
  },
  "observations": [
    {
      "code": "8480-6",
      "display": "Systolic blood pressure",
      "value": 120,
      "unit": "mm[Hg]",
      "date": "2023-01-15"
    }
  ],
  "conditions": [
    {
      "code": "C71.9",
      "display": "Brain tumor",
      "onsetDate": "2022-10-01",
      "status": "active"
    }
  ]
}`}
                  </pre>
                </div>
              </div>
            </section>

            {/* Development Guide Section */}
            <section id="development" className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-blue-900">Development Guide</h2>
              <p className="mb-4 text-gray-700">
                This section provides guidance for developers working with the API.
              </p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium mb-2 text-blue-800">Getting Started</h3>
                  <p className="text-gray-700 mb-2">
                    To start the development server, run:
                  </p>
                  <pre className="bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto text-sm">
{`npm run dev`}
                  </pre>
                  <p className="text-gray-700 mt-2">
                    The development server will start on <code className="bg-gray-100 p-1 rounded">http://localhost:3000</code>
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium mb-2 text-blue-800">Testing</h3>
                  <p className="text-gray-700 mb-2">
                    You can test patient data flow using the provided test script:
                  </p>
                  <pre className="bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto text-sm">
{`node scripts/test-patient-flow.js`}
                  </pre>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium mb-2 text-blue-800">Docker Environment</h3>
                  <p className="text-gray-700 mb-2">
                    The project includes a Docker Compose configuration that sets up the HAPI FHIR server and PostgreSQL database.
                    To start the entire environment:
                  </p>
                  <pre className="bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto text-sm">
{`docker-compose up -d`}
                  </pre>
                </div>
              </div>
            </section>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="text-center text-gray-600 text-sm mt-8 pb-4">
          <p>Cancer Brain Registry - Proof of Concept</p>
          <div className="mt-2 flex justify-center items-center gap-2">
            <span>© {new Date().getFullYear()} | Sponsored by University of Virginia</span>
            <Image 
              src="/uva_logo.png" 
              alt="UVA Logo" 
              width={20} 
              height={20}
              className="object-contain"
            />
          </div>
        </footer>
      </div>
    </main>
  );
}