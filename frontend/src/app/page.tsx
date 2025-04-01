import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-12 bg-slate-50">
      {/* Navigation Header */}
      <nav className="w-full max-w-7xl flex justify-between items-center py-4 px-6 bg-white rounded-lg shadow-sm mb-8">
        <div className="flex items-center gap-2">
          <Image 
            src="/brain-color.png" 
            alt="Cancer Brain Registry Logo" 
            width={32} 
            height={32}
            className="text-blue-700"
          />
          <div className="text-xl font-bold text-blue-800">Cancer Brain Registry</div>
        </div>
        <div className="flex gap-4">
          <a href="#about" className="text-blue-700 hover:text-blue-900">About</a>
          <a href="#features" className="text-blue-700 hover:text-blue-900">Features</a>
          <Link href="/docs" className="text-blue-700 hover:text-blue-900">Documentation</Link>
        </div>
      </nav>
      
      <div className="z-10 max-w-6xl w-full items-center justify-between">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center mb-16 gap-8">
          <div className="md:w-1/2">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-blue-900">
              Cancer Brain Registry
            </h1>
            <p className="text-lg text-gray-700 mb-6">
              Advancing brain cancer research through standardized data collection and FHIR-based interoperability.
            </p>
            <div className="flex items-center gap-2 mb-6">
              <p className="text-sm text-gray-600">
                Sponsored by the University of Virginia
              </p>
              <Image 
                src="/uva_logo.png" 
                alt="UVA Logo" 
                width={30} 
                height={30}
                className="object-contain"
              />
            </div>
            <div className="flex gap-4">
              <Link href="/dashboard" className="px-6 py-3 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition">
                Access Registry
              </Link>
              <Link href="/docs" className="px-6 py-3 border border-blue-700 text-blue-700 rounded-md hover:bg-blue-50 transition">
                View Documentation
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="bg-white p-4 rounded-lg shadow-md relative w-full max-w-md aspect-video flex items-center justify-center">
              <Image 
                src="/brain-color.png" 
                alt="Brain Registry Visualization" 
                width={300} 
                height={200}
                className="object-contain"
              />
            </div>
          </div>
        </div>
        
        {/* About Section */}
        <div id="about" className="bg-white p-8 rounded-lg shadow-md mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-blue-900">About the Registry</h2>
          <p className="mb-4 text-gray-700">
            The Cancer Brain Registry is a proof-of-concept platform designed to standardize the collection, 
            storage, and sharing of brain cancer data across research institutions and healthcare providers.
          </p>
          <p className="mb-4 text-gray-700">
            Built on FHIR (Fast Healthcare Interoperability Resources) standards, this registry enables 
            seamless data exchange while maintaining patient privacy and data security.
          </p>
          <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-500 mt-6">
            <div className="flex items-center gap-2">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This is a proof-of-concept implementation sponsored by the University of Virginia,
                showcasing the potential of FHIR-based registries for specialized oncology research.
              </p>
              <Image 
                src="/uva_logo.png" 
                alt="UVA Logo" 
                width={24} 
                height={24}
                className="object-contain"
              />
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2 text-blue-900">Standardized Data</h3>
            <p className="text-gray-700">
              Consistent data structures based on FHIR resources ensure compatibility across systems and facilitate multi-institutional research.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2 text-blue-900">Secure Access</h3>
            <p className="text-gray-700">
              Role-based authentication and authorization ensure that sensitive patient data is only accessible to authorized personnel.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2 text-blue-900">Data Import/Export</h3>
            <p className="text-gray-700">
              Simplified tools for importing clinical data from CSV files and exporting in standard FHIR formats.
            </p>
          </div>
        </div>
        
        {/* Technology Section */}
        <div className="bg-white p-8 rounded-lg shadow-md mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-blue-900">Technology Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-blue-800">FHIR Interoperability</h3>
              <p className="text-gray-700 mb-4">
                Built on HAPI FHIR server, allowing for standardized healthcare data exchange using the FHIR R4 specification.
              </p>
              <p className="text-gray-700">
                The backend server is accessible at <code className="bg-gray-100 p-1 rounded">http://localhost:5005</code>
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2 text-blue-800">Modern Web Architecture</h3>
              <p className="text-gray-700">
                A Next.js middleware layer provides enhanced functionality, including authentication, 
                data validation, simplified API endpoints, and an intuitive user interface for researchers.
              </p>
            </div>
          </div>
        </div>
        
        {/* Call to Action */}
        <div className="bg-blue-800 p-8 rounded-lg shadow-md text-white text-center mb-12">
          <h2 className="text-2xl font-semibold mb-4">Ready to get started?</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Access the registry dashboard to explore patient data or review our documentation 
            to learn more about the technical implementation.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/dashboard" className="px-6 py-3 bg-white text-blue-800 rounded-md hover:bg-gray-100 transition">
              Access Registry
            </Link>
            <Link href="/docs" className="px-6 py-3 border border-white text-white rounded-md hover:bg-blue-700 transition">
              View Documentation
            </Link>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="text-center text-gray-600 text-sm">
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
