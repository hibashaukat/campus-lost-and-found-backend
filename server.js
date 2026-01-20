require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express(); // 1. Create app FIRST
const PORT = process.env.PORT || 5000;

// 2. Middleware SECOND
app.use(cors({
 origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'https://campus-lost-and-found-frontend-b1xq.vercel.app' // <--- Note: No slash at the end
],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
.catch((error) => console.error('Error connecting to MongoDB:', error));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Campus Lost & Found API is running!' });
});

// Routes
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const commentRoutes = require('./routes/comments');

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/comments', commentRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; // Important for Vercel