const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // ======================
    // 1. CORE USER IDENTITY
    // ======================
    name: {
      type: String,
      trim: true,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true, // Ensures consistent casing
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Too short password'],
    },

    // ======================
    // 2. PROFILE INFORMATION
    // ======================
    phone: String,
    city: String, // Tunisian-focused (no country needed)
    avatar: {
      type: String,
      default: 'default_avatar.jpg', // Fallback image
    },
    slug: {
      type: String,
      lowercase: true, // For profile URLs (e.g., '/users/john-doe')
    },

    // ======================
    // 3. ROLE & PERMISSIONS
    // ======================
    role: {
      type: String,
      enum: ['jobSeeker', 'company', 'manager', 'admin'],
      default: 'jobSeeker', // Most users will be job seekers
    },

    // Hybrid reference fields
    candidateProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      unique: true,
      sparse: true, // Allows null for non-candidates
    },
    companyProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      unique: true,
      sparse: true, // Allows null for companies
    },

    // ======================
    // 4. ACCOUNT STATUS
    // ======================
    isVerified: {
      type: Boolean,
      default: false, // Becomes true after email verification
    },
    isBlocked: {
      type: Boolean,
      default: false, // Admin-managed suspension
    },
    isDeactivated: {
      type: Boolean,
      default: false, // User-initiated deactivation
    },
    profileCompleted: {
      type: Boolean,
      default: false, // Track onboarding progress
    },

    // ======================
    // 5. ACTIVITY TRACKING
    // ======================
    lastLogin: {
      type: Date, // Last successful login timestamp
    },
    loginAttempts: {
      type: Number,
      default: 0, // Track failed attempts for security
    },
  },
  { timestamps: true, toJSON: { virtuals: true } } // Adds createdAt and updatedAt automatically
);

// ======================
// VIRTUAL PROPERTIES
// ======================
/**
 * Computes whether the user account is active.
 * Combines isBlocked and isDeactivated for easy checks.
 * @returns {Boolean} False if blocked or deactivated
 */
userSchema.virtual('isActive').get(function () {
  return !(this.isBlocked || this.isDeactivated);
});

userSchema.virtual('profileStatus').get(function () {
  if (this.role === 'jobSeeker' && !this.candidateProfile) return 'incomplete';
  if (this.role === 'company' && !this.companyProfile) return 'incomplete';
  return 'complete';
});

// ======================
// DATABASE INDEXES
// ======================

// Role index (speeds up role-based queries)
userSchema.index({ role: 1 });

// ======================
// MODEL EXPORT
// ======================
const User = mongoose.model('User', userSchema);
module.exports = User;
