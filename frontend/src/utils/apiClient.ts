/**
 * API client for interacting with the Flask backend
 * Handles authentication, request formatting, and error handling
 */
import config from './config';

// Define interfaces based on Swagger API documentation
interface PatientCreate {
  name: string;
  birth_date: string;
  gender?: string;
}

interface PatientResponse {
  id: number;
  name: string;
  birth_date: string;
  gender?: string;
  sync_status?: string;
  fhir_id?: string;
  synced_at?: string;
}

interface ConditionCreate {
  condition_code: string;
  onset_date: string;
  status: string;
  patient_id: number;
}

interface ConditionResponse {
  id: number;
  condition_code: string;
  onset_date: string;
  status: string;
  patient_id: number;
  sync_status?: string;
  fhir_id?: string;
  synced_at?: string;
}

interface ObservationCreate {
  observation_code: string;
  observation_name: string;
  value: string;
  unit?: string;
  reference_range?: string;
  observation_date: string;
  status?: string;
  patient_id: number;
}

interface ObservationResponse {
  id: number;
  observation_code: string;
  observation_name: string;
  value: string;
  unit?: string;
  reference_range?: string;
  observation_date: string;
  status: string;
  patient_id: number;
  sync_status?: string;
  fhir_id?: string;
  synced_at?: string;
  created_at: string;
  updated_at: string;
}

interface ValueSetItem {
  code: string;
  display: string;
  description?: string;
  active?: boolean;
}

interface UserLogin {
  username: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserResponse;
}

interface UserResponse {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  roles: string[];
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;
  
  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }
  
  /**
   * Get the authentication token from localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }
  
  /**
   * Add authentication headers to request if token exists
   */
  private getHeaders(headers: HeadersInit = {}): HeadersInit {
    const authToken = this.getAuthToken();
    const authHeaders = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    
    return {
      ...this.defaultHeaders,
      ...headers,
      ...authHeaders,
    };
  }
  
  /**
   * Handle API response and error parsing
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle non-OK responses (4xx/5xx status codes)
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
      } catch (error) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    }
    
    // For 204 No Content responses, return null
    if (response.status === 204) {
      return null as unknown as T;
    }
    
    // Parse JSON response
    try {
      return await response.json();
    } catch (error) {
      console.error("Error parsing API response:", error);
      throw new Error("Failed to parse API response");
    }
  }
  
  /**
   * Generic request method
   */
  private async request<T = any>(
    endpoint: string, 
    method: string = 'GET', 
    data?: any, 
    customHeaders: HeadersInit = {}
  ): Promise<T> {
    // Direct endpoint URL without /api prefix
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders(customHeaders);
    
    const options: RequestInit = {
      method,
      headers,
      // Fix CORS issues with 'include' instead of 'same-origin'
      credentials: 'include',
      // Add mode: 'cors' to explicitly enable CORS
      mode: 'cors'
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`${method} request to ${endpoint} failed:`, error);
      throw error;
    }
  }
  
  // HTTP method wrappers
  async get<T = any>(endpoint: string, customHeaders?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, 'GET', undefined, customHeaders);
  }
  
  async post<T = any>(endpoint: string, data?: any, customHeaders?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, 'POST', data, customHeaders);
  }
  
  async put<T = any>(endpoint: string, data?: any, customHeaders?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, 'PUT', data, customHeaders);
  }
  
  async patch<T = any>(endpoint: string, data?: any, customHeaders?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, 'PATCH', data, customHeaders);
  }
  
  async delete<T = any>(endpoint: string, customHeaders?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, 'DELETE', undefined, customHeaders);
  }
  
  // Auth-specific methods
  async login(username: string, password: string): Promise<TokenResponse> {
    return this.post<TokenResponse>('/auth/login', { username, password });
  }
  
  async getCurrentUser(): Promise<UserResponse> {
    return this.get<UserResponse>('/auth/me');
  }
  
  async register(userData: any): Promise<UserResponse> {
    return this.post<UserResponse>('/auth/register', userData);
  }
  
  // Patient-specific methods
  async getPatients(): Promise<PatientResponse[]> {
    return this.get<PatientResponse[]>('/patients/');
  }
  
  async searchPatients(name: string): Promise<PatientResponse[]> {
    return this.get<PatientResponse[]>(`/patients/search?name=${encodeURIComponent(name)}`);
  }
  
  async getPatientById(id: number | string): Promise<PatientResponse> {
    return this.get<PatientResponse>(`/patients/${id}`);
  }
  
  async createPatient(patientData: PatientCreate): Promise<PatientResponse> {
    return this.post<PatientResponse>('/patients/', patientData);
  }
  
  // Condition-specific methods
  async getConditions(patientId: number | string): Promise<ConditionResponse[]> {
    return this.get<ConditionResponse[]>(`/conditions/patient/${patientId}`);
  }
  
  async getConditionById(id: number | string): Promise<ConditionResponse> {
    return this.get<ConditionResponse>(`/conditions/${id}`);
  }
  
  async createCondition(conditionData: ConditionCreate): Promise<ConditionResponse> {
    return this.post<ConditionResponse>('/conditions/', conditionData);
  }
  
  // Observation-specific methods
  async getObservations(patientId: number | string): Promise<ObservationResponse[]> {
    return this.get<ObservationResponse[]>(`/observations/patient/${patientId}`);
  }
  
  async getObservationById(id: number | string): Promise<ObservationResponse> {
    return this.get<ObservationResponse>(`/observations/${id}`);
  }
  
  async createObservation(observationData: ObservationCreate): Promise<ObservationResponse> {
    return this.post<ObservationResponse>('/observations/', observationData);
  }

  // Value Set methods
  async getGenders(): Promise<ValueSetItem[]> {
    return this.get<ValueSetItem[]>(`/value-sets/genders`);
  }
  
  async getConditionStatuses(): Promise<ValueSetItem[]> {
    return this.get<ValueSetItem[]>(`/value-sets/condition-statuses`);
  }
  
  async getNeurologicalConditions(): Promise<ValueSetItem[]> {
    return this.get<ValueSetItem[]>(`/value-sets/neurological-conditions`);
  }
  
  async getSyncStatuses(): Promise<ValueSetItem[]> {
    return this.get<ValueSetItem[]>(`/value-sets/sync-statuses`);
  }
  
  // Health check
  async getHealthStatus(): Promise<any> {
    return this.get('/health/');
  }
}

// Create a singleton instance
const apiClient = new ApiClient();

export default apiClient;