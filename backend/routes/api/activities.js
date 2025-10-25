// backend/routes/api/activities.js
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth'); // Standard user authentication middleware
const Activity = require('../../models/Activity'); // The Activity database model

// @route   GET /api/activities
// @desc    Get recent activities, sorted by timestamp, with user details populated.
// @access  Private (Requires any logged-in user)
router.get('/', auth, async (req, res) => {
  try {
    // Find activity documents in the database
    const activities = await Activity.find()
      // Populate the 'user' field: Replace the user ID with the actual user document,
      // but only select the 'name' field from that user document.
      .populate('user', 'name')
      // Sort the results by the 'timestamp' field in descending order (newest first).
      .sort({ timestamp: -1 })
      // Limit the number of results returned to the 50 most recent activities.
      .limit(50);

    // Send the array of found activities back to the client as a JSON response.
    res.json(activities);

  } catch (err) {
    // If any error occurs during the database query or processing:
    console.error("Error fetching activities:", err.message); // Log the error to the server console.
    // Send a generic 500 Internal Server Error response to the client.
    res.status(500).send('Server Error');
  }
});

// Export the router so it can be used in server.js
module.exports = router;