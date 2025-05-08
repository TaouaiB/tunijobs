const ApiError = require('../../../core/utils/ApiError');
const pickFields = require('../../../core/utils/pickFields');
const User = require('../../user/models/userModel');
const Company = require('../models/companyModel');

/**
 * Service layer for company profile operations
 * @class CompanyService
 */
class CompanyService {
  /**
   * Create a new company profile
   * @async
   * @param {string} userId - Associated user ID
   * @param {Object} companyData - Company profile data
   * @returns {Promise<Object>} Created company profile
   * @throws {ApiError} If validation fails (400), user not found (404), or profile exists (409)
   */
  static async createCompanyProfile(userId, companyData) {
    const [user, existingCompany] = await Promise.all([
      User.findById(userId),
      Company.findOne({ userId }),
    ]);

    if (!user) throw new ApiError('User not found', 404);
    if (user.role !== 'company') throw new ApiError('User must have company role', 400);
    if (existingCompany) throw new ApiError('Company profile already exists', 409);

    return await Company.create({
      ...pickFields(companyData, 'company', true),
      userId,
    }).then(doc => doc.populate('userId', 'name _id'));
  }

  /**
   * Get company profile by user ID
   * @async
   * @param {string} userId - Associated user ID
   * @returns {Promise<Object>} Company profile
   * @throws {ApiError} If user (404) or profile (404) not found
   */
  static async getCompanyByUserId(userId) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError('User not found', 404);

    const company = await Company.findOne({ userId })
      .populate('userId', 'name _id');

    if (!company) throw new ApiError('Company profile not found', 404);
    return company;
  }

  /**
   * Update company profile
   * @async
   * @param {string} userId - Associated user ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated company profile
   * @throws {ApiError} If validation fails (400) or profile not found (404)
   */
  static async updateCompanyProfile(userId, updateData) {
    const user = await User.findById(userId);
    if (user?.role !== 'company') throw new ApiError('User must have company role', 400);

    const updatedCompany = await Company.findOneAndUpdate(
      { userId },
      pickFields(updateData, 'company', true),
      { new: true, runValidators: true }
    ).populate('userId', 'name _id');

    if (!updatedCompany) throw new ApiError('Company profile not found', 404);
    return updatedCompany;
  }

  /**
   * Delete company profile
   * @async
   * @param {string} userId - Associated user ID
   * @returns {Promise<Object>} Deleted company profile
   * @throws {ApiError} If profile not found (404)
   */
  static async deleteCompanyProfile(userId) {
    const deletedCompany = await Company.findOneAndDelete({ userId });
    if (!deletedCompany) throw new ApiError('Company profile not found', 404);
    return deletedCompany;
  }

  /**
   * Get all company profiles
   * @async
   * @param {Object} [filters={}] - Optional filters
   * @returns {Promise<Array>} List of company profiles
   */
  static async getAllCompanies(filters = {}) {
    return await Company.find(filters)
      .populate('userId', 'name _id')
      .select('-__v');
  }

  /**
   * Get company by ID
   * @async
   * @param {string} companyId - Company profile ID
   * @returns {Promise<Object>} Company profile
   * @throws {ApiError} If profile not found (404)
   */
  static async getCompanyById(companyId) {
    const company = await Company.findById(companyId)
      .populate('userId', 'name _id');

    if (!company) throw new ApiError('Company not found', 404);
    return company;
  }
}

module.exports = CompanyService;