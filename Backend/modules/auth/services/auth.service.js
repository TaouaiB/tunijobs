const bcrypt = require('bcryptjs');
const jwt = require('../utils/jwt');
const User = require('../../user/models/userModel');
const ApiError = require('../../../core/utils/ApiError');

class AuthService {
  static async registerUser(userData) {
    const { email, password, name, role } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new ApiError('Email already in use', 409);

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role,
    });

    return user;
  }

  static async loginUser(email, password) {
    const user = await User.findOne({ email });
    if (!user) throw new ApiError('Invalid credentials', 401);
    if (!(await bcrypt.compare(password, user.password)))
      throw new ApiError('Invalid credentials', 401);

    // Create JWT payload (you can add other claims)
    const token = jwt.signToken({ id: user._id, role: user.role });

    return { user, token };
  }
}

module.exports = AuthService;
