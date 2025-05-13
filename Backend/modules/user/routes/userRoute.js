const router = require('express').Router();

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

router.route('/').post(createUserValidator, createUser).get(getAllUsers);

router
  .route('/:id')
  .get(getUserValidator, getUserById)
  .put(updateUserValidator, updateUser)
  .delete(getUserValidator, deleteUser);

router.patch('/:id/block', blockUserValidator, blockUser);
router.patch('/:id/unblock', unblockUserValidator, unblockUser);
router.patch('/:id/deactivate', deactivateUserValidator, deactivateUser);
router.patch('/:id/activate', activateUserValidator, reactivateUser);

router.patch('/:id/avatar', updateAvatar);
router.patch('/:id/reset-avatar', resetAvatar);

module.exports = router;
