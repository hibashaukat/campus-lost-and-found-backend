require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose'); // Yeh line hona zaroori hai
const cors = require('cors');
const path = require('path');

const app = express(); // Yeh line bhi upar honi chahiye

// 1. Middleware
app.use(cors({
    origin: ["https://campus-lost-and-found-frontend-b1xq.vercel.app", "http://localhost:5173"],
    credentials: true
}));
app.use(express.json());

// 2. Database Connection Logic
const connectDB = async () => {
    try {
        if (mongoose.connection.readyState >= 1) return;
        
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected Successfully");
    } catch (err) {
        console.error("MongoDB Connection Error:", err.message);
    }
};

// Database connect karein
connectDB();

// 3. Routes
app.get('/', (req, res) => {
    res.json({
        status: "Online",
        database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        message: "API is working perfectly!"
    });
});

// Important: Check karein ke routes files exist karti hain
try {
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/items', require('./routes/items'));
    app.use('/api/comments', require('./routes/comments'));
} catch (routeError) {
    console.error("Route Loading Error:", routeError.message);
}

// 4. Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
