import React, { useEffect, useState } from 'react';
import { 
  Container, Grid, Paper, Typography, Button, Box, Chip, Divider, 
  List, ListItem, ListItemText, ListItemAvatar, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, FormControl, InputLabel, Select
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { authService, requestService, contractService, issueService } from '../../services/api';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

export default function TenantDashboard() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    
    // Data States
    const [requests, setRequests] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [issues, setIssues] = useState([]);

    // Modal States
    const [openIssueModal, setOpenIssueModal] = useState(false);
    const [issueForm, setIssueForm] = useState({
        contract_id: '',
        title: '',
        description: '',
        category: 'maintenance',
        severity: 'medium'
    });

    useEffect(() => {
        fetchData();
    }, []);

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

    const getStatusColor = (status) => {
        switch (status) {
            case 'accepted': return 'success';
            case 'rejected': return 'error';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    // --- Handlers ---
    
    const handleOpenReportModal = () => {
        if (contracts.length === 0) {
            alert("You need an active rental contract to report an issue.");
            return;
        }
        // Auto-select the first contract if only one exists
        setIssueForm(prev => ({
            ...prev,
            contract_id: contracts.length === 1 ? contracts[0].id : ''
        }));
        setOpenIssueModal(true);
    };

    const handleIssueSubmit = async () => {
        if (!issueForm.contract_id || !issueForm.title || !issueForm.description) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            await issueService.create(issueForm);
            alert("Issue reported successfully!");
            setOpenIssueModal(false);
            setIssueForm({ contract_id: '', title: '', description: '', category: 'maintenance', severity: 'medium' });
            fetchData(); // Refresh list
        } catch (err) {
            alert("Failed to report issue: " + (err.response?.data?.error || err.message));
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
                        <Paper 
                            sx={{ p: 3, height: '100%', borderRadius: 4, boxShadow: 3, cursor: 'pointer' }}
                            onClick={() => navigate('/contracts')}
                        >
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
                                        <ListItem 
                                            key={con.id} 
                                            button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/contracts`);
                                            }} 
                                            sx={{ bgcolor: 'background.default', mb: 1, borderRadius: 2 }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                                    <AssignmentIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={`Contract #${con.id}`}
                                                secondary={`Rent: $${con.rent || con.rent_amount || 'N/A'}`}
                                            />
                                            <Chip label={con.status} color="success" size="small" />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Paper>
                    </Grid>

                    {/* Issues Section */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3, borderRadius: 4, boxShadow: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h5" fontWeight="bold">Reported Issues</Typography>
                                {/* ✅ ACTIVATED BUTTON */}
                                <Button 
                                    startIcon={<ReportProblemIcon />} 
                                    variant="outlined" 
                                    size="small"
                                    onClick={handleOpenReportModal}
                                >
                                    Report New Issue
                                </Button>
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
                                                    <Chip label={issue.status} size="small" 
                                                        color={issue.status === 'resolved' ? 'success' : 'default'} 
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(issue.created_at).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

                {/* ✅ REPORT ISSUE MODAL */}
                <Dialog open={openIssueModal} onClose={() => setOpenIssueModal(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Report an Issue</DialogTitle>
                    <DialogContent>
                        <Box component="form" sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            
                            {/* 1. Contract Selection (Required) */}
                            <FormControl fullWidth>
                                <InputLabel>Select Property (Contract)</InputLabel>
                                <Select
                                    value={issueForm.contract_id}
                                    label="Select Property (Contract)"
                                    onChange={(e) => setIssueForm({ ...issueForm, contract_id: e.target.value })}
                                >
                                    {contracts.map(con => (
                                        <MenuItem key={con.id} value={con.id}>
                                            {con.property_address || `Contract #${con.id}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* 2. Issue Title */}
                            <TextField
                                label="Issue Title"
                                fullWidth
                                required
                                placeholder="e.g., Leaky Faucet in Bathroom"
                                value={issueForm.title}
                                onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                            />

                            {/* 3. Category & Severity */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={issueForm.category}
                                        label="Category"
                                        onChange={(e) => setIssueForm({ ...issueForm, category: e.target.value })}
                                    >
                                        <MenuItem value="maintenance">Maintenance</MenuItem>
                                        <MenuItem value="noise">Noise Complaint</MenuItem>
                                        <MenuItem value="safety">Safety Concern</MenuItem>
                                        <MenuItem value="hygiene">Hygiene/Cleanliness</MenuItem>
                                        <MenuItem value="contract_dispute">Contract Dispute</MenuItem>
                                        <MenuItem value="other">Other</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel>Severity</InputLabel>
                                    <Select
                                        value={issueForm.severity}
                                        label="Severity"
                                        onChange={(e) => setIssueForm({ ...issueForm, severity: e.target.value })}
                                    >
                                        <MenuItem value="low">Low</MenuItem>
                                        <MenuItem value="medium">Medium</MenuItem>
                                        <MenuItem value="high">High</MenuItem>
                                        <MenuItem value="critical">Critical</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* 4. Description */}
                            <TextField
                                label="Detailed Description"
                                fullWidth
                                multiline
                                rows={4}
                                required
                                value={issueForm.description}
                                onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenIssueModal(false)} color="inherit">Cancel</Button>
                        <Button onClick={handleIssueSubmit} variant="contained" color="error">
                            Submit Report
                        </Button>
                    </DialogActions>
                </Dialog>

            </Container>
        </>
    );
}