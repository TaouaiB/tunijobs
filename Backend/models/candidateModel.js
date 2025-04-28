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
    resumeUrl: { type: String }, // Plain string without URL validation
    links: {
      github: String,
      linkedin: String,
      other: [
        {
          platform: String,
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
        amount: Number, // TND implied, no currency/period fields
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
  }
);

// ======================
// INDEXES (for performance)
// ======================
candidateSchema.index({ skills: 1 }); // Skill-based searches
candidateSchema.index({ 'jobPreferences.preferredLocations': 1 }); // Location filters

const Candidate = mongoose.model('Candidate', candidateSchema);

module.exports = Candidate;
