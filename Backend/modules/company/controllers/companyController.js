const asyncHandler = require('express-async-handler');
const CompanyService = require('../services/company.service');

/**
 * @desc    Create company profile
 * @route   POST /api/v1/users/:userId/company
 * @access  Private
 */
exports.createCompanyProfile = asyncHandler(async (req, res) => {
  const company = await CompanyService.createCompanyProfile(
    req.params.userId,
    req.body
  );
  res.status(201).json({
    status: 'success',
    data: { company },
  });
});

/**
 * @desc    Get company profile by user ID
 * @route   GET /api/v1/users/:userId/company
 * @access  Public
 */
exports.getCompanyProfile = asyncHandler(async (req, res) => {
  const company = await CompanyService.getCompanyByUserId(req.params.userId);
  res.status(200).json({
    status: 'success',
    data: { company },
  });
});

/**
 * @desc    Update company profile
 * @route   PUT /api/v1/users/:userId/company
 * @access  Private
 */
exports.updateCompanyProfile = asyncHandler(async (req, res) => {
  const company = await CompanyService.updateCompanyProfile(
    req.params.userId,
    req.body
  );
  res.status(200).json({
    status: 'success',
    data: { company },
  });
});

/**
 * @desc    Delete company profile
 * @route   DELETE /api/v1/users/:userId/company
 * @access  Private
 */
exports.deleteCompanyProfile = asyncHandler(async (req, res) => {
  await CompanyService.deleteCompanyProfile(req.params.userId);
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

/**
 * @desc    Get all companies
 * @route   GET /api/v1/companies
 * @access  Public
 */
exports.getAllCompanies = asyncHandler(async (req, res) => {
  const companies = await CompanyService.getAllCompanies();
  res.status(200).json({
    status: 'success',
    results: companies.length,
    data: { companies },
  });
});

/**
 * @desc    Get company by ID
 * @route   GET /api/v1/companies/:companyId
 * @access  Public
 */
exports.getCompanyById = asyncHandler(async (req, res) => {
  const company = await CompanyService.getCompanyById(req.params.companyId);
  res.status(200).json({
    status: 'success',
    data: { company },
  });
});
