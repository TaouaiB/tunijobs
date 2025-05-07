const asyncHandler = require('express-async-handler');

const ApiError = require('../../../core/utils/apiError');
const pickFields = require('../../../core/utils/pickFields');

const User = require('../../user/models/userModel');
const Company = require('../models/companyModel');

// @desc    Create company profile
// @route   POST /api/v1/users/:userId/company
// @access  Private
exports.createCompanyProfile = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  // Validate user exists and has correct role
  const [user, existingCompany] = await Promise.all([
    User.findById(userId),
    Company.findOne({ userId }),
  ]);

  if (!user) throw new ApiError('User not found', 404);
  if (user.role !== 'company')
    throw new ApiError('User must have company role', 400);
  if (existingCompany)
    throw new ApiError('Company profile already exists', 409);

  const company = await Company.create({
    ...pickFields(req.body, 'company', true), // Strict field validation
    userId,
  }).then((doc) => doc.populate('userId', 'name _id'));

  res.status(201).json({
    status: 'success',
    data: { company },
  });
});

// @desc    Get company profile by user ID
// @route   GET /api/v1/users/:userId/company
// @access  Public
exports.getCompanyProfile = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  // Validate user exists and has correct role
  const user = await User.findById(userId);
  if (!user) throw new ApiError('User not found', 404);

  const company = await Company.findOne({ userId }).populate(
    'userId',
    'name _id'
  );

  if (!company) throw new ApiError('Company profile not found', 404);

  res.status(200).json({
    status: 'success',
    data: { company },
  });
});

// @desc    Update company profile
// @route   PUT /api/v1/users/:userId/company
// @access  Private
exports.updateCompanyProfile = asyncHandler(async (req, res, next) => {
    
  const user = await User.findById(req.params.userId);

  if (user?.role !== 'company')
    throw new ApiError('User must have company role', 400);

  const updatedCompany = await Company.findOneAndUpdate(
    { userId: req.params.userId },
    pickFields(req.body, 'company', true), // Strict field validation
    { new: true, runValidators: true }
  ).populate('userId', 'name _id');

  if (!updatedCompany) throw new ApiError('Company profile not found', 404);

  res.status(200).json({
    status: 'success',
    data: { company: updatedCompany },
  });
});

// @desc    Delete company profile
// @route   DELETE /api/v1/users/:userId/company
// @access  Private
exports.deleteCompanyProfile = asyncHandler(async (req, res, next) => {
  const deletedCompany = await Company.findOneAndDelete({
    userId: req.params.userId,
  });

  if (!deletedCompany) throw new ApiError('Company profile not found', 404);

  res.status(200).json({
    status: 'success',
    data: null,
  });
});

// @desc    Get all companies (basic version)
// @route   GET /api/v1/users/companies
// @access  Public
exports.getAllCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find({}).populate('userId', 'name _id');

  res.status(200).json({
    status: 'success',
    results: companies.length,
    data: { companies },
  });
});

// @desc    Get company by ID (alternative endpoint)
// @route   GET /api/v1/companies/:companyId
// @access  Public
exports.getCompanyById = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const company = await Company.findById(companyId).populate(
    'userId',
    'name _id'
  );

  if (!company) throw new ApiError('Company not found', 404);

  res.status(200).json({
    status: 'success',
    data: { company },
  });
});
