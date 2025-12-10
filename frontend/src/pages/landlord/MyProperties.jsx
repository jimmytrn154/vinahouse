import React, { useEffect, useState } from 'react';
import { 
  Container, Grid, Typography, Button, Card, CardContent, CardActions, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, CircularProgress
} from '@mui/material';
import AddHomeIcon from '@mui/icons-material/AddHome';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import { useNavigate } from 'react-router-dom';
// ✅ FIXED IMPORT
import api, { propertyService, authService } from '../../services/api';

export default function MyProperties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openPropDialog, setOpenPropDialog] = useState(false);
  const [openRoomDialog, setOpenRoomDialog] = useState(false);
  const [selectedPropId, setSelectedPropId] = useState(null);
  const [error, setError] = useState('');
  
  const [propForm, setPropForm] = useState({ address: '', description: '' });
  const [roomForm, setRoomForm] = useState({ room_name: '', capacity: 1, area_m2: 0, base_rent: 0 });

  const currentUser = authService.getCurrentUser();

  const fetchProperties = async () => {
    try {
      // ✅ FIX: Pass owner_id query param as supported by your controller
      const res = await propertyService.getAll({ owner_id: currentUser.id });
      
      // ✅ FIX: Access .properties array from response object
      setProperties(res.data.properties || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleCreateProperty = async () => {
    try {
      await propertyService.create(propForm); // Controller infers owner_user_id from token
      setOpenPropDialog(false);
      setPropForm({ address: '', description: '' });
      fetchProperties();
    } catch (err) { alert(err.response?.data?.error || "Error creating property"); }
  };

  const handleCreateRoom = async () => {
    try {
      // ✅ FIX: Controller requires property_id in BODY, not just URL
      const payload = {
        ...roomForm,
        property_id: selectedPropId 
      };
      
      await propertyService.createRoom(selectedPropId, payload);
      
      setOpenRoomDialog(false);
      setRoomForm({ room_name: '', capacity: 1, area_m2: 0, base_rent: 0 });
      alert("Room added successfully!");
    } catch (err) { 
      // Detailed error logging for validation errors
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || "Error";
      alert("Error adding room: " + msg); 
    }
  };

  if (loading) return <Container sx={{mt:4}}><CircularProgress /></Container>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4">My Properties</Typography>
        <Button variant="contained" startIcon={<AddHomeIcon />} onClick={() => setOpenPropDialog(true)}>
          Add Property
        </Button>
      </Grid>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={3}>
        {properties.map((prop) => (
          <Grid item xs={12} md={6} key={prop.id}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6">{prop.address}</Typography>
                <Typography color="text.secondary" gutterBottom>{prop.description}</Typography>
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<MeetingRoomIcon />} onClick={() => {
                  setSelectedPropId(prop.id);
                  setOpenRoomDialog(true);
                }}>
                  Add Room
                </Button>
                <Button size="small" variant="contained" onClick={() => navigate(`/landlord/create-listing/${prop.id}`)}>
                  Create Listing
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ADD PROPERTY DIALOG */}
      <Dialog open={openPropDialog} onClose={() => setOpenPropDialog(false)}>
        <DialogTitle>Add New Property</DialogTitle>
        <DialogContent>
          <TextField label="Address" fullWidth margin="dense" value={propForm.address} onChange={e => setPropForm({...propForm, address: e.target.value})} />
          <TextField label="Description" fullWidth multiline rows={3} margin="dense" value={propForm.description} onChange={e => setPropForm({...propForm, description: e.target.value})} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPropDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateProperty}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* ADD ROOM DIALOG */}
      <Dialog open={openRoomDialog} onClose={() => setOpenRoomDialog(false)}>
        <DialogTitle>Add Room</DialogTitle>
        <DialogContent>
          <TextField label="Room Name" fullWidth margin="dense" value={roomForm.room_name} onChange={e => setRoomForm({...roomForm, room_name: e.target.value})} />
          <TextField label="Capacity" type="number" fullWidth margin="dense" value={roomForm.capacity} onChange={e => setRoomForm({...roomForm, capacity: e.target.value})} />
          <TextField label="Area (m2)" type="number" fullWidth margin="dense" value={roomForm.area_m2} onChange={e => setRoomForm({...roomForm, area_m2: e.target.value})} />
          <TextField label="Base Rent ($)" type="number" fullWidth margin="dense" value={roomForm.base_rent} onChange={e => setRoomForm({...roomForm, base_rent: e.target.value})} />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenRoomDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateRoom}>Save Room</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}