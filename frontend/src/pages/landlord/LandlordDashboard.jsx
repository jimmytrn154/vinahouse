import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingService, requestService, authService } from '../../services/api';
import Navbar from '../../components/Navbar';
import './LandlordDashboard.css'; // Import the custom styles

export default function LandlordDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ listings: 0, requests: 0, contracts: 0 });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = authService.getCurrentUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Listings
        const listingsRes = await listingService.getAll({ owner_id: user.id });
        
        // 2. Fetch Requests
        const requestsRes = await requestService.getAll();
        
        // Handle array safety
        const allListings = Array.isArray(listingsRes.data.listings) ? listingsRes.data.listings : [];
        const allRequests = Array.isArray(requestsRes.data) ? requestsRes.data : [];
        
        // Filter pending
        const pending = allRequests.filter(r => r.status === 'pending');

        setStats({
          listings: allListings.length,
          requests: pending.length,
          contracts: 0 
        });

        setRecentRequests(pending.slice(0, 5));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError('Failed to load dashboard data. Check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  const handleAcceptRequest = async (requestId) => {
    // Note: You would likely implement a proper modal or confirmation here
    // For now, we keep the alert logic but styling is not blocked by MUI
    if(!window.confirm("Accept this rental request?")) return;
    
    try {
        // Assume requestService.updateStatus exists based on previous convos
        await requestService.updateStatus(requestId, 'accepted');
        setRecentRequests(prev => prev.filter(r => r.id !== requestId));
        setStats(prev => ({ ...prev, requests: prev.requests - 1 }));
    } catch (err) {
        alert("Error: " + err.message);
    }
  };

  if (loading) return (
    <>
      <Navbar title="Landlord Workspace" />
      <div className="loading-spinner">Loading dashboard...</div>
    </>
  );

  return (
    <>
      <Navbar title="Landlord Workspace" />
      
      <div className="dashboard-container">
        {/* Header */}
        <header className="dashboard-header">
          <h1 className="dashboard-title">Overview</h1>
          <p className="dashboard-subtitle">Welcome back, here's what's happening with your properties.</p>
        </header>

        {error && <div className="error-banner">{error}</div>}

        {/* Stats Grid */}
        <div className="stats-grid">
          {/* Card 1: Listings */}
          <div className="stat-card blue">
            <div>
              <div className="stat-title">Total Listings</div>
              <div className="stat-value">{stats.listings}</div>
            </div>
            <div className="stat-footer">
              <span>Active on platform</span>
              <button className="btn btn-link" onClick={() => navigate('/landlord/properties')}>
                Manage &rarr;
              </button>
            </div>
          </div>

          {/* Card 2: Requests */}
          <div className="stat-card orange">
            <div>
              <div className="stat-title">Pending Requests</div>
              <div className="stat-value">{stats.requests}</div>
            </div>
            <div className="stat-footer">
              <span>Requires attention</span>
              <span style={{ fontSize: '0.8rem', color: '#ea580c' }}>View all</span>
            </div>
          </div>

          {/* Card 3: Contracts */}
          <div className="stat-card green" style={{ cursor: 'pointer' }} onClick={() => navigate('/contracts')}>
            <div>
              <div className="stat-title">Active Contracts</div>
              <div className="stat-value">{stats.contracts}</div>
            </div>
            <div className="stat-footer">
              <span>Monthly Revenue</span>
              <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>View details &rarr;</span>
            </div>
          </div>
        </div>

        {/* Recent Requests Section */}
        <section>
          <h2 className="section-title">Incoming Rental Requests</h2>
          <div className="table-container">
            {recentRequests.length === 0 ? (
              <div className="empty-state">
                <p>No pending requests at the moment. Good job!</p>
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Listing ID</th>
                    <th>Applicant ID</th>
                    <th>Move-In Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 500 }}>#{row.listing_id}</td>
                      <td>User #{row.requester_user_id}</td>
                      <td>{row.desired_move_in ? new Date(row.desired_move_in).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <span className={`badge ${row.status}`}>
                          {row.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-success"
                          onClick={() => handleAcceptRequest(row.id)}
                        >
                          Accept
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </>
  );
}