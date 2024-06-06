

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const jwtAuth = (req, res, next) => {
  try {
    // Check for authorization header presence
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(400).json({ message: 'Authorization header missing' });
    }

    // Extract token from authorization header (format: 'Bearer <token>')
    const token = authHeader.split(' ')[1]; // Assuming 'Bearer' scheme
    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }

    // Verify token using JWT secret
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // Attach verified user info to request object
    next(); // Continue to the next middleware
  } catch (error) {
    console.error(error);
    // Handle specific errors
    if (error.name === 'JsonWebTokenError') { // Invalid token format or signature
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') { // Expired token
      return res.status(401).json({ message: 'Token expired' });
    } else { // Other errors
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
};

module.exports = { jwtAuth };