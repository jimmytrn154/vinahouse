import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton } from '@mui/material'; // Keeping Skeleton for loading state
import { listingService, requestService, authService } from '../../services/api';
import Navbar from '../../components/Navbar';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VerifiedIcon from '@mui/icons-material/Verified';
import BedIcon from '@mui/icons-material/Bed';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';

// Import the new CSS
import './ListingDetail.css';

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
        message: "I am interested in this place. Please contact me.",
        desired_move_in: listing.available_from
      });

      alert("Request Sent! The landlord will review it.");
      navigate('/dashboard');
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <div className="ld-root">
        <Navbar title="" />
        <div className="ld-container" style={{ marginTop: '20px' }}>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3, mb: 4 }} />
          <Skeleton variant="text" height={60} width="60%" />
          <Skeleton variant="text" height={30} width="40%" />
        </div>
      </div>
    );
  }

  if (!listing) return (
    <div className="ld-root" style={{ textAlign: 'center', paddingTop: '100px' }}>
      <h2>Listing not found</h2>
      <button className="ld-back-btn" style={{ margin: '20px auto' }} onClick={() => navigate('/')}>
        Return Home
      </button>
    </div>
  );

  return (
    <div className="ld-root">
      <Navbar title="" />

      <div className="ld-container">
        
        {/* --- HEADER --- */}
        <div className="ld-header">
          <button className="ld-back-btn" onClick={() => navigate(-1)} style={{ marginBottom: '16px' }}>
             <ArrowBackIcon fontSize="small" /> Back
          </button>
          
          <h1 className="ld-title">
            {listing.room_name ? `${listing.room_name} at ` : ''}{listing.property_address}
          </h1>
          
          <div className="ld-header-meta">
            <div className="ld-location-row">
               <StarIcon fontSize="small" /> 
               <span>New Listing</span>
               <span>·</span>
               <span style={{ textDecoration: 'underline' }}>{listing.property_address}</span>
            </div>
            {/* Share/Save buttons could go here */}
          </div>
        </div>

        {/* --- HERO IMAGE --- */}
        <div className="ld-image-container">
            {listing.status === 'verified' && (
                <div className="ld-status-badge">
                    <VerifiedIcon sx={{ fontSize: 16, color: '#10b981' }} /> Verified
                </div>
            )}
            <img 
                src={listing.image_url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80"}
                alt="Property"
                className="ld-hero-img"
            />
        </div>

        {/* --- GRID CONTENT --- */}
        <div className="ld-grid">
            
            {/* LEFT COLUMN: Main Info */}
            <div className="ld-main-content">
                
                {/* Host Section */}
                <div className="ld-section">
                    <div className="ld-host-row">
                        <div className="ld-host-info">
                            <h3>Hosted by {listing.owner_name || 'Landlord'}</h3>
                            <p style={{ color: '#717171', margin: 0 }}>
                                {listing.unit_name === 'Whole Property' ? 'Whole house' : 'Private room'} · {listing.capacity || 1} guest(s)
                            </p>
                        </div>
                        <div className="ld-host-avatar">
                             {/* Placeholder avatar logic */}
                             <img src={`https://ui-avatars.com/api/?name=${listing.owner_name}&background=random`} alt="Host" />
                        </div>
                    </div>
                </div>

                {/* Features Highlights */}
                <div className="ld-section">
                    <div className="ld-amenities-grid">
                        <div className="ld-amenity-item">
                            <SquareFootIcon /> <span>{listing.area_m2 || 'N/A'} m² Area</span>
                        </div>
                        <div className="ld-amenity-item">
                            <PeopleIcon /> <span>Up to {listing.capacity} Person(s)</span>
                        </div>
                        <div className="ld-amenity-item">
                            <BedIcon /> <span>{listing.unit_name === 'Whole Property' ? 'Multiple Beds' : '1 Bedroom'}</span>
                        </div>
                        <div className="ld-amenity-item">
                            <VerifiedIcon /> <span>University Verified</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="ld-section">
                    <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px' }}>About this place</h3>
                    <p className="ld-description">
                        {listing.description || "No description provided for this listing. Please contact the landlord for more details."}
                    </p>
                </div>

                {/* Location Map Placeholder */}
                <div className="ld-section">
                    <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px' }}>Where you'll be</h3>
                    <div style={{ background: '#f0f0f0', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#717171' }}>
                         <LocationOnIcon fontSize="large" />
                         <p>{listing.property_address}</p>
                         <small>(Map integration coming soon)</small>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Sticky Booking Card */}
            <div className="ld-sidebar">
                <div className="ld-sticky-wrapper">
                    <div className="ld-booking-card">
                        <div className="ld-price-header">
                            <div>
                                <span className="ld-price-amount">${Number(listing.price).toLocaleString()}</span>
                                <span className="ld-price-period"> / month</span>
                            </div>
                        </div>

                        <div className="ld-booking-details">
                            <div className="ld-detail-row">
                                <span className="ld-label">Move-in Date</span>
                                <span className="ld-value">
                                    {listing.available_from ? new Date(listing.available_from).toLocaleDateString() : 'Immediately'}
                                </span>
                            </div>
                            <div className="ld-detail-row">
                                <span className="ld-label">Deposit</span>
                                <span className="ld-value">${Number(listing.deposit).toLocaleString()}</span>
                            </div>
                        </div>

                        {user?.role === 'landlord' ? (
                            <button className="ld-request-btn" style={{ background: '#333', cursor: 'default' }} disabled>
                                You are the Host
                            </button>
                        ) : (
                            <button className="ld-request-btn" onClick={handleRequestRent}>
                                Request to Rent
                            </button>
                        )}

                        <p className="ld-no-charge-text">You won't be charged yet</p>

                        <div className="ld-summary-row">
                            <span style={{ textDecoration: 'underline' }}>First month rent</span>
                            <span>${Number(listing.price).toLocaleString()}</span>
                        </div>
                        <div className="ld-summary-row">
                            <span style={{ textDecoration: 'underline' }}>Security Deposit</span>
                            <span>${Number(listing.deposit).toLocaleString()}</span>
                        </div>

                        <div className="ld-total-row">
                            <span>Total due at signing</span>
                            <span>${(Number(listing.price) + Number(listing.deposit)).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}