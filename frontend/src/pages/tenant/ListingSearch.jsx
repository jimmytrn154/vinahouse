
import React, { useEffect, useState } from 'react';
import {
  Container, Grid, Card, CardMedia, CardContent, Typography, CardActions,
  Button, Chip, TextField, Box, InputAdornment, MenuItem, Select, FormControl, InputLabel, Paper
} from '@mui/material';
import { listingService } from '../../services/api';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FilterListIcon from '@mui/icons-material/FilterList';
import BedIcon from '@mui/icons-material/Bed';
import VerifiedIcon from '@mui/icons-material/Verified';

export default function ListingSearch() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('');

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

  const filteredListings = listings.filter(l => {
    const matchesSearch = l.property_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.description && l.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (priceFilter === 'low') return matchesSearch && l.price < 500;
    if (priceFilter === 'medium') return matchesSearch && l.price >= 500 && l.price <= 1000;
    if (priceFilter === 'high') return matchesSearch && l.price > 1000;

    return matchesSearch;
  });

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Navbar title="Find Your Home" />

      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          bgcolor: 'primary.main',
          color: 'white',
          py: { xs: 6, md: 10 },
          mb: 6,
          textAlign: 'center',
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight="800" gutterBottom sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            Discover Your Perfect Space
          </Typography>
          <Typography variant="h5" sx={{ mb: 6, opacity: 0.9, fontWeight: 300, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
            Browse verified listings for students and professionals.
          </Typography>

          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              borderRadius: 3,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by location, amenities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ bgcolor: 'transparent' }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Price Range</InputLabel>
              <Select
                value={priceFilter}
                label="Price Range"
                onChange={(e) => setPriceFilter(e.target.value)}
              >
                <MenuItem value="">Any Price</MenuItem>
                <MenuItem value="low">Under $500</MenuItem>
                <MenuItem value="medium">$500 - $1,000</MenuItem>
                <MenuItem value="high">Above $1,000</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              size="large"
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem', borderRadius: 2 }}
            >
              Search
            </Button>
          </Paper>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Available Listings <Chip label={filteredListings.length} color="primary" size="small" sx={{ ml: 1, fontWeight: 'bold' }} />
          </Typography>
          <Button startIcon={<FilterListIcon />} color="inherit">More Filters</Button>
        </Box>

        <Grid container spacing={4}>
          {filteredListings.map((l) => (
            <Grid item xs={12} sm={6} md={4} key={l.id}>
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 4,
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="240"
                    image={l.image_url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80"}
                    alt="House"
                  />
                  <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 1 }}>
                    {l.status === 'verified' && (
                      <Chip
                        icon={<VerifiedIcon sx={{ color: 'white !important', fontSize: '1rem' }} />}
                        label="Verified"
                        size="small"
                        sx={{ bgcolor: 'success.main', color: 'white', fontWeight: 'bold', boxShadow: 1 }}
                      />
                    )}
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 12,
                      left: 12,
                      bgcolor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 2,
                      backdropFilter: 'blur(4px)',
                      fontWeight: 'bold'
                    }}
                  >
                    ${Number(l.price).toLocaleString()}/mo
                  </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom noWrap title={l.property_address}>
                    {l.room_name ? `${l.room_name} at` : ''}{l.property_address.split(',')[0]}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                    <LocationOnIcon fontSize="small" color="action" /> {l.property_address}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <BedIcon fontSize="small" color="action" />
                      <Typography variant="caption" fontWeight="bold">{l.capacity || 1} Bed</Typography>
                    </Box>
                    {/* Add more icons if data available */}
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{
                    display: '-webkit-box',
                    overflow: 'hidden',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                    mb: 2
                  }}>
                    {l.description}
                  </Typography>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate(`/listings/${l.id}`)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}