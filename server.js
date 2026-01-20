// MongoDB connection - isay server.js mein replace karein
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) return;
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds wait karega
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
  }
};

connectDB();

// Status route (isay bhi update karein taake error nazar aaye)
app.get('/', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting"
  };

  res.json({ 
    status: 'Online',
    dbStatus: states[dbState],
    message: 'Campus Lost & Found API is running!',
    // Agar disconnect hai toh ye line debug mein help karegi
    timestamp: new Date().toISOString()
  });
});
