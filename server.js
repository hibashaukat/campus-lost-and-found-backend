const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 1. Middlewares
app.use(express.json());
app.use(cors());

// 2. MongoDB Connection Logic
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
  }
};

connectDB();

// 3. Status Route
app.get('/', (req, res) => {
  res.json({
    status: "Online",
    message: "Campus Lost & Found API is running!",
    dbStatus: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
  });
});

// 4. API Routes (Inhein check karlein ke file paths sahi hain)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/comments', require('./routes/comments'));

// 5. Export for Vercel
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
