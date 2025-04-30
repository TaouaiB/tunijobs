const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');

// Define status transitions (for validation)
const STATUS_TRANSITIONS = {
  submitted: ['under_review', 'rejected', 'withdrawn'],
  under_review: ['shortlisted', 'rejected', 'withdrawn'],
  shortlisted: ['interviewing', 'rejected', 'withdrawn'],
  interviewing: ['offer_pending', 'rejected', 'withdrawn'],
  offer_pending: ['hired', 'rejected', 'withdrawn'],
  hired: [], // Terminal state
  rejected: [], // Terminal state
  withdrawn: [], // Terminal state
};

const applicationSchema = new mongoose.Schema(
  {
    // ======================
    // 1. CORE REFERENCES (Immutable)
    // ======================
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      immutable: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      immutable: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      immutable: true,
    },

    // ======================
    // 2. APPLICATION CONTENT
    // ======================
    coverLetter: {
      type: String,
      trim: true,
    },

    // ======================
    // 3. APPLICATION STATUS
    // ======================
    status: {
      type: String,
      enum: [
        'submitted', // Default state
        'under_review', // Company is reviewing
        'shortlisted', // Passed initial screening
        'interviewing', // In interview process
        'offer_pending', // Final decision phase
        'hired', // Successful application
        'rejected', // Explicit rejection
        'withdrawn', // Candidate withdrew
      ],
      default: 'submitted',
    },
    statusHistory: [
      {
        status: String,
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changedBy: {
          // Track who modified status (user or system)
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          optional: true,
        },
        notes: String,
      },
    ],

    // ======================
    // 4. INTERVIEW DETAILS
    // ======================
    interviews: [
      {
        scheduledAt: Date,
        interviewType: {
          type: String,
          enum: ['phone', 'video', 'onsite', 'technical_test'],
        },
        location: String,
        attendees: [
          {
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
            role: String,
          },
        ],
        feedback: String,
        result: {
          //
          type: String,
          enum: ['pass', 'fail', 'pending'],
          default: 'pending',
        },
      },
    ],

    // ======================
    // 5. OPTIMIZATION & SAFETY
    // ======================
    isArchived: {
      // Soft delete support
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Hide internal fields (but keep statusHistory if requested)
        delete ret.__v;
        if (!this.includeHistory) delete ret.statusHistory;
        return ret;
      },
    },
    strict: 'throw',
  }
);

// ======================
// INDEXES (Prevent Duplicates)
// ======================
applicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

// ======================
// VIRTUAL PROPERTIES
// ======================
applicationSchema.virtual('candidate', {
  ref: 'Candidate',
  localField: 'candidateId',
  foreignField: '_id',
  justOne: true,
});

applicationSchema.virtual('resumeUrl').get(function () {
  return this.populated('candidateId')?.resumeUrl; // Safer population check
});

applicationSchema.virtual('job', {
  ref: 'Job',
  localField: 'jobId',
  foreignField: '_id',
  justOne: true,
});

applicationSchema.virtual('company', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true,
});

// ======================
// PRE-SAVE HOOKS (Status Validation)
// ======================
applicationSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    const previousStatus =
      this.statusHistory.slice(-1)[0]?.status || 'submitted';
    if (!STATUS_TRANSITIONS[previousStatus].includes(this.status)) {
      throw new ApiError(
        `Invalid status transition: ${previousStatus} → ${this.status}`,
        400
      );
    }
    // Auto-add to history
    this.statusHistory.push({
      status: this.status,
      notes: `Status changed from ${previousStatus}`,
    });
  }
  next();
});

// ======================
// QUERY HELPERS
// ======================
applicationSchema.query.byCandidate = function (candidateId) {
  return this.where({ candidateId });
};

applicationSchema.query.byJob = function (jobId) {
  return this.where({ jobId });
};

applicationSchema.query.includeHistory = function () {
  this.options.includeHistory = true; // For toJSON transform
  return this;
};

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;
