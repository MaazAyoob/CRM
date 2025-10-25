// backend/routes/api/performance.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // Needed for ObjectId validation

// Middleware
const auth = require('../../middleware/auth'); // Standard user authentication
const adminAuth = require('../../middleware/adminAuth'); // Admin-only authentication

// Models
const Deal = require('../../models/Deal');
const User = require('../../models/User');
const Team = require('../../models/Team');
const Contact = require('../../models/Contact'); // Needed for lead source summary

// --- Helper Function ---
// Calculates basic deal statistics from an array of deals
const calculateDealStats = (deals) => {
  const stats = {
    totalDeals: deals.length,
    wonDeals: 0,
    lostDeals: 0,
    openDeals: 0,
    totalValue: 0, // Total value of all deals
    wonValue: 0,   // Total value of won deals
    openValue: 0,  // Total value of open (not won/lost) deals
  };

  deals.forEach(deal => {
    // Ensure value is treated as a number, default to 0 if missing
    const dealValue = Number(deal.value) || 0;
    stats.totalValue += dealValue;

    if (deal.stage === 'Won') {
      stats.wonDeals++;
      stats.wonValue += dealValue;
    } else if (deal.stage === 'Lost') {
      stats.lostDeals++;
    } else {
      // Any stage other than 'Won' or 'Lost' is considered open
      stats.openDeals++;
      stats.openValue += dealValue;
    }
  });
  return stats;
};

// --- API Routes ---

// @route   GET /api/performance/me
// @desc    Get performance stats for the currently logged-in user
// @access  Private (Requires standard login)
router.get('/me', auth, async (req, res) => {
  try {
    // Find all deals owned by the logged-in user (ID from auth middleware)
    const deals = await Deal.find({ owner: req.user.id });
    // Calculate stats based on these deals
    const stats = calculateDealStats(deals);
    // Return the user info (from token) and their stats
    res.json({ user: req.user, stats });
  } catch (err) {
    console.error("Error fetching 'my' performance:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/performance/users/:userId
// @desc    Get performance stats for a specific user ID
// @access  Admin (Requires admin login)
router.get('/users/:userId', adminAuth, async (req, res) => {
  // Validate if the provided userId is a valid MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ msg: 'Invalid User ID format.' });
  }
  try {
    // Find the user by ID, excluding their password
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
        return res.status(404).json({ msg: 'User not found.' });
    }
    // Find all deals owned by this specific user
    const deals = await Deal.find({ owner: req.params.userId });
    // Calculate stats
    const stats = calculateDealStats(deals);
    // Return the user details and their stats
    res.json({ user, stats });
  } catch (err) {
    console.error(`Error fetching performance for user ${req.params.userId}:`, err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/performance/teams
// @desc    Get performance stats aggregated for all teams
// @access  Admin
router.get('/teams', adminAuth, async (req, res) => {
  try {
    // Find all teams and populate their member IDs and names
    const teams = await Team.find().populate('members', '_id name');
    let allTeamStats = []; // Array to hold stats for each team

    // Iterate through each team asynchronously
    for (const team of teams) {
      // Get the IDs of all members in the current team
      const memberIds = team.members.map(member => member._id);
      // Find all deals where the owner is one of the team members
      const deals = await Deal.find({ owner: { $in: memberIds } });
      // Calculate stats for this team's deals
      const stats = calculateDealStats(deals);
      // Add the team's info and stats to the results array
      allTeamStats.push({
        teamId: team._id,
        teamName: team.name,
        memberCount: team.members.length,
        stats // Include the calculated stats object
      });
    }

    res.json(allTeamStats); // Send the array of team stats
  } catch (err) {
    console.error("Error fetching all team performance:", err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/performance/teams/:teamId
// @desc    Get performance stats for a specific team ID
// @access  Admin
router.get('/teams/:teamId', adminAuth, async (req, res) => {
   // Validate teamId format
   if (!mongoose.Types.ObjectId.isValid(req.params.teamId)) {
      return res.status(400).json({ msg: 'Invalid Team ID format.' });
  }
  try {
    // Find the specific team by ID and populate member details
    const team = await Team.findById(req.params.teamId).populate('members', '_id name email'); // Get more member details
     if (!team) {
        return res.status(404).json({ msg: 'Team not found.' });
    }

    // Get member IDs for the deal query
    const memberIds = team.members.map(member => member._id);
    // Find deals owned by members of this team
    const deals = await Deal.find({ owner: { $in: memberIds } });
    // Calculate stats for this team
    const stats = calculateDealStats(deals);

    // Return detailed team info, member list, and stats
    res.json({
        teamId: team._id,
        teamName: team.name,
        memberCount: team.members.length,
        members: team.members, // Include the populated member list
        stats
      });

  } catch (err) {
    console.error(`Error fetching performance for team ${req.params.teamId}:`, err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/performance/lead-source-summary
// @desc    Get counts of contacts aggregated by lead source
// @access  Admin
router.get('/lead-source-summary', adminAuth, async (req, res) => {
  try {
    // Use MongoDB aggregation pipeline to group contacts
    const summary = await Contact.aggregate([
      {
        $match: { owner: { $exists: true } } // Optional: Exclude contacts without owners if necessary
      },
      {
        $group: { // Group documents by the value in the 'leadSource' field
          _id: '$leadSource', // The field to group by (null groups contacts without a source)
          count: { $sum: 1 }   // Count the number of documents in each group
        }
      },
      {
        $sort: { count: -1 } // Sort the results by count in descending order
      },
      {
         $project: { // Reshape the output documents
             _id: 0, // Exclude the default '_id' field from the output
             source: '$_id', // Rename '_id' (which contains the leadSource) to 'source'
             count: 1 // Include the 'count' field
         }
      }
    ]);
    res.json(summary); // Send the summary array
  } catch (err) {
    console.error("Lead Source Summary Error:", err.message);
    res.status(500).send('Server Error');
  }
});


// Export the router
module.exports = router;