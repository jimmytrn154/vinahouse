import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { propertyService, authService } from '../../services/api';
import Navbar from '../../components/Navbar'; // ✅ Added Navbar
import './MyProperties.css'; // ✅ Added Custom Styles

export default function MyProperties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [openPropDialog, setOpenPropDialog] = useState(false);
  const [openRoomDialog, setOpenRoomDialog] = useState(false);
  const [selectedPropId, setSelectedPropId] = useState(null);
  
  const [error, setError] = useState('');
  
  // Forms
  const [propForm, setPropForm] = useState({ address: '', description: '' });
  const [roomForm, setRoomForm] = useState({ room_name: '', capacity: 1, area_m2: 0, base_rent: 0 });

  const currentUser = authService.getCurrentUser();

  const fetchProperties = async () => {
    try {
      const res = await propertyService.getAll({ owner_id: currentUser.id });
      setProperties(res.data.properties || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load properties. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleCreateProperty = async (e) => {
    e.preventDefault(); // Prevent page reload
    try {
      await propertyService.create(propForm);
      setOpenPropDialog(false);
      setPropForm({ address: '', description: '' });
      fetchProperties();
    } catch (err) { alert(err.response?.data?.error || "Error creating property"); }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...roomForm, property_id: selectedPropId };
      await propertyService.createRoom(selectedPropId, payload);
      setOpenRoomDialog(false);
      setRoomForm({ room_name: '', capacity: 1, area_m2: 0, base_rent: 0 });
      alert("Room added successfully!");
    } catch (err) { 
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || "Error";
      alert("Error adding room: " + msg); 
    }
  };

  if (loading) return (
    <>
      <Navbar title="My Properties" />
      <div style={{ textAlign: 'center', marginTop: '50px', color: '#666' }}>Loading properties...</div>
    </>
  );

  return (
    <>
      <Navbar title="My Properties" />
      
      <div className="property-container">
        {/* Header */}
        <div className="page-header">
            <div>
                <h1 className="page-title">My Properties</h1>
                <p style={{color: '#64748b', marginTop: '0.5rem'}}>Manage your buildings and create listings.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-outline" onClick={() => navigate('/landlord/dashboard')}>
                    Back to Dashboard
                </button>
                <button className="btn btn-primary" onClick={() => setOpenPropDialog(true)}>
                    + Add Property
                </button>
            </div>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

        {/* Property Grid */}
        <div className="property-grid">
          {properties.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
                <p>You haven't added any properties yet.</p>
                <button className="btn btn-primary" style={{marginTop: '1rem'}} onClick={() => setOpenPropDialog(true)}>Add your first property</button>
            </div>
          ) : (
            properties.map((prop) => (
              <div className="property-card" key={prop.id}>
                <div className="property-address">{prop.address}</div>
                <div className="property-desc">
                    {prop.description || "No description provided."}
                </div>
                <div className="card-actions">
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => {
                    setSelectedPropId(prop.id);
                    setOpenRoomDialog(true);
                  }}>
                    Add Room
                  </button>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate(`/landlord/create-listing/${prop.id}`)}>
                    Create Listing
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* --- CUSTOM MODAL: Add Property --- */}
        {openPropDialog && (
          <div className="modal-overlay" onClick={() => setOpenPropDialog(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2 className="modal-title">Add New Property</h2>
              <form onSubmit={handleCreateProperty}>
                <div className="form-group">
                    <label className="form-label">Full Address</label>
                    <input 
                        type="text" className="form-input" required autoFocus
                        value={propForm.address} 
                        onChange={e => setPropForm({...propForm, address: e.target.value})} 
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Description (Optional)</label>
                    <textarea 
                        className="form-input" rows="3"
                        value={propForm.description} 
                        onChange={e => setPropForm({...propForm, description: e.target.value})} 
                    />
                </div>
                <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setOpenPropDialog(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Create Property</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- CUSTOM MODAL: Add Room --- */}
        {openRoomDialog && (
          <div className="modal-overlay" onClick={() => setOpenRoomDialog(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2 className="modal-title">Add Room</h2>
              <form onSubmit={handleCreateRoom}>
                <div className="form-group">
                    <label className="form-label">Room Name (e.g. Room 101)</label>
                    <input 
                        type="text" className="form-input" required autoFocus
                        value={roomForm.room_name} 
                        onChange={e => setRoomForm({...roomForm, room_name: e.target.value})} 
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Capacity (People)</label>
                        <input 
                            type="number" className="form-input" required min="1"
                            value={roomForm.capacity} 
                            onChange={e => setRoomForm({...roomForm, capacity: e.target.value})} 
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Area (m²)</label>
                        <input 
                            type="number" className="form-input" 
                            value={roomForm.area_m2} 
                            onChange={e => setRoomForm({...roomForm, area_m2: e.target.value})} 
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Base Rent Estimate ($)</label>
                    <input 
                        type="number" className="form-input" 
                        value={roomForm.base_rent} 
                        onChange={e => setRoomForm({...roomForm, base_rent: e.target.value})} 
                    />
                </div>
                <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setOpenRoomDialog(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Save Room</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}