const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_super_secret_key_12345'; // Use the same secret

// This middleware will be used on routes that *only* admins can access
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
    
    // 4. THIS IS THE ADMIN CHECK
    if (decoded.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Not an admin.' });
    }

    // 5. If token is valid AND user is an admin, proceed
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};