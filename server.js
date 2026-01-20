require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// 1. CORS Setup
app.use(cors({
    origin: ["https://campus-lost-and-found-frontend-b1xq.vercel.app", "http://localhost:5173"],
    credentials: true
}));
app.use(express.json());

// 2. Database Connection (Crash-Proof Logic)
const connectDB = async () => {
    try {
        if (mongoose.connection.readyState >= 1) return;
        
        console.log("Attempting to connect to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log("MongoDB Connected Successfully");
    } catch (err) {
        console.error("MongoDB Connection Error:", err.message);
        // Server ko crash hone se bachaane ke liye process exit nahi karenge
    }
};

// Start connection but don't block the app
connectDB();

// 3. Health Check Route
app.get('/', (req, res) => {
    const status = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
    res.json({
        status: "Online",
        database: status,
        message: "API is alive!"
    });
});

// 4. Routes
// Make sure these paths are correct according to your folders
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/comments', require('./routes/comments'));

// 5. Port Listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));

module.exports = app;
