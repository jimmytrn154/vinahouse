import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import { authService } from './services/api';

// Simple Dashboard Placeholder
const Dashboard = () => {
  const user = authService.getCurrentUser();
  
  const handleLogout = () => {
    authService.logout();
  };

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Welcome, {user.full_name}!</h1>
      <h3>Role: {user.role}</h3>
      <p>This is the protected dashboard.</p>
      <button 
        onClick={handleLogout}
        style={{ padding: '10px 20px', cursor: 'pointer', background: 'red', color: 'white', border: 'none' }}
      >
        Logout
      </button>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Default redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;