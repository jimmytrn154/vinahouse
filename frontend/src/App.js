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
import TenantDashboard from './pages/tenant/TenantDashboard';
import Contracts from './pages/Contracts';

// Simple Dashboard Placeholder
// Placeholder Components (You will build these next)
// const TenantDashboard = () => <h1>Tenant Dashboard</h1>;
// const LandlordDashboard = () => <h1>Landlord Dashboard</h1>;
import AdminDashboard from './pages/admin/AdminDashboard';
import VerificationList from './pages/admin/VerificationList';
import UserManagement from './pages/admin/UserManagement';

// Simple Dashboard Placeholder
// Placeholder Components (You will build these next)
// const TenantDashboard = () => <h1>Tenant Dashboard</h1>;
// const LandlordDashboard = () => <h1>Landlord Dashboard</h1>;
// const AdminDashboard = () => <h1>Admin Dashboard</h1>;

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
        <Route path="/" element={<Navigate to="/listings" replace />} />
        <Route path="/listings" element={<ListingSearch />} />
        <Route path="/listings/:id" element={<ListingDetail />} />

        {/* SHARED ROUTES (Both tenant and landlord) */}
        <Route element={<ProtectedRoute allowedRoles={['tenant', 'landlord']} />}>
          <Route path="/contracts" element={<Contracts />} />
        </Route>

        {/* TENANT ROUTES (Role: tenant) */}
        <Route element={<ProtectedRoute allowedRoles={['tenant']} />}>
          <Route path="/dashboard" element={<TenantDashboard />} />
          <Route path="/tenant/dashboard" element={<TenantDashboard />} />
          {/* <Route path="/my-contracts" element={<ContractList />} /> */}
          <Route path="/my-contracts" element={<Contracts/>} />
        </Route>

        {/* LANDLORD ROUTES (Role: landlord) */}
        <Route element={<ProtectedRoute allowedRoles={['landlord']} />}>
          <Route path="/landlord/dashboard" element={<LandlordDashboard />} />
          <Route path="/landlord" element={<Navigate to="/landlord/dashboard" replace />} />
          <Route path="/landlord/create-listing/:propertyId" element={<CreateListing />} />
          <Route path="/landlord/properties" element={<MyProperties />} />
          <Route path="/landlord/contracts" element={<Contracts />} />
        </Route>

        {/* ADMIN ROUTES (Role: admin) */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/verifications" element={<VerificationList />} />
          <Route path="/admin/users" element={<UserManagement />} />
        </Route>

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;