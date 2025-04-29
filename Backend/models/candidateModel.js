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
    jobPreferences: {
      workType: [
        {
          type: String,
          enum: ['remote', 'onsite', 'hybrid'],
          default: 'onsite',
        },
      ],
      availability: {
        type: String,
        enum: ['immediate', '1-2 weeks', '1 month', '2-3 months', 'flexible'],
        default: 'flexible',
      },
      contractTypes: [
        {
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
      salaryExpectation: {
        amount: {
          type: Number,
          min: [0, 'Salary cannot be negative'],
        },
      },
      preferredLocations: [
        {
          type: String,
          trim: true,
        },
      ],
    },

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
candidateSchema.methods.safeUpdate = async function (updates) {
  // 1. Define allowed fields that can be updated
  const allowedUpdates = [
    'headline',
    'bio',
    'education',
    'experience',
    'skills',
    'resumeUrl',
    'links',
    'jobPreferences',
    'languages',
  ];

  // 2. Check for invalid fields
  const invalidUpdates = Object.keys(updates).filter(
    (field) => !allowedUpdates.includes(field)
  );

  // 3. Throw error if invalid fields found
  if (invalidUpdates.length > 0) {
    throw new Error(
      `Attempted to update non-allowed fields: ${invalidUpdates.join(', ')}. ` +
        `Allowed fields are: ${allowedUpdates.join(', ')}`
    );
  }

  // 4. Apply valid updates
  Object.keys(updates).forEach((field) => {
    this[field] = updates[field];
  });

  // 5. Save with validation
  return this.save();
};

const Candidate = mongoose.model('Candidate', candidateSchema);

module.exports = Candidate;
