import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  error: string | null;
}

// ─── Axios Instance ───────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ─── Request Interceptor — attach JWT ─────────────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('lumio-token');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Response Interceptor — handle 401 ───────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('lumio-token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  },
);

// ─── Typed Wrapper Methods ────────────────────────────────────────────────────

function extractData<T>(raw: { data: ApiResponse<T> }): ApiResponse<T> {
  return raw.data;
}

export const client = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return api.get<ApiResponse<T>>(url, config).then(extractData);
  },

  post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return api.post<ApiResponse<T>>(url, body, config).then(extractData);
  },

  patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return api.patch<ApiResponse<T>>(url, body, config).then(extractData);
  },

  del<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return api.delete<ApiResponse<T>>(url, config).then(extractData);
  },
};

export default api;
