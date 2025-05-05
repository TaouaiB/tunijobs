const router = require('express').Router();

const {
  createCompanyValidator,
  updateCompanyValidator,
  getCompanyByIdValidator,
  getCompanyByUserIdValidator,
  deleteCompanyValidator,
} = require('../utils/validators/companyValidator');

const {
  createCompanyProfile,
  getCompanyProfile,
  updateCompanyProfile,
  deleteCompanyProfile,
  getAllCompanies,
  getCompanyById,
} = require('../services/companyService');

// User-based company operations
router
  .route('/:userId/company')
  .post(createCompanyValidator, createCompanyProfile)
  .get(getCompanyByUserIdValidator, getCompanyProfile)
  .put(updateCompanyValidator, updateCompanyProfile)
  .delete(deleteCompanyValidator, deleteCompanyProfile);

// Direct company ID operations
router.route('/companies').get(getAllCompanies);

router
  .route('/companies/:companyId')
  .get(getCompanyByIdValidator, getCompanyById);

module.exports = router;
