const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    education: { type: String },
    experience: { type: String },
    skills: [{ type: String }],

    resumeUrl: { type: String }, // Optional CV
    bio: { type: String }, // Short description

    links: {
      github: { type: String },
      linkedin: { type: String },
      other: [
        {
          label: { type: String },
          url: { type: String },
        },
      ],
    },

    jobTypePreferences: {
      workType: [
        {
          type: String,
          enum: ['remote', 'onsite', 'hybrid'],
        },
      ],
      availability: {
        type: String,
        enum: [
          'immediate',
          '1 week',
          '2 weeks',
          '1 month',
          '2 months',
          '3 months',
          '3+ months',
        ],
      },
      contractType: [
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
      desiredSalary: {
        min: { type: Number }, // Optional minimum salary
        max: { type: Number }, // Optional maximum salary
      },
    },

    preferredJobTitles: [{ type: String }], // Ex: ['Frontend Developer', 'Fullstack Engineer']

    languages: [{ type: String }], // Languages spoken
  },
  { timestamps: true }
);

const Candidate = mongoose.model('Candidate', candidateSchema);

module.exports = Candidate;
