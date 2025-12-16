import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box, Divider, Alert, Grid, Chip, Stack } from '@mui/material';
import { listingService, requestService, authService } from '../../services/api';
import Navbar from '../../components/Navbar';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import VerifiedIcon from '@mui/icons-material/Verified';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const user = authService.getCurrentUser();

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await listingService.getById(id);
        setListing(res.data.listing);
      } catch (e) { alert("Listing not found"); }
    };
    fetchDetail();
  }, [id]);

  const handleRequestRent = async () => {
    try {
      if (!user) return navigate('/login');

      await requestService.create({
        listing_id: listing.id,
        desired_move_in: listing.available_from, // Defaulting to availability date
        message: "I am interested in this place. Please contact me."
      });

      alert("Request Sent! The landlord will review it.");
      navigate('/dashboard'); // Tenant dashboard
    } catch (err) {
      alert("Error: " + err.response?.data?.error);
    }
  };

  if (!listing) return <Typography sx={{ p: 4 }}>Loading...</Typography>;

  return (
    <>
      <Navbar title="Listing Details" />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back to Search
        </Button>

        <Grid container spacing={4}>
          {/* Left Column: Image & Status */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ borderRadius: 4, overflow: 'hidden' }}>
              <Box
                component="img"
                src={listing.image_url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80"}
                alt="Property"
                sx={{ width: '100%', height: 400, objectFit: 'cover' }}
              />
            </Paper>
          </Grid>

          {/* Right Column: Details */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {listing.status === 'verified' && <Chip icon={<VerifiedIcon />} label="Verified Listing" color="success" />}
                <Chip label={listing.status} variant="outlined" />
              </Box>

              <Typography variant="h3" fontWeight="bold" gutterBottom>
                ${listing.price} <Typography component="span" variant="h6" color="text.secondary">/ month</Typography>
              </Typography>

              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocationOnIcon color="action" /> {listing.property_address}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Stack spacing={2} sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AttachMoneyIcon color="primary" />
                  <Typography><strong>Deposit:</strong> ${listing.deposit_amount}</Typography>
                </Box>
                {listing.room_name && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <MeetingRoomIcon color="primary" />
                    <Typography><strong>Room:</strong> {listing.room_name}</Typography>
                  </Box>
                )}
              </Stack>

              <Typography variant="h6" gutterBottom>Description</Typography>
              <Typography color="text.secondary" paragraph>
                {listing.description}
              </Typography>

              <Box sx={{ mt: 4 }}>
                {user?.role === 'landlord' ? (
                  <Alert severity="warning">Landlords cannot rent listings.</Alert>
                ) : (
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleRequestRent}
                    sx={{ py: 2, fontSize: '1.1rem', borderRadius: 2 }}
                  >
                    Request to Rent
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}