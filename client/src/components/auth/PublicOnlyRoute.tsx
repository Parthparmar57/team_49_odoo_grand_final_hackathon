import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
        <p className="text-slate-400 text-sm font-medium">Checking session...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    const targetPath = user?.role === 'ADMIN' ? '/admin/users' : '/dashboard';
    return <Navigate to={targetPath} replace />;
  }

  return <>{children}</>;
};
