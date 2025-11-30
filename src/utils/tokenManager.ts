export type AuthUser = {
  id?: string;
  username?: string;
  email?: string;
  roles?: string[];
  [key: string]: unknown;
};

const TOKEN_KEY = 'waselny_token';
const USER_KEY = 'waselny_user';
const REFRESH_TOKEN_EXPIRATION_KEY = 'waselny_refresh_token_exp';

export const tokenManager = {
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },
  setUserInfo(user: AuthUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  getUserInfo(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },
  removeUserInfo() {
    localStorage.removeItem(USER_KEY);
  },
  getUserRole(): string | null {
    const user = this.getUserInfo();
    if (!user) return null;
    const roles = (user.roles as string[] | undefined) || [];
    return roles[0] ?? null;
  },
  setRefreshTokenExpiration(expiration: string) {
    localStorage.setItem(REFRESH_TOKEN_EXPIRATION_KEY, expiration);
  },
  getRefreshTokenExpiration(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_EXPIRATION_KEY);
  },
  removeRefreshTokenExpiration() {
    localStorage.removeItem(REFRESH_TOKEN_EXPIRATION_KEY);
  },
  isRefreshTokenValid(): boolean {
    const expiration = this.getRefreshTokenExpiration();
    if (!expiration) return false;
    const expirationDate = new Date(expiration);
    return expirationDate > new Date();
  },
  clearAll() {
    this.removeToken();
    this.removeUserInfo();
    this.removeRefreshTokenExpiration();
  }
};


