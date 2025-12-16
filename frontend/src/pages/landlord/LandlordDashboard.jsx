import React, { useEffect, useState } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, Button, 
  Table, TableBody, TableCell, TableHead, TableRow, Chip,
  CircularProgress, Alert 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; // Use your configured axios instance
import { listingService, requestService } from '../../services/api';
import Navbar from '../../components/Navbar';

export default function LandlordDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ listings: 0, requests: 0, contracts: 0 });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Listings to count them
        // Note: Real production apps usually have a specific /stats endpoint, 
        // but we can just fetch the lists for MVP.
        const listingsRes = await listingService.getAll();
        
        // 2. Fetch Rental Requests
        const requestsRes = await requestService.getAll();
        
        // Filter for "pending" requests only
        const pending = requestsRes.data.filter(r => r.status === 'pending');

        setStats({
          listings: listingsRes.data.listings ? listingsRes.data.listings.length : 0,
          requests: pending.length,
          contracts: 0 // Placeholder until you implement contracts API fetching
        });

        setRecentRequests(pending.slice(0, 5)); // Show top 5
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError('Failed to load dashboard data. Ensure backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAcceptRequest = async (requestId) => {
    try {
      // Call the API to update status
      await api.put(`/rental-requests/${requestId}/status`, { status: 'accepted' });
      // Remove from list locally to update UI instantly
      setRecentRequests(prev => prev.filter(r => r.id !== requestId));
      alert("Request Accepted! Contract draft created.");
    } catch (err) {
      alert("Error accepting request: " + err.message);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <>
      <Navbar title="Landlord Workspace" />
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* STATS CARDS */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140, bgcolor: '#e3f2fd' }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                My Listings
              </Typography>
              <Typography component="p" variant="h3">
                {stats.listings}
              </Typography>
              <Button onClick={() => navigate('/landlord/properties')} sx={{ alignSelf: 'flex-start', mt: 'auto' }}>
                Manage Listings
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140, bgcolor: '#fff3e0' }}>
              <Typography component="h2" variant="h6" color="warning.main" gutterBottom>
                Pending Requests
              </Typography>
              <Typography component="p" variant="h3">
                {stats.requests}
              </Typography>
              <Typography color="text.secondary" sx={{ flex: 1, mt: 1 }}>
                Action required
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140, bgcolor: '#e8f5e9' }}>
              <Typography component="h2" variant="h6" color="success.main" gutterBottom>
                Active Contracts
              </Typography>
              <Typography component="p" variant="h3">
                {stats.contracts}
              </Typography>
              <Typography color="text.secondary" sx={{ flex: 1, mt: 1 }}>
                Revenue generating
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* RECENT REQUESTS TABLE */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Incoming Rental Requests
              </Typography>
              
              {recentRequests.length === 0 ? (
                <Typography sx={{ p: 2, color: 'gray' }}>No pending requests found.</Typography>
              ) : (
                <Table size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell>Listing ID</TableCell>
                      <TableCell>Tenant Name</TableCell>
                      <TableCell>Desired Move-In</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentRequests.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>#{row.listing_id}</TableCell>
                        <TableCell>User #{row.requester_user_id}</TableCell> {/* You can fetch names later */}
                        <TableCell>{row.desired_move_in ? new Date(row.desired_move_in).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>
                          <Chip label={row.status} color="warning" size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <Button 
                            variant="contained" 
                            color="success" 
                            size="small"
                            onClick={() => handleAcceptRequest(row.id)}
                          >
                            Accept
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}