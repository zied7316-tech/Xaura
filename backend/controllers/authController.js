const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Added for direct password comparison in login
const mongoose = require('mongoose'); // Required for connection state check
const { generateEmailVerificationToken, generatePasswordResetToken, hashToken } = require('../utils/generateToken');
const globalEmailService = require('../services/globalEmailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name, phone, role, salonId, birthday } = req.body;

    // Prevent anyone from registering as SuperAdmin via API
    if (role === 'SuperAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot register as Super Admin via API'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Generate email verification token
    const verificationToken = generateEmailVerificationToken();
    const hashedVerificationToken = hashToken(verificationToken);

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      phone,
      role: role || 'Client',
      salonId: salonId || null,
      birthday: birthday ? new Date(birthday) : null,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    // Send verification email
    let emailSent = false;
    let emailError = null;
    try {
      console.log(`[AUTH] Attempting to send verification email to ${user.email}`);
      const emailResult = await globalEmailService.sendVerificationEmail(user, verificationToken);
      console.log(`[AUTH] Email result:`, { success: emailResult?.success, error: emailResult?.error, messageId: emailResult?.messageId });
      
      if (emailResult && emailResult.success) {
        emailSent = true;
        console.log(`[AUTH] ✅ Verification email sent successfully to ${user.email.substring(0, 3)}***`);
        console.log(`[AUTH] Email MessageId: ${emailResult.messageId || 'N/A'}`);
      } else {
        emailError = emailResult?.error || 'Failed to send verification email';
        console.error('[AUTH] ❌ Email sending failed:', emailError);
        console.error('[AUTH] Email result details:', emailResult);
      }
    } catch (emailError) {
      console.error('[AUTH] ❌ Exception sending verification email:', emailError);
      console.error('[AUTH] Error stack:', emailError.stack);
      emailError = emailError.message || 'Failed to send verification email';
    }

    // Generate token
    const token = generateToken(user._id);

    // Return response with email status
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        salonId: user.salonId,
        avatar: user.avatar,
        birthday: user.birthday,
        emailVerified: user.emailVerified,
      },
      message: emailSent 
        ? 'Registration successful! Please check your email to verify your account.'
        : 'Registration successful! However, we could not send the verification email. Please use the resend option.',
      emailSent,
      emailError: emailSent ? null : emailError
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Check database connection before querying
    const dbState = mongoose.connection.readyState;
    if (dbState !== 1) {
      console.error('[LOGIN] Database not connected. State:', dbState, '(0=disconnected, 1=connected, 2=connecting, 3=disconnecting)');
      
      // If connecting, wait a bit and retry once
      if (dbState === 2) {
        console.log('[LOGIN] Database is connecting, waiting 500ms...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check again
        if (mongoose.connection.readyState === 1) {
          console.log('[LOGIN] Database connected after wait');
        } else {
          return res.status(503).json({
            success: false,
            message: 'Database is connecting. Please try again in a moment.',
          });
        }
      } else {
        // Disconnected or disconnecting - return error
        return res.status(503).json({
          success: false,
          message: 'Database connection unavailable. Please try again in a moment.',
        });
      }
    }

    // Log connection pool status for debugging
    const poolSize = mongoose.connection.db?.serverConfig?.poolSize || 'unknown';
    console.log(`[LOGIN] DB connected, pool size: ${poolSize}`);

    const queryStart = Date.now();
    // Check if user exists and get password (optimized query)
    // Use lean() for faster query (returns plain object, not Mongoose document)
    // Use hint() to force index usage
    const user = await User.findOne({ email: normalizedEmail })
      .select('+password')
      .lean() // Faster - returns plain object instead of Mongoose document
      .hint({ email: 1 }) // Force use of email index
      .maxTimeMS(5000); // 5 second timeout (reduced from 8s - fail faster if DB is slow)
    
    const queryDuration = Date.now() - queryStart;
    if (queryDuration > 1000) {
      console.warn(`[LOGIN] ⚠️ Slow query: ${queryDuration}ms for email: ${normalizedEmail.substring(0, 3)}***`);
    } else {
      console.log(`[LOGIN] ✅ Query fast: ${queryDuration}ms`);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if password matches (bcrypt comparison - can be slow, but necessary)
    // Since we used lean(), we need to compare password directly with bcrypt
    // Add timeout wrapper for bcrypt to prevent hanging
    const bcryptStart = Date.now();
    let isMatch = false;
    
    try {
      // Wrap bcrypt in Promise.race to timeout after 3 seconds
      isMatch = await Promise.race([
        bcrypt.compare(password, user.password),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Bcrypt comparison timeout')), 3000)
        )
      ]);
    } catch (bcryptError) {
      if (bcryptError.message === 'Bcrypt comparison timeout') {
        console.error('[LOGIN] ⚠️ Bcrypt comparison timed out (>3s)');
        return res.status(504).json({
          success: false,
          message: 'Login request timed out. Please try again.',
        });
      }
      throw bcryptError;
    }
    
    const bcryptDuration = Date.now() - bcryptStart;
    if (bcryptDuration > 500) {
      console.warn(`[LOGIN] ⚠️ Slow bcrypt: ${bcryptDuration}ms`);
    } else {
      console.log(`[LOGIN] ✅ Bcrypt fast: ${bcryptDuration}ms`);
    }
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token (fast operation)
    const token = generateToken(user._id);

    // Return response immediately (minimal data)
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        salonId: user.salonId,
        avatar: user.avatar,
        birthday: user.birthday,
      },
    });
  } catch (error) {
    console.error('[LOGIN] Error:', error.name, error.message);
    
    // Handle timeout errors specifically
    if (error.name === 'MongoServerError' && (error.message?.includes('operation exceeded time limit') || error.message?.includes('timeout'))) {
      console.error('[LOGIN] Database query timeout');
      return res.status(504).json({
        success: false,
        message: 'Login request timed out. Please try again.',
      });
    }
    
    // Handle database connection errors
    if (error.name === 'MongoServerError' || error.name === 'MongooseError') {
      console.error('[LOGIN] Database error:', error.message);
      return res.status(503).json({
        success: false,
        message: 'Database connection issue. Please try again in a moment.',
      });
    }
    
    next(error);
  }
};

