import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    // Redirect to login page and save the location they were trying to access
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  if (requireAdmin && !isAdmin()) {
    // Redirect to home page if admin access is required but user is not admin
    return <Navigate to="/" replace />;
  }
  
  // Support for conditional rendering based on user role
  if (typeof children === 'function') {
    return children({ user, isAdmin: isAdmin() });
  }
  
  return children;
};

export default ProtectedRoute;