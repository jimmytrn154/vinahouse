import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Button, Box, Divider, Alert, Grid, Chip, Stack,
  Avatar, Card, CardContent, Rating, Skeleton
} from '@mui/material';
import { listingService, requestService, authService } from '../../services/api';
import Navbar from '../../components/Navbar';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import VerifiedIcon from '@mui/icons-material/Verified';
import BedIcon from '@mui/icons-material/Bed';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await listingService.getById(id);
        setListing(res.data.listing);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleRequestRent = async () => {
    try {
      if (!user) return navigate('/login');

      await requestService.create({
        listing_id: listing.id,
        desired_move_in: listing.available_from,
        message: "I am interested in this place. Please contact me."
      });

      alert("Request Sent! The landlord will review it.");
      navigate('/dashboard');
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <>
        <Navbar title="Listing Details" />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4, mb: 4 }} />
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Skeleton variant="text" height={60} width="80%" />
              <Skeleton variant="text" height={30} width="40%" />
              <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={300} />
            </Grid>
          </Grid>
        </Container>
      </>
    );
  }

  if (!listing) return (
    <Container sx={{ mt: 10, textAlign: 'center' }}>
      <Typography variant="h5" color="text.secondary">Listing not found</Typography>
      <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>Go Home</Button>
    </Container>
  );

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
      <Navbar title="Listing Details" />

      {/* Hero Image Section */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
        >
          Back to Search
        </Button>

        <Paper
          elevation={4}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
            height: { xs: 300, md: 500 },
            mb: 4
          }}
        >
          <Box
            component="img"
            src={listing.image_url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80"}
            alt="Property"
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              left: 20,
              display: 'flex',
              gap: 1
            }}
          >
            {listing.status === 'verified' && (
              <Chip
                icon={<VerifiedIcon sx={{ color: 'white !important' }} />}
                label="Verified"
                sx={{
                  bgcolor: 'success.main',
                  color: 'white',
                  fontWeight: 'bold',
                  boxShadow: 2
                }}
              />
            )}
            <Chip
              label={listing.status.toUpperCase()}
              sx={{
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
                backdropFilter: 'blur(4px)'
              }}
            />
          </Box>
        </Paper>

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h3" fontWeight="800" gutterBottom color="text.primary">
                {listing.room_name ? `${listing.room_name} at ` : ''}{listing.property_address}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOnIcon color="error" /> {listing.property_address}
              </Typography>
            </Box>

            <Divider sx={{ mb: 4 }} />

            <Typography variant="h5" fontWeight="bold" gutterBottom>
              About this place
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {listing.description || "No description provided for this listing. Please contact the landlord for more details."}
            </Typography>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
              Features & Amenities
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <SquareFootIcon color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Area</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {listing.area_m2 || 'N/A'} m²
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <BedIcon color="primary" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Capacity</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {listing.capacity || 1} Person(s)
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              {/* Add more features dynamically if available in JSON */}
            </Grid>

            {/* Landlord Info */}
            <Box sx={{ mt: 6, p: 3, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 1 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Hosted by {listing.owner_name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                  {listing.owner_name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">Joined {new Date(listing.created_at).getFullYear()}</Typography>
                  <Button size="small" sx={{ mt: 1 }}>Contact Host</Button>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Sidebar Booking Card */}
          <Grid item xs={12} md={4}>
            <Card elevation={6} sx={{ borderRadius: 4, position: 'sticky', top: 100 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
                  ${Number(listing.price).toLocaleString()}
                  <Typography component="span" variant="body1" color="text.secondary" sx={{ ml: 1 }}>
                    / month
                  </Typography>
                </Typography>

                <Stack spacing={2} sx={{ mt: 3, mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography color="text.secondary">Deposit</Typography>
                    <Typography fontWeight="bold">${Number(listing.deposit).toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography color="text.secondary">Available From</Typography>
                    <Typography fontWeight="bold">
                      {listing.available_from ? new Date(listing.available_from).toLocaleDateString() : 'Immediately'}
                    </Typography>
                  </Box>
                </Stack>

                {user?.role === 'landlord' ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    You are viewing this listing as a Landlord.
                  </Alert>
                ) : (
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={<SendIcon />}
                    onClick={handleRequestRent}
                    sx={{
                      py: 2,
                      fontSize: '1.1rem',
                      borderRadius: 3,
                      boxShadow: '0 8px 16px rgba(26, 35, 126, 0.2)'
                    }}
                  >
                    Request to Rent
                  </Button>
                )}

                <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 2 }}>
                  You won't be charged yet
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}