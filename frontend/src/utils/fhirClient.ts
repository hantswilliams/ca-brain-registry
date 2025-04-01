import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Resource type mapping from FHIR to our API
const resourceTypeMapping: Record<string, string> = {
  'Patient': 'patients',
  'Condition': 'conditions',
  'Observation': 'observations',
  'Procedure': 'procedures'
};

class FHIRClient {
  private client: AxiosInstance;
  
  constructor() {
    // Use the correct API URL
    const apiUrl = process.env.FHIR_API_URL || 'http://localhost:5005';
    console.log('Initializing API client with URL:', apiUrl);
    
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    // Add response interceptor for debugging
    this.client.interceptors.response.use(
      response => {
        console.log(`API Response Status: ${response.status}`);
        return response;
      },
      error => {
        console.error('API Request Error:', error.response?.status, error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Helper to map FHIR resource types to our API endpoints
  private mapResourceType(resourceType: string): string {
    const mappedType = resourceTypeMapping[resourceType];
    if (!mappedType) {
      console.warn(`No mapping defined for resource type: ${resourceType}, using lowercase plural`);
      // Default to lowercase pluralized (simple s append) if no mapping exists
      return `${resourceType.toLowerCase()}s`;
    }
    return mappedType;
  }

  // Generic CRUD operations
  async get(resourceType: string, id?: string, params?: Record<string, string>, headers?: Record<string, string>) {
    const mappedType = this.mapResourceType(resourceType);
    const path = id ? `/${mappedType}/${id}` : `/${mappedType}`;
    return this.client.get(path, { params, headers });
  }

  async create(resourceType: string, data: any, headers?: Record<string, string>) {
    const mappedType = this.mapResourceType(resourceType);
    return this.client.post(`/${mappedType}`, data, { headers });
  }

  async update(resourceType: string, id: string, data: any, headers?: Record<string, string>) {
    const mappedType = this.mapResourceType(resourceType);
    return this.client.put(`/${mappedType}/${id}`, data, { headers });
  }

  async delete(resourceType: string, id: string, headers?: Record<string, string>) {
    const mappedType = this.mapResourceType(resourceType);
    return this.client.delete(`/${mappedType}/${id}`, { headers });
  }

  // Search operation
  async search(resourceType: string, params: Record<string, string>, headers?: Record<string, string>) {
    const mappedType = this.mapResourceType(resourceType);
    // If searching by patient ID, use the appropriate endpoint
    if (params.patient) {
      if (resourceType === 'Condition') {
        return this.client.get(`/conditions/patient/${params.patient}`, { headers });
      }
      // For other resource types, use the search endpoint (if available)
      return this.client.get(`/${mappedType}/search`, { params, headers });
    }
    return this.client.get(`/${mappedType}`, { params, headers });
  }

  // Configure client with auth token if needed
  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}

// Singleton instance
const fhirClient = new FHIRClient();

export default fhirClient;