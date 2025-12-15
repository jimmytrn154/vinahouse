import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, TextField, Button, MenuItem, Grid, Alert } from '@mui/material';
import { propertyService, listingService } from '../../services/api';
import api from '../../services/api'; 
import Navbar from '../../components/Navbar';

export default function CreateListing() {
  const { propertyId } = useParams(); // Passed from URL
  const navigate = useNavigate();
  
  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [listingType, setListingType] = useState('whole_house'); // or 'room'
  
  const [formData, setFormData] = useState({
    price: '',
    deposit: '',
    available_from: new Date().toISOString().split('T')[0], // Today YYYY-MM-DD
    room_id: '' 
  });

  useEffect(() => {
    const loadData = async () => {
      // 1. Get Property Details
      const pRes = await propertyService.getById(propertyId);
      setProperty(pRes.data.property || pRes.data); // Adjust based on controller response structure

      // 2. Get Rooms (Assumption: API exists)
      // If you haven't made this endpoint yet, listing by room will fail silently or be empty.
      try {
        const rRes = await api.get(`/properties/${propertyId}/rooms`); // Check your routes
        setRooms(rRes.data.rooms || []);
      } catch (e) { console.log("No rooms found or endpoint missing"); }
    };
    loadData();
  }, [propertyId]);

  const handleSubmit = async () => {
    try {
      // 1. Create the base payload with common fields
      const payload = {
        price: parseFloat(formData.price),
        deposit: parseFloat(formData.deposit),
        available_from: formData.available_from
      };

      // 2. Conditionally add ONLY the ID we need
      // We use parseInt to ensure we send Numbers, not Strings
      if (listingType === 'whole_house') {
        payload.property_id = parseInt(propertyId);
        // Do NOT add room_id here
      } else {
        payload.room_id = parseInt(formData.room_id);
        // Do NOT add property_id here
      }

      // 3. Send request
      await listingService.create(payload);
      alert("Listing published successfully!");
      navigate('/landlord/dashboard');
    } catch (err) {
      // Helper to extract the exact validation error from backend
      const msg = err.response?.data?.errors?.[0]?.msg || 
                  err.response?.data?.error || 
                  "Error creating listing";
      console.error("Listing Error:", err.response?.data);
      alert("Error: " + msg);
    }
  };

  return (
    <>
      <Navbar title="Create Listing" />
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>Create New Listing</Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
             for {property?.address}
          </Typography>

          <TextField 
            select 
            label="What are you renting out?" 
            fullWidth 
            margin="normal"
            value={listingType}
            onChange={(e) => setListingType(e.target.value)}
          >
            <MenuItem value="whole_house">Whole Property</MenuItem>
            <MenuItem value="room">Specific Room</MenuItem>
          </TextField>

          {listingType === 'room' && (
             <TextField 
             select 
             label="Select Room" 
             fullWidth 
             margin="normal"
             value={formData.room_id}
             onChange={(e) => setFormData({...formData, room_id: e.target.value})}
           >
             {rooms.map(r => (
               <MenuItem key={r.id} value={r.id}>{r.room_name}</MenuItem>
             ))}
           </TextField>
          )}

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField label="Monthly Price ($)" type="number" fullWidth margin="normal" 
                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Deposit ($)" type="number" fullWidth margin="normal" 
                value={formData.deposit} onChange={e => setFormData({...formData, deposit: e.target.value})} />
            </Grid>
          </Grid>

          <TextField label="Available From" type="date" fullWidth margin="normal" 
             InputLabelProps={{ shrink: true }}
             value={formData.available_from} onChange={e => setFormData({...formData, available_from: e.target.value})} />

          <Button variant="contained" fullWidth size="large" sx={{ mt: 3 }} onClick={handleSubmit}>
            Publish Listing
          </Button>
        </Paper>
      </Container>
    </>
  );
}