/**
 * @desc    Verify JWT token
 * @route   POST /api/auth/verify-token
 * @access  Public
 */
const verifyToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        salonId: user.salonId,
        avatar: user.avatar,
        birthday: user.birthday,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      valid: false,
      message: 'Invalid token'
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('salonId', 'name');

    res.json({
      success: true,
      user: {
        id: user._id,
        userID: user.userID, // Include userID
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        salonId: user.salonId,
        avatar: user.avatar,
        birthday: user.birthday,
        paymentModel: user.paymentModel,
        status: user.status,
        vipStatus: user.vipStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify email address
 * @route   GET /api/auth/verify-email
 * @access  Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
    }

    // Hash the token to compare with stored token
    const hashedToken = hashToken(token);

    // Find user with this token and not expired
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    // Update user
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    // Send welcome email
    try {
      await globalEmailService.sendWelcomeEmail(user);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail verification if welcome email fails
    }

    res.json({
      success: true,
      message: 'Email verified successfully!',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified',
      });
    }

    // Generate new verification token
    const verificationToken = generateEmailVerificationToken();
    const hashedVerificationToken = hashToken(verificationToken);

    user.emailVerificationToken = hashedVerificationToken;
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send verification email
    try {
      const emailResult = await globalEmailService.sendVerificationEmail(user, verificationToken);
      if (emailResult && emailResult.success) {
        console.log(`[AUTH] Verification email resent successfully to ${user.email.substring(0, 3)}***`);
        res.json({
          success: true,
          message: 'Verification email sent successfully',
        });
      } else {
        const errorMsg = emailResult?.error || 'Failed to send verification email';
        console.error('[AUTH] Email sending failed:', errorMsg);
        res.status(500).json({
          success: false,
          message: errorMsg || 'Failed to send verification email. Please check email service configuration.',
        });
      }
    } catch (emailError) {
      console.error('[AUTH] Error sending verification email:', emailError);
      res.status(500).json({
        success: false,
        message: emailError.message || 'Failed to send verification email. Please check email service configuration.',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot password - send reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken();
    const hashedResetToken = hashToken(resetToken);

    // Save reset token to user
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send reset email
    try {
      const emailResult = await globalEmailService.sendPasswordResetEmail(user, resetToken);
      
      if (!emailResult || !emailResult.success) {
        console.error('[AUTH] Email sending failed:', emailResult?.error || 'Unknown error');
        
        // Clear the token if email fails
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        return res.status(500).json({
          success: false,
          message: emailResult?.error || 'Failed to send password reset email. Please try again later.',
        });
      }

      console.log(`[AUTH] ✅ Password reset email sent successfully to ${user.email.substring(0, 3)}***`);
      console.log(`[AUTH] Email MessageId: ${emailResult.messageId || 'N/A'}`);
      
      res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    } catch (emailError) {
      console.error('[AUTH] Error sending password reset email:', emailError);
      
      // Clear the token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Hash the token to compare with stored token
    const hashedToken = hashToken(token);

    // Find user with this token and not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyToken,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
