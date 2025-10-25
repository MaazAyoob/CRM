const express = require('express');
const router = express.Router();
const adminAuth = require('../../middleware/adminAuth'); // Your admin-only middleware
const User = require('../../models/User');

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', adminAuth, async (req, res) => {
  try {
    // Find all users but do not include their passwords
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update a user's role
// @access  Admin
router.put('/users/:id', adminAuth, async (req, res) => {
  const { role } = req.body;

  // Simple validation: must be 'user' or 'admin'
  if (role !== 'user' && role !== 'admin') {
    return res.status(400).json({ msg: 'Invalid role.' });
  }

  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Do not let an admin demote themselves
    if (user.id === req.user.id && role === 'user') {
      return res.status(400).json({ msg: 'Admin cannot demote self.' });
    }
    
    user.role = role;
    await user.save();
    
    // Return the updated user (without password)
    const updatedUser = user.toObject();
    delete updatedUser.password;
    
    res.json(updatedUser);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Admin
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Add a check to prevent an admin from deleting their own account
    if (user.id === req.user.id) {
      return res.status(400).json({ msg: 'You cannot delete your own admin account.' });
    }

    await User.findByIdAndRemove(req.params.id);
    res.json({ msg: 'User deleted successfully.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;