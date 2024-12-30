const cloudinary = require('cloudinary');
const User = require('../models/userModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const ErrorHandler = require('../utils/ErrorHandler');
const sendEmail = require('../utils/sendEmail');
const { getResetPasswordUrl } = require('../utils/urlConfig');

exports.registerUser = asyncErrorHandler(async (req, res, next) => {
  const avatarUploadedToCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
    folder: "avatars",
    width: 150,
    crop: "scale"
  });
  const { name, email, gender, password } = req.body;
  const newlyCreatedUser = User.create({
    name,
    email,
    gender,
    password,
    avatar: {
      public_id: avatarUploadedToCloud.public_id,
      url: avatarUploadedToCloud.secure_url
    }
  });
  sendToken(newlyCreatedUser, 201, res);
});

exports.loginUser = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Please enter Email and Password", 400));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }
  sendToken(user, 201, res);
});

exports.logoutUser = asyncErrorHandler(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true
  });
  res.status(200).json({
    success: true,
    message: "Logged Out"
  })
});

exports.getUserDetails = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user
  });
});

exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  const resetToken = await user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  const resetPasswordUrl = getResetPasswordUrl(req.get("host"), resetToken);
  try {
    await sendEmail
  } catch (error) {

  }
});

