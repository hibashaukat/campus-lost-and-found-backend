require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Improved CORS for Vercel
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://campus-lost-and-found-frontend-b1xq.vercel.app'
    ];
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MongoDB connection - Isay server.js mein yahan paste karein
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 // 5 seconds ke baad timeout ho jaye agar connect na ho
})
.then(() => console.log('Connected to MongoDB'))
.catch((error) => {
  console.error('Error connecting to MongoDB:', error.message);
});

// 3. Health Check Route
app.get('/', (req, res) => {
  res.json({ 
    status: 'Online',
    message: 'Campus Lost & Found API is running!',
    dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Routes
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const commentRoutes = require('./routes/comments');

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/comments', commentRoutes);

// 4. Error Handling Middleware (Build fail hone se bachata hai)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
