const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    // ======================
    // 1. CORE REFERENCE
    // ======================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      immutable: true, // Prevents modification after creation
    },

    // ======================
    // 2. PROFESSIONAL DETAILS
    // ======================
    headline: {
      type: String,
    },
    bio: {
      type: String,
    },
    education: { type: String },
    experience: { type: String },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    // ======================
    // 3. DOCUMENTS & LINKS
    // ======================
    resumeUrl: { type: String, trim: true },
    links: {
      github: {
        type: String,
        trim: true,
      },
      linkedin: {
        type: String,
        trim: true,
      },
      other: [
        {
          platform: {
            type: String,
            required: [true, 'Platform name is required'],
            trim: true,
          },
        },
      ],
    },

    // ======================
    // 4. JOB PREFERENCES (Tunisian context)
    // ======================
    jobTypePreferences: {
      // Rename from jobPreferences
      workType: [
        {
          type: String,
          enum: ['remote', 'onsite', 'hybrid'],
          default: 'onsite',
        },
      ],
      contractType: [
        {
          // Keep singular (more natural)
          type: String,
          enum: [
            'full-time',
            'part-time',
            'freelance',
            'internship',
            'temporary',
          ],
        },
      ],
      desiredSalary: {
        // More useful than single amount
        min: { type: Number, min: 0 },
        max: { type: Number, min: 0 },
      },
      availability: {
        type: String,
        enum: ['immediate', '1-2 weeks', '1 month', '2-3 months', 'flexible'],
        default: 'flexible',
      },
    },
    preferredJobTitles: [
      {
        // Add as top-level field
        type: String,
        trim: true,
      },
    ],

    // ======================
    // 5. ADDITIONAL DETAILS
    // ======================
    languages: [
      {
        type: String,
        trim: true,
      },
    ],
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
 * Returns the candidate's email via User reference (read-only)
 * @returns {String} Candidate's contact email
 */
candidateSchema.virtual('email').get(function () {
  return this.userId?.email;
});

/**
 * Returns the candidate's name via User reference
 * @returns {String} Full name
 */
candidateSchema.virtual('name').get(function () {
  return this.userId?.name;
});

// ======================
// INDEXES (for performance)
// ======================
candidateSchema.index({ skills: 1 });
candidateSchema.index({ 'jobPreferences.preferredLocations': 1 });
candidateSchema.index({ 'jobPreferences.contractTypes': 1 });

// ======================
// PRE-SAVE HOOKS
// ======================
/**
 * Validates that the linked User has 'jobSeeker' role before saving
 * @throws {Error} If User is not a job seeker
 */
candidateSchema.pre('save', async function (next) {
  if (this.isModified('userId')) {
    const user = await mongoose.model('User').findById(this.userId);
    if (user?.role !== 'jobSeeker') {
      throw new Error('Candidate profile must link to a jobSeeker-type User');
    }
  }
  next();
});

// ======================
// STRICT SAFE UPDATE METHOD
// ======================
/**
 * Safely updates candidate profile with strict field validation
 * @param {Object} updates - Field/value pairs to update
 * @throws {Error} If invalid fields are provided or validation fails
 */

const Candidate = mongoose.model('Candidate', candidateSchema);

module.exports = Candidate;
