const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Simplified authentication - just check for user headers
const authenticate = (req, res, next) => {
  const userId = req.header('X-User-Id');
  const userType = req.header('X-User-Type');

  console.log('Auth Middleware - User ID:', userId);
  console.log('Auth Middleware - User Type:', userType);

  if (!userId || !userType) {
    console.error('Missing user information in headers');
    return res.status(401).json({ error: 'User information required' });
  }

  req.user = {
    id: userId,
    user_type: userType
  };
  console.log('User authenticated:', req.user);
  next();
};

const requireUserType = (userType) => {
  return (req, res, next) => {
    console.log('Checking user type. Required:', userType, 'Current:', req.user.user_type);
    if (req.user.user_type !== userType) {
      console.error('Access denied. User type mismatch:', req.user.user_type, 'vs required:', userType);
      return res.status(403).json({ error: `Access denied. Requires ${userType} account. You have ${req.user.user_type}.` });
    }
    console.log('User type check passed');
    next();
  };
};

module.exports = { authenticate, requireUserType, JWT_SECRET };

