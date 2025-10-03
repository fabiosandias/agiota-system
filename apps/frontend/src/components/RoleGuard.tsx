import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type UserRole = 'admin' | 'operator' | 'viewer';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

const RoleGuard = ({ children, allowedRoles, redirectTo = '/' }: RoleGuardProps) => {
  const { user } = useAuth();

  if (!user || !user.role || !allowedRoles.includes(user.role as UserRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
