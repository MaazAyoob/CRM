// backend/server.js

// Import necessary modules
const express = require('express');
const cors = require('cors'); // Middleware for Cross-Origin Resource Sharing
const connectDB = require('./config/db'); // Function to connect to MongoDB

// Initialize the Express application
const app = express();

// --- Connect to the MongoDB Database ---
connectDB();

// --- Initialize Middleware ---
// 1. Body Parser: Allows Express to understand incoming JSON request bodies
app.use(express.json({ extended: false }));

// 2. CORS Configuration (Specific Origin)
// Get the allowed frontend URL from environment variables, fallback to localhost for development
const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
console.log('Configuring CORS to allow requests from:', frontendURL); // Log the origin being used

const corsOptions = {
    origin: frontendURL, // Allow requests only from this specific origin
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};
app.use(cors(corsOptions)); // Apply the CORS middleware with specific options

// --- Define API Routes ---
// Link base URL paths to their respective route handler files
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/contacts', require('./routes/api/contacts'));
app.use('/api/deals', require('./routes/api/deals'));
app.use('/api/admin', require('./routes/api/admin'));
app.use('/api/tasks', require('./routes/api/tasks'));
app.use('/api/teams', require('./routes/api/teams'));
app.use('/api/performance', require('./routes/api/performance'));
app.use('/api/activities', require('./routes/api/activities'));
app.use('/api/appointments', require('./routes/api/appointments')); // Ensure appointments route is included

// --- Basic Root Route (Optional: For testing if the server is up) ---
app.get('/', (req, res) => res.send('Backend API is Running'));

// --- Define the Port ---
// Use the port assigned by Render (process.env.PORT) or default to 5000 locally
const PORT = process.env.PORT || 5000;

// --- Start the Server ---
app.listen(PORT, () => console.log(`Backend server started successfully on port ${PORT}`));
