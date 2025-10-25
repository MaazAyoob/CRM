// backend/server.js

// Import necessary modules
const express = require('express'); // Web framework for Node.js
const cors = require('cors'); // Middleware to enable Cross-Origin Resource Sharing (allows frontend to talk to backend)
const connectDB = require('./config/db'); // Function to connect to MongoDB

// Initialize the Express application
const app = express();

// --- Connect to the MongoDB Database ---
// Calls the function defined in ./config/db.js
connectDB();

// --- Initialize Middleware ---
// 1. Body Parser: Allows Express to understand incoming JSON request bodies
app.use(express.json({ extended: false }));
// 2. CORS: Enable requests from your frontend (running on a different port)
app.use(cors());

// --- Define API Routes ---
// Directs requests starting with a specific path to the corresponding route file.
app.use('/api/auth', require('./routes/api/auth')); // Handles user registration, login, getting user data
app.use('/api/contacts', require('./routes/api/contacts')); // Handles CRUD operations for contacts
app.use('/api/deals', require('./routes/api/deals')); // Handles CRUD operations for deals/opportunities
app.use('/api/admin', require('./routes/api/admin')); // Handles admin-specific actions like user management
app.use('/api/tasks', require('./routes/api/tasks')); // Handles CRUD operations for tasks linked to contacts
app.use('/api/teams', require('./routes/api/teams')); // Handles CRUD operations for teams and members
app.use('/api/performance', require('./routes/api/performance')); // Handles endpoints for calculating performance stats
app.use('/api/activities', require('./routes/api/activities')); // Handles fetching the activity feed
app.use('/api/appointments', require('./routes/api/appointments'));

// --- Define the Port ---
// Use the port specified by the hosting environment (like Render, Heroku) or default to 5000 for local development
const PORT = process.env.PORT || 5000;

// --- Start the Server ---
// Make the Express app listen for incoming requests on the specified port
app.listen(PORT, () => console.log(`Backend server started on port ${PORT}`));

// Basic route for the root URL (optional, good for testing if the server is up)
app.get('/', (req, res) => res.send('API Running'));