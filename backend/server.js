const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const propertyRoutes = require('./routes/properties');
const listingRoutes = require('./routes/listings');
const rentalRequestRoutes = require('./routes/rentalRequests');
const contractRoutes = require('./routes/contracts');
const issueRoutes = require('./routes/issues');
const reviewRoutes = require('./routes/reviews');
const organizationRoutes = require('./routes/organizations');
const verificationRoutes = require('./routes/verifications');

// Import error handler
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// app.use(cors({
//   origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
//   credentials: true
// }));

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'VinHousing API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/rental-requests', rentalRequestRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/verifications', verificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;

