import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, Container, TextField, Typography, Paper, 
  Tab, Tabs, Alert, MenuItem, CircularProgress 
} from '@mui/material';
import { authService } from '../services/api';

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'tenant'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTabChange = (event, newValue) => {
    setIsLogin(newValue === 0);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await authService.login(formData.email, formData.password);
        navigate('/dashboard'); 
      } else {
        await authService.register(formData);
        navigate('/dashboard');
      }
    } catch (err) {
      // Handle errors from your backend (express-validator array or simple error string)
      const errorMsg = err.response?.data?.error || 
                       err.response?.data?.errors?.[0]?.msg || 
                       'An unexpected error occurred';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom color="primary">
            VinHousing
          </Typography>
          
          <Tabs value={isLogin ? 0 : 1} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 3 }}>
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {!isLogin && (
              <>
                <TextField
                  margin="normal" required fullWidth id="full_name" label="Full Name"
                  name="full_name" autoFocus value={formData.full_name} onChange={handleChange}
                />
                 <TextField
                  margin="normal" fullWidth id="phone" label="Phone Number"
                  name="phone" value={formData.phone} onChange={handleChange}
                />
                <TextField
                  margin="normal" select fullWidth id="role" label="I am a..."
                  name="role" value={formData.role} onChange={handleChange}
                >
                  <MenuItem value="tenant">Tenant (Looking for housing)</MenuItem>
                  <MenuItem value="landlord">Landlord (Listing property)</MenuItem>
                </TextField>
              </>
            )}

            <TextField
              margin="normal" required fullWidth id="email" label="Email Address"
              name="email" autoComplete="email" autoFocus={isLogin}
              value={formData.email} onChange={handleChange}
            />
            <TextField
              margin="normal" required fullWidth name="password" label="Password"
              type="password" id="password" autoComplete="current-password"
              value={formData.password} onChange={handleChange}
            />

            <Button
              type="submit" fullWidth variant="contained"
              sx={{ mt: 3, mb: 2, height: '48px' }} disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : (isLogin ? 'Sign In' : 'Sign Up')}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}