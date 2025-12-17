import React, { useEffect, useState } from 'react';
import {
    Container, Grid, Paper, Typography, Box, Button, Divider, Card, CardContent,
    CardActionArea, Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { verificationService, userService, issueService, authService } from '../../services/api';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PeopleIcon from '@mui/icons-material/People';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        pendingVerifications: 0,
        totalUsers: 0,
        activeIssues: 0
    });
    const user = authService.getCurrentUser();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Mock data for now if API fails or returns empty
                const [verRes, userRes, issueRes] = await Promise.all([
                    verificationService.getAll({ status: 'pending' }).catch(() => ({ data: { verifications: [] } })),
                    userService.getAll().catch(() => ({ data: { users: [] } })),
                    issueService.getAll().catch(() => ({ data: { issues: [] } }))
                ]);

                setStats({
                    pendingVerifications: verRes.data.verifications?.length || 0,
                    totalUsers: userRes.data.users?.length || 0,
                    activeIssues: issueRes.data.issues?.filter(i => i.status !== 'resolved').length || 0
                });
            } catch (error) {
                console.error("Error fetching admin stats", error);
            }
        };
        fetchStats();
    }, []);

    const StatCard = ({ title, value, icon, color, gradient }) => (
        <Card
            elevation={3}
            sx={{
                height: '100%',
                background: gradient,
                color: 'white',
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.2, transform: 'rotate(15deg)' }}>
                {React.cloneElement(icon, { sx: { fontSize: 120 } })}
            </Box>
            <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500 }}>{title}</Typography>
                        <Typography variant="h2" fontWeight="bold" sx={{ mt: 1 }}>{value}</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 4 }}>
            <Navbar title="Admin Dashboard" />
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'secondary.main' }}>
                        <AdminPanelSettingsIcon fontSize="large" />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                            Welcome back, {user?.full_name || 'Admin'}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Here's what's happening in your system today.
                        </Typography>
                    </Box>
                </Box>

                <Grid container spacing={3} sx={{ mb: 6 }}>
                    <Grid item xs={12} md={4}>
                        <StatCard
                            title="Pending Verifications"
                            value={stats.pendingVerifications}
                            icon={<VerifiedUserIcon />}
                            gradient="linear-gradient(135deg, #1a237e 0%, #3949ab 100%)"
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <StatCard
                            title="Total Users"
                            value={stats.totalUsers}
                            icon={<PeopleIcon />}
                            gradient="linear-gradient(135deg, #ff6f00 0%, #ffca28 100%)"
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <StatCard
                            title="Active Issues"
                            value={stats.activeIssues}
                            icon={<ReportProblemIcon />}
                            gradient="linear-gradient(135deg, #d32f2f 0%, #ef5350 100%)"
                        />
                    </Grid>
                </Grid>

                <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                    Quick Actions
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card
                            elevation={2}
                            sx={{
                                height: '100%',
                                borderRadius: 3,
                                transition: '0.3s',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
                            }}
                        >
                            <CardActionArea onClick={() => navigate('/admin/verifications')} sx={{ height: '100%', p: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <Avatar sx={{ bgcolor: 'success.light', color: 'success.dark' }}>
                                            <VerifiedUserIcon />
                                        </Avatar>
                                        <Typography variant="h6" fontWeight="bold">Verification Center</Typography>
                                    </Box>
                                    <Typography color="text.secondary" paragraph>
                                        Review and approve landlord documents, property listings, and user affiliations.
                                    </Typography>
                                    <Button endIcon={<ArrowForwardIcon />} color="success">
                                        Go to Verifications
                                    </Button>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card
                            elevation={2}
                            sx={{
                                height: '100%',
                                borderRadius: 3,
                                transition: '0.3s',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
                            }}
                        >
                            <CardActionArea onClick={() => navigate('/admin/users')} sx={{ height: '100%', p: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <Avatar sx={{ bgcolor: 'info.light', color: 'info.dark' }}>
                                            <PeopleIcon />
                                        </Avatar>
                                        <Typography variant="h6" fontWeight="bold">User Management</Typography>
                                    </Box>
                                    <Typography color="text.secondary" paragraph>
                                        View all users, manage roles, and deactivate suspicious accounts.
                                    </Typography>
                                    <Button endIcon={<ArrowForwardIcon />} color="info">
                                        Manage Users
                                    </Button>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
