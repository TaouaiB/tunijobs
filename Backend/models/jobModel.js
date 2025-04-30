const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    // ======================
    // 1. CORE IDENTITY
    // ======================
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      immutable: true,
    },

    // ======================
    // 2. JOB SPECIFICS
    // ======================
    jobType: {
      type: String,
      enum: [
        'full-time',
        'part-time',
        'contract',
        'internship',
        'temporary',
        'freelance',
      ],
      required: true,
    },
    locationType: {
      type: String,
      enum: ['remote', 'onsite', 'hybrid'],
      required: true,
    },
    primaryLocation: {
      city: {
        type: String,
        required: [true, 'City is required'],
      },
      address: {
        type: String,
        trim: true,
      },
    },
    skillsRequired: [
      {
        name: String,
      },
    ],
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'lead'],
      required: true,
    },

    // ======================
    // 3. RECRUITMENT METADATA
    // ======================
    applicationDeadline: Date,
    referralBonus: {
      amount: Number,
    },

    // ======================
    // 4. STATUS FLAGS
    // ======================
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isConfidential: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },

    // ======================
    // 5. BENEFITS OR PERKS
    // ======================
    benefits: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ======================
// INDEXES
// ======================
jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ companyId: 1, isActive: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ 'skillsRequired.name': 1 });

// ======================
// VIRTUALS
// ======================
jobSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'jobId',
  options: { sort: { createdAt: -1 } },
});

jobSchema.virtual('company', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true,
});

// ======================
// STATIC METHODS
// ======================
jobSchema.statics.findActiveJobs = function () {
  return this.find({ isActive: true }).populate(
    'company',
    'companyName logo industry'
  );
};

// ======================
// INSTANCE METHODS
// ======================
jobSchema.methods.incrementViews = async function () {
  this.views += 1;
  await this.save();
};

// ======================
// HOOKS
// ======================
jobSchema.pre('save', function (next) {
  if (this.isFeatured && !this.isActive) {
    throw new Error('Featured jobs must be active');
  }
  next();
});

jobSchema.pre('remove', async function (next) {
  await mongoose.model('Application').deleteMany({ jobId: this._id });
  await mongoose.model('Bookmark').deleteMany({ jobId: this._id });
  next();
});

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
