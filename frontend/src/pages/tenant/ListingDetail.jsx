import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box, Divider, Alert } from '@mui/material';
import { listingService, requestService, authService } from '../../services/api';
import Navbar from '../../components/Navbar';

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

  if (!listing) return <Typography>Loading...</Typography>;

  return (
    <>
      <Navbar title="Listing Details" />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h3" color="primary">${listing.price}</Typography>
          <Typography variant="subtitle1" color="text.secondary">per month</Typography>
          
          <Box sx={{ my: 3 }}>
             <Typography variant="h5">{listing.property_address}</Typography>
             {listing.room_name && <Typography variant="h6" color="info.main">Room: {listing.room_name}</Typography>}
             <Typography sx={{ mt: 2 }}>{listing.description}</Typography>
          </Box>

          <Divider />
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button variant="contained" size="large" onClick={handleRequestRent} disabled={user?.role === 'landlord'}>
              Request to Rent
            </Button>
            {user?.role === 'landlord' && <Alert severity="warning">Landlords cannot rent listings.</Alert>}
          </Box>
        </Paper>
      </Container>
    </>
  );
}