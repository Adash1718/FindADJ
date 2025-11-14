const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database initialization
const db = require('./database');

// API Routes
app.use('/api/auth', require('./routes/clerkAuth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/queue', require('./routes/queue'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/profiles', require('./routes/profiles'));

// Admin routes
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
} else {
  // In development, show admin dashboard
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin Dashboard: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});

