const allowedFields = {
  user: [
    'name',
    'email',
    'password',
    'phone',
    'city',
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
};

module.exports = function pickFields(data, modelType, strict = false) {
  const fieldList = allowedFields[modelType];
  if (!fieldList) throw new Error(`Invalid model type: ${modelType}`);

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
    throw new Error(
      `Invalid fields for ${modelType}: ${invalidFields.join(', ')}\n` +
        `Allowed fields: ${fieldList.join(', ')}`
    );
  }

  return result;
};
