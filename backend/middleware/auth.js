const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_super_secret_key_12345'; // Use the same secret

// This middleware just checks if a user is logged in (any role)
module.exports = function (req, res, next) {
  // 1. Get token from header
  const token = req.header('x-auth-token');

  // 2. Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // 3. Verify token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4. Add the user (with id and role) to the request object
    req.user = decoded.user;
    next(); // Proceed to the route
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};