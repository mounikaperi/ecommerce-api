const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const asyncErrorHandler = require('./asyncErrorHandler');
const ErrorHandler = require('../utils/ErrorHandler');

const isAuthenticatedUser = asyncErrorHandler(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return next(new ErrorHandler("Please login to access", 401));
  }
  const decodedData = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decodedData.id);
  next();
})

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorHandler(`Role: ${req.user.role} is not allowed`, 403));
    }
    next();
  }
}

module.exports = {
  isAuthenticatedUser,
  authorizeRoles
}