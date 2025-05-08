const allowedFields = {
  user: [
    'name',
    'email',
    'password',
    'phone',
    'city',
    'role',
    'avatar',
    'slug',
    'isVerified',
    'isBlocked',
    'isDeactivated',
    'profileCompleted',
  ],
  candidate: [
    'headline',
    'bio',
    'education',
    'experience',
    'skills',
    'resumeUrl',
    'links',
    'jobPreferences',
    'languages',
    'jobTypePreferences',
    'preferredJobTitles',
  ],
  company: [
    'companyName',
    'slug',
    'industry',
    'description',
    'website',
    'offices',
    'socialMedia',
    'verificationStatus',
    'logo', // Virtual field, might not be part of MongoDB storage but useful for client-side
    'email', // Virtual field, proxy to user email
  ],
  job: [
    'title',
    'description',
    'jobType',
    'locationType',
    'primaryLocation',
    'skillsRequired',
    'experienceLevel',
    'applicationDeadline',
    'referralBonus',
    'isActive',
    'isFeatured',
    'isConfidential',
    'benefits',
    'meta',
    'slug',
    'locationKeywords',
    'deadlineWarning',
  ],
  application: [
    'candidateId',
    'coverLetter',
    'status',
    'notes',
    'scheduledAt',
    'interviewType',
    'location',
    'attendees',
    'feedback',
    'result',
  ],
};

const ApiError = require('./ApiError');

module.exports = function pickFields(data, modelType, strict = false) {
  const fieldList = allowedFields[modelType];
  if (!fieldList) {
    throw new ApiError(`Invalid model type provided: ${modelType}`, 500);
  }

  const result = {};
  const invalidFields = [];

  Object.keys(data).forEach((key) => {
    if (fieldList.includes(key)) {
      result[key] = data[key];
    } else if (strict) {
      invalidFields.push(key);
    }
  });

  if (strict && invalidFields.length > 0) {
    throw new ApiError(
      `Invalid fields detected for ${modelType}: ${invalidFields.join(', ')}. ` +
        `Allowed fields: ${fieldList.join(', ')}`,
      400
    );
  }
  return result;
};
