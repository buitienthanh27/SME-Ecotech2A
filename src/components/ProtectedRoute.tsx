import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { canAccessRoute } from '../lib/permissions';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const currentUser = useStore((s) => s.currentUser);
  const role = currentUser?.role;

  if (!role || !canAccessRoute(location.pathname, role)) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
