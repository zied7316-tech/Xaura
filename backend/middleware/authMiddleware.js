const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    // Log incoming request for walk-in endpoint
    if (req.path && req.path.includes('walk-in')) {
      console.log('[AUTH] ========== PROTECT MIDDLEWARE - WALK-IN REQUEST ==========');
      console.log('[AUTH] Path:', req.path);
      console.log('[AUTH] Method:', req.method);
      console.log('[AUTH] Has Authorization header:', !!req.headers.authorization);
    }
    
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      if (req.path && req.path.includes('walk-in')) {
        console.log('[AUTH] Token extracted, length:', token ? token.length : 0);
      }
    }

    if (!token) {
      if (req.path && req.path.includes('walk-in')) {
        console.log('[AUTH] ❌ No token provided');
      }
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (req.path && req.path.includes('walk-in')) {
        console.log('[AUTH] Token decoded, user ID:', decoded.id);
      }

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      if (req.path && req.path.includes('walk-in')) {
        console.log('[AUTH] User found:', user ? { id: user._id, role: user.role, isActive: user.isActive } : 'NOT FOUND');
      }

      if (!user) {
        if (req.path && req.path.includes('walk-in')) {
          console.log('[AUTH] ❌ User not found');
        }
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        if (req.path && req.path.includes('walk-in')) {
          console.log('[AUTH] ❌ User account deactivated');
        }
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      // Attach user to request
      req.user = user;
      if (req.path && req.path.includes('walk-in')) {
        console.log('[AUTH] ✅ User authenticated, proceeding to authorize');
      }
      next();
    } catch (error) {
      if (req.path && req.path.includes('walk-in')) {
        console.error('[AUTH] ❌ Token verification failed:', error.message);
      }
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token invalid or expired'
      });
    }
  } catch (error) {
    if (req.path && req.path.includes('walk-in')) {
      console.error('[AUTH] ❌ Protect middleware error:', error.message);
    }
    next(error);
  }
};

/**
 * Check if user has specific role(s)
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (req.path && req.path.includes('walk-in')) {
      console.log('[AUTH] ========== AUTHORIZE MIDDLEWARE - WALK-IN REQUEST ==========');
      console.log('[AUTH] User:', req.user ? { id: req.user._id, role: req.user.role } : 'NO USER');
      console.log('[AUTH] Required roles:', roles);
    }
    
    if (!req.user) {
      if (req.path && req.path.includes('walk-in')) {
        console.log('[AUTH] ❌ No user in request');
      }
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Normalize role for comparison (handle both 'SuperAdmin' and 'super-admin')
    const normalizeRole = (role) => {
      if (role === 'super-admin') return 'SuperAdmin';
      if (role === 'SuperAdmin') return 'SuperAdmin';
      return role;
    };

    const userRole = normalizeRole(req.user.role);
    const normalizedRoles = roles.map(r => normalizeRole(r));

    if (req.path && req.path.includes('walk-in')) {
      console.log('[AUTH] User role:', userRole, 'Normalized required:', normalizedRoles);
    }

    if (!normalizedRoles.includes(userRole)) {
      if (req.path && req.path.includes('walk-in')) {
        console.log('[AUTH] ❌ Role not authorized');
      }
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`
      });
    }

    if (req.path && req.path.includes('walk-in')) {
      console.log('[AUTH] ✅ Role authorized, proceeding to controller');
    }
    next();
  };
};

/**
 * Check if user owns the salon
 */
const checkSalonOwnership = async (req, res, next) => {
  try {
    const salonId = req.params.id || req.params.salonId || req.body.salonId;
    
    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: 'Salon ID is required'
      });
    }

    const Salon = require('../models/Salon');
    const salon = await Salon.findById(salonId);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Check if user is the owner
    if (salon.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to perform this action on this salon'
      });
    }

    req.salon = salon;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
  authorize,
  checkSalonOwnership
};

