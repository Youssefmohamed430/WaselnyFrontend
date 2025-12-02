import { httpClient } from './httpClient';
import { tokenManager, AuthUser } from '../utils/tokenManager';

export type AuthResponse = {
  id: string;
  message: string;
  isAuthenticated: boolean;
  username: string;
  email: string;
  roles: string[];
  token: string;
  refreshTokenExpiration: string;
};

class AuthService {
  async login(userName: string, password: string): Promise<AuthResponse> {
    const { data } = await httpClient.post<AuthResponse>('/Auth/LogIn', {
      userName,
      password
    });
    if (data.token) {
      tokenManager.setToken(data.token);
      tokenManager.setUserInfo(data as unknown as AuthUser);
      if (data.refreshTokenExpiration) {
        tokenManager.setRefreshTokenExpiration(data.refreshTokenExpiration);
      }
    }
    return data;
  }

  async register(userData: {
    name: string;
    email: string;
    phoneNumber: string;
    userName: string;
    password: string;
  }): Promise<{ message: string; isAuthenticated: boolean }> {
    const { data } = await httpClient.post('/Auth/Register', userData);
    return data;
  }

  async verifyEmail(email: string, code: string): Promise<AuthResponse> {
    const { data } = await httpClient.post<AuthResponse>(
      `/Auth/VerifyCode/${encodeURIComponent(code)}?email=${encodeURIComponent(email)}`
    );
    if (data.token) {
      tokenManager.setToken(data.token);
      tokenManager.setUserInfo(data as unknown as AuthUser);
      if (data.refreshTokenExpiration) {
        tokenManager.setRefreshTokenExpiration(data.refreshTokenExpiration);
      }
    }
    return data;
  }

  async forgotPassword(email: string): Promise<{ message: string; isAuthenticated: boolean }> {
    const { data } = await httpClient.post(
      `/Auth/ForgetPassword/${encodeURIComponent(email)}`
    );
    return data;
  }

  async resetPassword(email: string, token: string, newPassword: string): Promise<{
    message: string;
    isAuthenticated: boolean;
  }> {
    const { data } = await httpClient.post('/Auth/ResetPassword', {
      email,
      token,
      newPassword
    });
    return data;
  }

  async refreshToken(): Promise<AuthResponse> {
    const { data } = await httpClient.post<AuthResponse>('/Auth/RefreshToken');
    if (data.token) {
      tokenManager.setToken(data.token);
      tokenManager.setUserInfo(data as unknown as AuthUser);
      if (data.refreshTokenExpiration) {
        tokenManager.setRefreshTokenExpiration(data.refreshTokenExpiration);
      }
    }
    return data;
  }

  async logout(token: string | null = null): Promise<void> {
    try {
      await httpClient.post('/Auth/revokeToken', token ? { token } : undefined);
    } catch {
      // ignore errors on logout
    } finally {
      tokenManager.clearAll();
    }
  }

  async driverRequest(driverData: {
    name: string;
    ssn: string;
    phone: string;
    email: string;
  }): Promise<{ message: string; isAuthenticated: boolean }> {
    const { data } = await httpClient.post('/Auth/DriverRequest', driverData);
    return data;
  }

  isAuthenticated(): boolean {
    // Check if we have a valid refresh token (stored in HTTP-only cookie)
    // If refresh token is valid, we can get a new access token
    const hasValidRefreshToken = tokenManager.isRefreshTokenValid();
    
    // Also check if we have a token (might be expired, but refresh can fix it)
    const token = tokenManager.getToken();
    
    // User is authenticated if they have a valid refresh token OR a token
    // (token might be expired, but refresh token can renew it)
    return hasValidRefreshToken || !!token;
  }

  getUserInfo(): AuthUser | null {
    return tokenManager.getUserInfo();
  }

  getUserRole(): string | null {
    return tokenManager.getUserRole();
  }
}

export default AuthService;


