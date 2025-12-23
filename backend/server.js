const express = require('express');
const cors = require('cors');
const http = require('http'); // 1. Import HTTP
const { Server } = require('socket.io'); // 2. Import Socket.io
require('dotenv').config();
const pool = require('./config/database');

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

const ALLOWED_ORIGIN = process.env.CLIENT_URL || "http://localhost:3000";

const app = express();
const PORT = process.env.PORT || 5000; // Recommendation: Use 5000 for backend to avoid conflict with React (3000)


// 3. Create HTTP Server
const server = http.createServer(app);

// 4. Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: [ALLOWED_ORIGIN], // Trust both Prod and Local
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: [ALLOWED_ORIGIN],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Attach 'io' to every request so controllers can use it
app.use((req, res, next) => {
  req.io = io;
  next();
});

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

// Socket.io Connection Event (Optional: for debugging)
io.on('connection', (socket) => {
  console.log('⚡ A user connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

pool.query('SELECT 1')
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
  });
// 6. Start SERVER (not app)
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`⚡ Socket.io enabled`);
});

module.exports = app;