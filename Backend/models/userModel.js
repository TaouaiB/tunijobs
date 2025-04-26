const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Name is required'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
    },
    country: {
      type: String,
    },
    profileImg: {
      type: String,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Too short password'],
    },

    // User roles: unified logic
    role: {
      type: String,
      enum: ['jobSeeker', 'company', 'manager', 'admin'],
      default: 'jobSeeker',
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isDeactivated: {
      type: Boolean,
      default: false,
    },

    lastLogin: {
      type: Date,
    },

    loginAttempts: {
      type: Number,
      default: 0,
    },

    profileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
