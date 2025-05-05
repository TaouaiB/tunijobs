const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    // ======================
    // 1. CORE REFERENCE
    // ======================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
      immutable: true, // Prevents modification after creation
    },

    // ======================
    // 2. COMPANY IDENTITY
    // ======================
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true, // For profile URLs (e.g., '/users/john-doe')
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      enum: [
        'IT/Software',
        'Finance/Banking',
        'Healthcare',
        'Manufacturing',
        'Education/Training',
        'Retail/E-commerce',
        'Hospitality/Tourism',
        'Government',
        'Other',
      ],
    },
    description: {
      type: String,
    },

    // ======================
    // 3. CONTACT & LOCATIONS
    // ======================
    website: {
      type: String,
      trim: true,
    },
    offices: [
      {
        city: {
          type: String,
          required: [true, 'Office city is required'],
          trim: true,
        },
        address: {
          type: String,
          trim: true,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // ======================
    // 4. SOCIAL MEDIA
    // ======================
    socialMedia: {
      linkedin: {
        type: String,
        trim: true,
      },
      facebook: {
        type: String,
        trim: true,
      },
    },

    // ======================
    // 5. VERIFICATION STATUS
    // ======================
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified'],
      default: 'unverified',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ======================
// VIRTUAL PROPERTIES
// ======================
/**
 * Returns the company logo URL by referencing the User's avatar.
 * Falls back to default image if not set.
 * @returns {String} Logo URL
 */
companySchema.virtual('logo').get(function () {
  return this.userId?.avatar || 'default_company.png';
});

/**
 * Proxy to the User's email (read-only).
 * Prevents duplicate email storage for GDPR compliance.
 * @returns {String} Company contact email
 */
companySchema.virtual('email').get(function () {
  return this.userId?.email;
});

// ======================
// DATABASE INDEXES
// ======================
// For text search on company names
companySchema.index({ companyName: 'text' });

// For filtering by industry
companySchema.index({ industry: 1 });

// ======================
// PRE-SAVE HOOKS
// ======================
/**
 * Validates that the linked User has 'company' role before saving.
 * @throws {Error} If User is not a company
 */
companySchema.pre('save', async function (next) {
  if (this.isModified('userId')) {
    const user = await mongoose.model('User').findById(this.userId);
    if (user?.role !== 'company') {
      throw new Error('Company profile must link to a company-type User');
    }
  }
  next();
});

const Company = mongoose.model('Company', companySchema);
module.exports = Company;
