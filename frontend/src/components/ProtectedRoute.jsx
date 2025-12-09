import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/api';

const ProtectedRoute = ({ allowedRoles }) => {
  const user = authService.getCurrentUser();

  // 1. Check if user is logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Check if user has the correct role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // 🛑 STOP! Don't just send everyone to /dashboard.
    // Send them to the dashboard meant for THEIR role.
    
    if (user.role === 'landlord') {
      return <Navigate to="/landlord/dashboard" replace />;
    }
    
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    
    // Default for tenants
    return <Navigate to="/dashboard" replace />;
  }

  // 3. If all checks pass, render the child route
  return <Outlet />;
};

export default ProtectedRoute;