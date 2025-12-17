import React, { useEffect, useState } from 'react';
import {
    Container, Paper, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, Chip, TextField,
    Box, InputAdornment, Avatar, IconButton, Tooltip, Card, CardContent
} from '@mui/material';
import Navbar from '../../components/Navbar';
import { userService } from '../../services/api';
import SearchIcon from '@mui/icons-material/Search';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await userService.getAll();
            const usersData = res.data.users || res.data || [];
            setUsers(Array.isArray(usersData) ? usersData : []);
        } catch (error) {
            console.error("Error fetching users", error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleStatusChange = async (userId, newStatus) => {
        if (!window.confirm(`Are you sure you want to set this user to ${newStatus}?`)) return;
        try {
            await userService.updateStatus(userId, newStatus);
            fetchUsers();
        } catch (error) {
            alert("Error updating user status");
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'secondary';
            case 'landlord': return 'primary';
            default: return 'default';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'suspended': return 'warning';
            case 'deleted': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 4 }}>
            <Navbar title="User Management" />
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            User Management
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Manage system users, roles, and account statuses
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchUsers}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </Box>

                <Card elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
                    <CardContent>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ bgcolor: 'background.paper' }}
                        />
                    </CardContent>
                </Card>

                <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Joined Date</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <TableRow
                                        key={user.id}
                                        sx={{ '&:hover': { bgcolor: 'action.hover' }, transition: 'background-color 0.2s' }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{ bgcolor: user.role === 'admin' ? 'secondary.main' : 'primary.main' }}>
                                                    {user.full_name.charAt(0).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                        {user.full_name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {user.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={user.role === 'admin' ? <AdminPanelSettingsIcon /> : <PersonIcon />}
                                                label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                color={getRoleColor(user.role)}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontWeight: 500 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.status.toUpperCase()}
                                                color={getStatusColor(user.status)}
                                                size="small"
                                                sx={{ fontWeight: 'bold', borderRadius: 1 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            {user.role !== 'admin' && (
                                                <Tooltip title={user.status === 'active' ? "Suspend User" : "Activate User"}>
                                                    <IconButton
                                                        color={user.status === 'active' ? 'error' : 'success'}
                                                        onClick={() => handleStatusChange(user.id, user.status === 'active' ? 'suspended' : 'active')}
                                                    >
                                                        {user.status === 'active' ? <BlockIcon /> : <CheckCircleOutlineIcon />}
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            No users found matching your search.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        </Box>
    );
}
