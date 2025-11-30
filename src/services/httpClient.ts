import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { tokenManager } from '../utils/tokenManager';

type RefreshAuthResponse = {
  token: string;
  roles?: string[];
  [key: string]: unknown;
};

class HttpClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private refreshQueue: Array<() => void> = [];

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true
    });

    this.instance.interceptors.request.use((config) => {
      const token = tokenManager.getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalConfig: AxiosRequestConfig & { _retry?: boolean } = error.config || {};
        if (error.response?.status === 401 && !originalConfig._retry) {
          originalConfig._retry = true;

          if (this.isRefreshing) {
            await new Promise<void>((resolve) => {
              this.refreshQueue.push(resolve);
            });
          }

          this.isRefreshing = true;
          try {
            const { data } = await axios.post<RefreshAuthResponse>(
              `${API_BASE_URL}/Auth/RefreshToken`,
              undefined,
              { withCredentials: true }
            );
            if (data.token) {
              tokenManager.setToken(data.token);
            }
            this.isRefreshing = false;
            this.refreshQueue.forEach((resolve) => resolve());
            this.refreshQueue = [];
            return this.instance(originalConfig);
          } catch (refreshError) {
            this.isRefreshing = false;
            this.refreshQueue = [];
            tokenManager.clearAll();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  get axios(): AxiosInstance {
    return this.instance;
  }
}

export const httpClient = new HttpClient().axios;

