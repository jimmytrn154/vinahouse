import React, { useEffect, useState } from 'react';
import { Container, Grid, Card, CardMedia, CardContent, Typography, CardActions, Button, Chip, TextField, Box, InputAdornment } from '@mui/material';
import { listingService } from '../../services/api';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export default function ListingSearch() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadListings = async () => {
      try {
        const res = await listingService.getAll();
        setListings(res.data.listings || []);
      } catch (error) {
        console.error("Failed to load listings", error);
      }
    };
    loadListings();
  }, []);

  const filteredListings = listings.filter(l =>
    l.property_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.description && l.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <Navbar title="Find Your Home" />
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8, mb: 4, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Discover Your Perfect Space
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Browse verified listings for students and professionals.
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by location or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ bgcolor: 'white', borderRadius: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          Available Listings ({filteredListings.length})
        </Typography>

        <Grid container spacing={4}>
          {filteredListings.map((l) => (
            <Grid item xs={12} sm={6} md={4} key={l.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 4, boxShadow: 3, transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 } }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={l.image_url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80"}
                  alt="House"
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      ${l.price}
                    </Typography>
                    <Chip label={l.status} color={l.status === 'verified' ? 'success' : 'default'} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                    <LocationOnIcon fontSize="small" /> {l.property_address}
                  </Typography>
                  {l.room_name && <Chip label={`Room: ${l.room_name}`} size="small" variant="outlined" sx={{ mb: 1 }} />}
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {l.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button variant="contained" fullWidth onClick={() => navigate(`/listings/${l.id}`)}>
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}