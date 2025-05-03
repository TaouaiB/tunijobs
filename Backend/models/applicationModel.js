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
    documents: [
      {
        name: String,
        url: String,
        type: String,
      },
    ],

    // ======================
    // 3. APPLICATION SCORING
    // ======================
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    scoringDetails: {
      resumeScore: { type: Number, default: 0 },
      coverLetterScore: { type: Number, default: 0 },
      interviewScore: { type: Number, default: 0 },
      bonusPoints: { type: Number, default: 0 },
    },

    // ======================
    // 4. APPLICATION STATUS
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
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        notes: String,
        metadata: {
          aiSuggestions: [String],
          confirmed: Boolean,
        },
      },
    ],

    // ======================
    // 5. INTERVIEW DETAILS
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
          type: String,
          enum: ['pass', 'fail', 'pending'],
          default: 'pending',
        },
        template: String,
        notes: String,
      },
    ],

    // ======================
    // 6. METADATA & ANALYTICS
    // ======================
    metadata: {
      aiAnalysis: {
        score: Number,
        keywords: [String],
        sentiment: String,
      },
      ipAddress: String,
      userAgent: String,
      applicationSource: String,
    },
    analytics: {
      viewCount: { type: Number, default: 0 },
      lastViewed: Date,
      statusChangeDates: {
        submitted: Date,
        under_review: Date,
        shortlisted: Date,
        interviewing: Date,
        offer_pending: Date,
        hired: Date,
        rejected: Date,
        withdrawn: Date,
      },
    },

    // ======================
    // 7. OPTIMIZATION & SAFETY
    // ======================
    isArchived: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Hide internal fields
        delete ret.__v;
        delete ret.deletedAt;
        delete ret.version;
        if (!this.includeHistory) delete ret.statusHistory;
        return ret;
      },
    },
    strict: 'throw',
  }
);

// ======================
// INDEXES
// ======================
applicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });
applicationSchema.index({ status: 1 });
applicationSchema.index({ score: -1 });
applicationSchema.index({ companyId: 1, status: 1 });
applicationSchema.index({ 'interviews.scheduledAt': 1 });

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
  return this.populated('candidateId')?.resumeUrl;
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
// PRE-SAVE HOOKS
// ======================
applicationSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    // 1. Get the ACTUAL current status (from document or history)
    const currentStatus = this.status;
    const lastHistoryEntry = this.statusHistory.slice(-1)[0];

    // 2. Determine the true previous status (prior to this change)
    const previousStatus = lastHistoryEntry?.status || 'submitted';

    // 3. Skip validation if this is a redundant update
    if (currentStatus === previousStatus) {
      return next();
    }

    // 4. Validate the transition
    if (!STATUS_TRANSITIONS[previousStatus]?.includes(currentStatus)) {
      throw new ApiError(
        `Invalid status transition: ${previousStatus} → ${currentStatus}`,
        400
      );
    }

    // 5. Update analytics and history ONLY if status actually changed
    if (currentStatus !== previousStatus) {
      this.analytics.statusChangeDates[currentStatus] = new Date();

      this.statusHistory.push({
        status: currentStatus,
        changedBy: lastHistoryEntry?.changedBy || this.candidateId,
        notes: `Status changed from ${previousStatus}`,
        timestamp: new Date(),
      });
    }
  }

  // Keep your existing scoring logic
  if (this.isModified('scoringDetails')) {
    this.score = Math.min(
      100,
      (this.scoringDetails.resumeScore || 0) +
        (this.scoringDetails.coverLetterScore || 0) +
        (this.scoringDetails.interviewScore || 0) +
        (this.scoringDetails.bonusPoints || 0)
    );
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
  this.options.includeHistory = true;
  return this;
};

applicationSchema.query.active = function () {
  return this.where({ deletedAt: null });
};

// ======================
// INSTANCE METHODS
// ======================
applicationSchema.methods.logView = function () {
  this.analytics.viewCount += 1;
  this.analytics.lastViewed = new Date();
  return this.save();
};

applicationSchema.methods.getTimeline = function () {
  return this.statusHistory.sort((a, b) => b.changedAt - a.changedAt);
};

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;
