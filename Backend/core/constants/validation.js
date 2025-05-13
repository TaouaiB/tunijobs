/**
 * Shared validation constants across all modules
 * @namespace VALIDATION_CONSTANTS
 */
module.exports = {
  // ID & Naming
  ID_REGEX: /^[0-9a-fA-F]{24}$/,
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 32,
  SLUGIFY_OPTIONS: {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  },

  // Security
  PASSWORD_MIN_LENGTH: 6,

  // Field Lengths
  DEFAULT_MAX_LENGTH: 255,
  LONG_TEXT_MAX_LENGTH: 10000,
  META_DESC_MAX_LENGTH: 160,

  // Location
  PHONE_LOCALES: {
    DEFAULT: 'ar-TN',
    SUPPORTED: ['ar-TN', 'en-US'],
  },
  LOCATION: {
    CITY_MAX_LENGTH: 50,
    ADDRESS_MAX_LENGTH: 200,
  },

  // URLs
  URL: {
    PROTOCOLS: ['http', 'https'],
    REQUIRE_PROTOCOL: true,
  },
  // Array Limits
  ARRAY_MAX_LIMITS: {
    SKILLS: 50,
    LANGUAGES: 20,
    LOCATIONS: 30,
  },

  // Salary
  SALARY: {
    MIN: 0,
    MAX: 1_000_000,
    CURRENCIES: ['TND'] // Example
  }
};
