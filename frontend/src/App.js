import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import { authService } from './services/api';
import ProtectedRoute from './components/ProtectedRoute';
import LandlordDashboard from './pages/landlord/LandlordDashboard';
import CreateListing from './pages/landlord/CreateListing';
import MyProperties from './pages/landlord/MyProperties';
import ListingSearch from './pages/tenant/ListingSearch';
import ListingDetail from './pages/tenant/ListingDetail';

// Simple Dashboard Placeholder
// Placeholder Components (You will build these next)
const TenantDashboard = () => <h1>Tenant Dashboard</h1>;
// const LandlordDashboard = () => <h1>Landlord Dashboard</h1>;
const AdminDashboard = () => <h1>Admin Dashboard</h1>;

const ContractList = () => <h1>My Contracts</h1>;

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
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        
        {/* TENANT ROUTES (Role: tenant) */}
        <Route element={<ProtectedRoute allowedRoles={['tenant']} />}>
          <Route path="/dashboard" element={<TenantDashboard />} />
          <Route path="/listings" element={<ListingSearch />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/my-contracts" element={<ContractList />} />
        </Route>

        {/* LANDLORD ROUTES (Role: landlord) */}
        <Route element={<ProtectedRoute allowedRoles={['landlord']} />}>
          <Route path="/landlord/dashboard" element={<LandlordDashboard />} />
          <Route path="/landlord" element={<Navigate to="/landlord/dashboard" replace />} />
          <Route path="/landlord/create-listing/:propertyId" element={<CreateListing />} />
          <Route path="/landlord/properties" element={<MyProperties />} />
          <Route path="/landlord/contracts" element={<h1>Manage Contracts</h1>} />
        </Route>

        {/* ADMIN ROUTES (Role: admin) */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/verifications" element={<h1>Verifications</h1>} />
        </Route>

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;