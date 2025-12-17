import React, { useEffect, useState } from 'react';
import {
    Container, Paper, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, Chip, Tabs, Tab,
    Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Card, CardContent, IconButton, Tooltip
} from '@mui/material';
import Navbar from '../../components/Navbar';
import { listingService, verificationService } from '../../services/api';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

export default function VerificationList() {
    const [items, setItems] = useState([]);
    const [tabValue, setTabValue] = useState(0); // 0: pending, 1: verified, 2: rejected
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [notes, setNotes] = useState('');

    // Map tab index to listing status
    const statusMap = ['pending_verification', 'verified', 'rejected'];

    const fetchItems = async () => {
        try {
            const res = await listingService.getAll({ status: statusMap[tabValue] });
            setItems(res.data.listings || []);
        } catch (error) {
            console.error("Error fetching items", error);
            setItems([]);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [tabValue]);

    const handleAction = (item, action) => {
        setSelectedItem({ ...item, nextStatus: action });
        setNotes('');
        setOpenDialog(true);
    };

    const confirmAction = async () => {
        try {
            await verificationService.create({
                target_type: 'listing',
                target_id: selectedItem.id,
                status: selectedItem.nextStatus,
                notes: notes
            });

            if (selectedItem.nextStatus === 'rejected') {
                await listingService.update(selectedItem.id, { status: 'rejected' });
            }

            setOpenDialog(false);
            fetchItems();
        } catch (error) {
            console.error("Error updating verification", error);
            alert("Error updating verification status");
        }
    };

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 4 }}>
            <Navbar title="Verification Center" />
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <VerifiedUserIcon fontSize="large" /> Verification Center
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Review and approve new property listings.
                    </Typography>
                </Box>

                <Card elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
                    <Tabs
                        value={tabValue}
                        onChange={(e, v) => setTabValue(v)}
                        indicatorColor="primary"
                        textColor="primary"
                        variant="fullWidth"
                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                        <Tab label="Pending Review" sx={{ fontWeight: 600 }} />
                        <Tab label="Verified Listings" sx={{ fontWeight: 600 }} />
                        <Tab label="Rejected" sx={{ fontWeight: 600 }} />
                    </Tabs>
                </Card>

                <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>Property</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Price</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Landlord</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Submitted Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.length > 0 ? (
                                items.map((row) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                {row.property_address}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                ID: {row.id}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold" color="primary.main">
                                                ${Number(row.price).toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{row.owner_name || `User #${row.owner_user_id}`}</TableCell>
                                        <TableCell>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={row.status.replace('_', ' ').toUpperCase()}
                                                color={row.status === 'verified' ? 'success' : row.status === 'rejected' ? 'error' : 'warning'}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontWeight: 'bold', borderRadius: 1 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                <Tooltip title="View Details">
                                                    <IconButton size="small" color="info">
                                                        <VisibilityIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                {row.status === 'pending_verification' && (
                                                    <>
                                                        <Tooltip title="Approve">
                                                            <IconButton
                                                                size="small"
                                                                color="success"
                                                                onClick={() => handleAction(row, 'verified')}
                                                            >
                                                                <CheckCircleIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Reject">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleAction(row, 'rejected')}
                                                            >
                                                                <CancelIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            No listings found in this category.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Action Dialog */}
                <Dialog
                    open={openDialog}
                    onClose={() => setOpenDialog(false)}
                    PaperProps={{ sx: { borderRadius: 3, minWidth: 400 } }}
                >
                    <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
                        {selectedItem?.nextStatus === 'verified' ? 'Approve Listing' : 'Reject Listing'}
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            You are about to mark <strong>{selectedItem?.property_address}</strong> as <strong>{selectedItem?.nextStatus?.toUpperCase()}</strong>.
                        </Typography>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Add a note (Optional)"
                            fullWidth
                            multiline
                            rows={3}
                            variant="outlined"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            sx={{ mt: 2 }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setOpenDialog(false)} color="inherit">Cancel</Button>
                        <Button
                            onClick={confirmAction}
                            variant="contained"
                            color={selectedItem?.nextStatus === 'verified' ? 'success' : 'error'}
                            disableElevation
                        >
                            Confirm Action
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}
