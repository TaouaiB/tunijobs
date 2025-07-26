const router = require('express').Router();

const {
  createCompanyValidator,
  updateCompanyValidator,
  getCompanyByIdValidator,
  getCompanyByUserIdValidator,
  deleteCompanyValidator,
} = require('../validators/companyValidator');

const {
  createCompanyProfile,
  getCompanyProfile,
  updateCompanyProfile,
  deleteCompanyProfile,
  getAllCompanies,
  getCompanyById,
} = require('../controllers/companyController');
const authenticateJWT = require('../../../core/middlewares/authentication/authenticateJWT');

// User-based company operations

router
  .route('/me/company')
  .post(authenticateJWT, createCompanyValidator, createCompanyProfile)
  .get(authenticateJWT, getCompanyProfile)
  .put(authenticateJWT, updateCompanyValidator, updateCompanyProfile)
  .delete(authenticateJWT, deleteCompanyProfile);

// Admin Panel
// TODO CASL protection for admin access
// TODO add controller for admin panel
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
