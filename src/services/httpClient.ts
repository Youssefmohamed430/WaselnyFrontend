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

    this.instance.interceptors.request.use(async (config) => {
      const token = tokenManager.getToken();
      
      // If token is expired or missing, but refresh token is valid, try to refresh
      if (tokenManager.isTokenExpired() && tokenManager.isRefreshTokenValid() && !this.isRefreshing) {
        // Don't refresh for the refresh token endpoint itself
        if (!config.url?.includes('/Auth/RefreshToken')) {
          try {
            this.isRefreshing = true;
            const { data } = await axios.post<RefreshAuthResponse>(
              `${API_BASE_URL}/Auth/RefreshToken`,
              undefined,
              { withCredentials: true }
            );
            if (data.token) {
              tokenManager.setToken(data.token);
              // Update user info if roles are provided in refresh response
              if (data.roles) {
                const currentUser = tokenManager.getUserInfo();
                if (currentUser) {
                  tokenManager.setUserInfo({ ...currentUser, roles: data.roles });
                }
              }
              // Update the config with the new token
              if (config.headers) {
                config.headers.Authorization = `Bearer ${data.token}`;
              }
            }
            this.isRefreshing = false;
          } catch {
            // If refresh fails, continue with the request (it will fail with 401 and trigger the response interceptor)
            this.isRefreshing = false;
          }
        }
      } else if (token && config.headers) {
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
              // Update user info if roles are provided in refresh response
              if (data.roles) {
                const currentUser = tokenManager.getUserInfo();
                if (currentUser) {
                  tokenManager.setUserInfo({ ...currentUser, roles: data.roles });
                }
              }
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

