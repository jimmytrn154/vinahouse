import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import './Navbar.css'; // Import the new styles

export default function Navbar({ title }) {
  const navigate = useNavigate();
  const location = useLocation(); // To check which page is active
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Helper to determine if a link is active
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      {/* 1. Brand / Logo */}
      <div className="navbar-brand" onClick={() => navigate(user?.role === 'landlord' ? '/landlord/dashboard' : '/dashboard')}>
        <span>Vin<span className="brand-highlight">Housing</span></span>
        {title && <span style={{ opacity: 0.5, fontWeight: 400 }}>| {title}</span>}
      </div>

      {/* 2. Center Navigation Links (Role Based) */}
      <div className="navbar-menu">
        {user?.role === 'landlord' && (
          <>
            <button 
              className={`nav-link ${isActive('/landlord/dashboard')}`}
              onClick={() => navigate('/landlord/dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`nav-link ${isActive('/landlord/properties')}`}
              onClick={() => navigate('/landlord/properties')}
            >
              Properties
            </button>
            <button 
              className={`nav-link ${isActive('/landlord/contracts')}`}
              onClick={() => navigate('/landlord/contracts')}
            >
              Contracts
            </button>
          </>
        )}

        {user?.role === 'tenant' && (
          <>
            <button 
              className={`nav-link ${isActive('/dashboard')}`}
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`nav-link ${isActive('/listings')}`}
              onClick={() => navigate('/listings')}
            >
              Browse Homes
            </button>
            <button 
              className={`nav-link ${isActive('/my-contracts')}`}
              onClick={() => navigate('/my-contracts')}
            >
              My Contracts
            </button>
          </>
        )}
      </div>

      {/* 3. User Profile & Logout */}
      <div className="navbar-user">
        <div className="user-info">
          <span className="user-name">{user?.full_name || 'User'}</span>
          <span className="user-role">{user?.role}</span>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}