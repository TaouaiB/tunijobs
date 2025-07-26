const router = require('express').Router();

const authenticateJWT = require('../../../core/middlewares/authentication/authenticateJWT');
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
  deactivateUser,
  reactivateUser,
  updateAvatar,
  resetAvatar,
} = require('../controllers/userController');
const {
  createUserValidator,
  getUserValidator,
  updateUserValidator,
  blockUserValidator,
  unblockUserValidator,
  deactivateUserValidator,
  activateUserValidator,
} = require('../validators/userValidator');

// User routes

router.route('/').get(getAllUsers);

router.get('/me', authenticateJWT, getUserById);
router.patch('/me', authenticateJWT, updateUserValidator, updateUser);
router.route('/me').delete(authenticateJWT, deleteUser);

// with :id will be admin panel
// to be removed from userRoute
router
  .route('/:id')
  .get(getUserById)
  .put(updateUserValidator, updateUser)
  .delete(getUserValidator, deleteUser);

router.patch('/:id/block', blockUserValidator, blockUser);
router.patch('/:id/unblock', unblockUserValidator, unblockUser);
router.patch('/:id/deactivate', deactivateUserValidator, deactivateUser);
router.patch('/:id/activate', activateUserValidator, reactivateUser);

router.patch('/me/avatar', authenticateJWT, updateAvatar);
router.patch('/me/reset-avatar', authenticateJWT, resetAvatar);

module.exports = router;
