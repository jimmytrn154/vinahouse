import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingService, requestService, authService, issueService } from '../../services/api';
import Navbar from '../../components/Navbar';
import './LandlordDashboard.css'; // Import the custom styles

export default function LandlordDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ listings: 0, requests: 0, contracts: 0 });
  const [recentRequests, setRecentRequests] = useState([]);
  const [myIssues, setMyIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = authService.getCurrentUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [listingsRes, requestsRes, issuesRes] = await Promise.all([
            listingService.getAll({ owner_id: user.id }),
            requestService.getAll({ owner_id: user.id }),
            issueService.getAll() // ✅ Backend automatically filters for this landlord
        ]);

        const allListings = listingsRes.data.listings || [];
        const allRequests = requestsRes.data || []; 
        const allIssues = issuesRes.data.issues || [];

        const pendingRequests = allRequests.filter(r => r.status === 'pending');
        const activeIssues = allIssues.filter(i => i.status !== 'resolved');

        setStats({
          listings: allListings.length,
          requests: pendingRequests.length,
          contracts: 0, // Placeholder if you implement contracts count later
          issues: activeIssues.length
        });

        setRecentRequests(pendingRequests.slice(0, 5));
        setMyIssues(allIssues);

      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  const handleAcceptRequest = async (requestId) => {
    if(!window.confirm("Accept this rental request?")) return;
    try {
        await requestService.updateStatus(requestId, 'accepted');
        setRecentRequests(prev => prev.filter(r => r.id !== requestId));
        setStats(prev => ({ ...prev, requests: prev.requests - 1 }));
    } catch (err) {
        alert("Error: " + err.message);
    }
  };

  const handleResolveIssue = async (issueId) => {
      if(!window.confirm("Mark this issue as Resolved?")) return;
      try {
          await issueService.updateStatus(issueId, 'resolved');
          // Optimistic update
          setMyIssues(prev => prev.map(i => 
              i.id === issueId ? { ...i, status: 'resolved', resolved_at: new Date().toISOString() } : i
          ));
          // Update stats if needed (internal state only since we don't show the pill)
          setStats(prev => ({ ...prev, issues: prev.issues - 1 }));
      } catch (err) {
          alert("Failed to update issue.");
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

        {/* Stats Grid (Unchanged 3 Pills) */}
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
          <div className="stat-card green" style={{ cursor: 'pointer' }} onClick={() => navigate('/landlord/contracts')}>
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
        <section style={{ marginBottom: '3rem' }}>
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

        {/* ✅ NEW: Maintenance & Issues Section */}
        <section>
          <h2 className="section-title">Maintenance & Issues</h2>
          <div className="table-container">
            {myIssues.length === 0 ? (
              <div className="empty-state">
                <p>No issues reported. Your properties are in great shape!</p>
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Issue</th>
                    <th>Category</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Reported On</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myIssues.map((issue) => (
                    <tr key={issue.id}>
                      <td>
                          <div style={{ fontWeight: 600 }}>{issue.title}</div>
                          <div style={{ fontSize: '0.85rem', color: '#666' }}>{issue.description}</div>
                      </td>
                      <td>
                          <span style={{ textTransform: 'capitalize' }}>{issue.category.replace('_', ' ')}</span>
                      </td>
                      <td>
                          <span style={{ 
                              color: issue.severity === 'high' || issue.severity === 'critical' ? '#dc2626' : '#4b5563',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              fontSize: '0.75rem'
                          }}>
                              {issue.severity}
                          </span>
                      </td>
                      <td>
                        <span className={`badge ${issue.status === 'resolved' ? 'verified' : 'pending'}`}>
                          {issue.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>{new Date(issue.created_at).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        {issue.status !== 'resolved' && (
                            <button 
                              className="btn btn-primary"
                              onClick={() => handleResolveIssue(issue.id)}
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            >
                              Mark Done
                            </button>
                        )}
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