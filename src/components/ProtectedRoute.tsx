import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthService from '../services/authService';
import LoadingSpinner from './LoadingSpinner';

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
      if (!authService.isAuthenticated()) {
        setAuthorized(false);
        setChecking(false);
        return;
      }
      try {
        await authService.refreshToken();
      } catch {
        setAuthorized(false);
        setChecking(false);
        return;
      }

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


