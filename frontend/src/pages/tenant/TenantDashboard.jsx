import React, { useEffect, useState } from 'react';
import { Container, Grid, Paper, Typography, Button, Box, Chip, Divider, List, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { authService, requestService, contractService, issueService } from '../../services/api';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

export default function TenantDashboard() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [requests, setRequests] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [issues, setIssues] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [reqRes, conRes, issRes] = await Promise.all([
                    requestService.getAll(),
                    contractService.getAll(),
                    issueService.getAll()
                ]);
                setRequests(reqRes.data.requests || []);
                setContracts(conRes.data.contracts || []);
                setIssues(issRes.data.issues || []);
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            }
        };
        fetchData();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'accepted': return 'success';
            case 'rejected': return 'error';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    return (
        <>
            <Navbar title="Tenant Dashboard" />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                {/* Welcome Section */}
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight="bold" gutterBottom>
                        Welcome back, {user?.full_name}!
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                        Manage your rentals, contracts, and requests in one place.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<HomeIcon />}
                        onClick={() => navigate('/listings')}
                        sx={{ borderRadius: 50, px: 4, py: 1.5, fontSize: '1.1rem' }}
                    >
                        Find a New Home
                    </Button>
                </Box>

                <Grid container spacing={3}>
                    {/* Rental Requests */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: '100%', borderRadius: 4, boxShadow: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h5" fontWeight="bold">Rental Requests</Typography>
                                <Chip label={requests.length} color="primary" size="small" />
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {requests.length === 0 ? (
                                <Typography color="text.secondary">No active requests.</Typography>
                            ) : (
                                <List>
                                    {requests.map((req) => (
                                        <ListItem key={req.id} sx={{ bgcolor: 'background.default', mb: 1, borderRadius: 2 }}>
                                            <ListItemAvatar>
                                                <Avatar>
                                                    <HomeIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={`Request #${req.id}`}
                                                secondary={`Status: ${req.status}`}
                                            />
                                            <Chip label={req.status} color={getStatusColor(req.status)} size="small" />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Paper>
                    </Grid>

                    {/* Contracts */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: '100%', borderRadius: 4, boxShadow: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h5" fontWeight="bold">My Contracts</Typography>
                                <Chip label={contracts.length} color="secondary" size="small" />
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {contracts.length === 0 ? (
                                <Typography color="text.secondary">No active contracts.</Typography>
                            ) : (
                                <List>
                                    {contracts.map((con) => (
                                        <ListItem key={con.id} button onClick={() => navigate(`/contracts/${con.id}`)} sx={{ bgcolor: 'background.default', mb: 1, borderRadius: 2 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                                    <AssignmentIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={`Contract #${con.id}`}
                                                secondary={`Rent: $${con.rent_amount}`}
                                            />
                                            <Chip label={con.status} color="success" size="small" />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Paper>
                    </Grid>

                    {/* Issues */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3, borderRadius: 4, boxShadow: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h5" fontWeight="bold">Reported Issues</Typography>
                                <Button startIcon={<ReportProblemIcon />} variant="outlined" size="small">Report New Issue</Button>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {issues.length === 0 ? (
                                <Typography color="text.secondary">No issues reported.</Typography>
                            ) : (
                                <Grid container spacing={2}>
                                    {issues.map((issue) => (
                                        <Grid item xs={12} sm={6} md={4} key={issue.id}>
                                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                                <Typography variant="subtitle1" fontWeight="bold">{issue.title}</Typography>
                                                <Typography variant="body2" color="text.secondary" noWrap>{issue.description}</Typography>
                                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                                                    <Chip label={issue.status} size="small" />
                                                    <Typography variant="caption" color="text.secondary">{new Date(issue.created_at).toLocaleDateString()}</Typography>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </>
    );
}
