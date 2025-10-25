const express = require('express');
const router = express.Router();
const adminAuth = require('../../middleware/adminAuth');
const Team = require('../../models/Team');
const User = require('../../models/User');

// @route   POST /api/teams
// @desc    Create a new team
// @access  Admin
router.post('/', adminAuth, async (req, res) => {
  const { name } = req.body;
  try {
    let team = await Team.findOne({ name });
    if (team) {
      return res.status(400).json({ msg: 'Team with this name already exists' });
    }
    team = new Team({ name });
    await team.save();
    res.json(team);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/teams
// @desc    Get all teams (and populate member names)
// @access  Admin
router.get('/', adminAuth, async (req, res) => {
  try {
    const teams = await Team.find().populate('members', 'name email').populate('leader', 'name');
    res.json(teams);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/teams/:teamId/members/:userId
// @desc    Add a user to a team
// @access  Admin
router.put('/:teamId/members/:userId', adminAuth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    const user = await User.findById(req.params.userId);

    if (!team || !user) {
      return res.status(404).json({ msg: 'Team or User not found' });
    }

    // Add user to team's member list if not already there
    if (!team.members.includes(user.id)) {
      team.members.push(user.id);
    }
    // Set the user's team field
    user.team = team.id;

    await team.save();
    await user.save();

    res.json(team.members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/teams/:teamId/members/:userId
// @desc    Remove a user from a team
// @access  Admin
router.delete('/:teamId/members/:userId', adminAuth, async (req, res) => {
   try {
    const team = await Team.findById(req.params.teamId);
    const user = await User.findById(req.params.userId);

    if (!team || !user) {
      return res.status(404).json({ msg: 'Team or User not found' });
    }

    // Remove user from team's member list
    team.members = team.members.filter(memberId => memberId.toString() !== user.id);
    
    // Set the user's team field back to null
    user.team = null;

    await team.save();
    await user.save();

    res.json(team.members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add routes for deleting teams, assigning leaders etc. as needed

module.exports = router;