

import React from 'react';

import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles }) => {
 
  const { user, loading } = useAuth();
  const location = useLocation();


  if (loading) {
    return <div>Verificando autenticação...</div>;
  }


  if (!user) {
   
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  
  if (!allowedRoles.includes(user.role)) {
   
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  
  return children;
};

export default ProtectedRoute;
