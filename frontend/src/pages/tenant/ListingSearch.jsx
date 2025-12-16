import React, { useEffect, useState } from 'react';
import { Container, Grid, Card, CardMedia, CardContent, Typography, CardActions, Button, Chip } from '@mui/material';
import { listingService } from '../../services/api';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';

export default function ListingSearch() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const loadListings = async () => {
      // Fetch all listings. In real app, you'd add filters here.
      const res = await listingService.getAll(); 
      // Filter for only 'verified' or 'available' listings if you want
      setListings(res.data.listings || []);
    };
    loadListings();
  }, []);

  return (
    <>
      <Navbar title="Find Your Home" />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Available Listings</Typography>
        
        <Grid container spacing={3}>
          {listings.map((l) => (
            <Grid item xs={12} md={4} key={l.id}>
              <Card>
                {/* Placeholder Image */}
                <CardMedia component="img" height="140" image="https://via.placeholder.com/300" alt="House" />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    ${l.price} / month
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {l.property_address}
                  </Typography>
                  {l.room_name && <Chip label={`Room: ${l.room_name}`} size="small" sx={{ mt: 1 }} />}
                  <Chip label={l.status} color={l.status === 'verified' ? 'success' : 'default'} size="small" sx={{ mt: 1, ml: 1 }} />
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate(`/listings/${l.id}`)}>View Details</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}