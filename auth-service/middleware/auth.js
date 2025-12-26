const { verifyAccessToken } = require('../utils/jwt');
const { findUserById } = require('../models/user');

/**
 * Authentication middleware - require valid JWT
 */
function requireAuth(db) {
  return async (req, res, next) => {
    try {
      // Get token from Authorization header or cookie
      let token = null;
      
      if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.substring(7);
      } else if (req.cookies?.access_token) {
        token = req.cookies.access_token;
      }
      
      if (!token) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'No access token provided'
        });
      }
      
      // Verify token
      const decoded = verifyAccessToken(token);
      
      if (!decoded) {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'Access token is invalid or expired'
        });
      }
      
      // Get user from database
      const user = await findUserById(db, decoded.id);
      
      if (!user) {
        return res.status(401).json({
          error: 'User not found',
          message: 'User associated with this token does not exist'
        });
      }
      
      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({
        error: 'Authentication failed',
        message: error.message
      });
    }
  };
}

/**
 * Optional authentication - attach user if token is valid
 */
function optionalAuth(db) {
  return async (req, res, next) => {
    try {
      let token = null;
      
      if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.substring(7);
      } else if (req.cookies?.access_token) {
        token = req.cookies.access_token;
      }
      
      if (token) {
        const decoded = verifyAccessToken(token);
        if (decoded) {
          const user = await findUserById(db, decoded.id);
          if (user) {
            req.user = user;
          }
        }
      }
      
      next();
    } catch (error) {
      // Continue without authentication
      next();
    }
  };
}

/**
 * Check if user owns the resource
 */
function requireOwnership(resourceUserIdGetter) {
  return (req, res, next) => {
    const resourceUserId = resourceUserIdGetter(req);
    
    if (!req.user || req.user.id !== resourceUserId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
    }
    
    next();
  };
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireOwnership
};
