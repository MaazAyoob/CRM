const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // For hashing passwords
const jwt = require('jsonwebtoken'); // For user sessions
const User = require('../../models/User'); // Import your User model
const auth = require('../../middleware/auth'); // Import the standard auth middleware

// --- A secret key for your JWT ---
// (In a real app, put this in a .env file, not in the code)
const JWT_SECRET = 'your_super_secret_key_12345';

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // 1. Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // 2. Create new user instance
    user = new User({
      name,
      email,
      password,
      // Note: 'role' defaults to 'user' as defined in the model
    });

    // 3. Encrypt the password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 4. Save user to database
    await user.save();

    // 5. Create and return a JSON Web Token (JWT)
    const payload = {
      user: {
        id: user.id,
        role: user.role, // Include the role in the token
      },
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        // --- THIS IS THE FIX ---
        // We will catch the error here instead of crashing
        if (err) {
          console.error('JWT Signing Error:', err);
          return res.status(500).json({ msg: 'Token generation failed' });
        }
        res.json({ token }); // Send token to the client
      }
    );
  } catch (err) {
    console.error('Register Route Error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token (Login)
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // 2. Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // 3. Create and return JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role, // Send the role to the frontend
      },
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        // --- THIS IS THE FIX ---
        if (err) {
          console.error('JWT Signing Error:', err);
          return res.status(500).json({ msg: 'Token generation failed' });
        }
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Login Route Error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/auth
// @desc    Get logged in user
// @access  Private
// (This is a useful route to check if a token is valid)
router.get('/', auth, async (req, res) => {
  try {
    // We get the user from the 'auth' middleware
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;