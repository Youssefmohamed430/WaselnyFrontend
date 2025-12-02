import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthService from '../services/authService';
import LoadingSpinner from './LoadingSpinner';
import { tokenManager } from '../utils/tokenManager';

type Props = {
  children: ReactNode;
  allowedRoles?: string[];
};

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const authService = new AuthService();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Check if user has valid refresh token (even if JWT is expired/missing)
      const hasValidRefreshToken = tokenManager.isRefreshTokenValid();
      
      // If no refresh token is valid, user is not authenticated
      if (!hasValidRefreshToken && !authService.isAuthenticated()) {
        setAuthorized(false);
        setChecking(false);
        return;
      }

      // Attempt to refresh token (this will work if refresh token cookie is valid)
      try {
        await authService.refreshToken();
      } catch {
        // If refresh fails, user is not authenticated
        setAuthorized(false);
        setChecking(false);
        return;
      }

      // After successful refresh, check role
      const role = authService.getUserRole();
      if (!allowedRoles || !allowedRoles.length) {
        setAuthorized(true);
      } else {
        setAuthorized(role ? allowedRoles.includes(role) : false);
      }
      setChecking(false);
    };
    void checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return <LoadingSpinner />;
  }

  if (!authorized) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;


