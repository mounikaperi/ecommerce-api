const cloudinary = require('cloudinary');
const crypto = require('crypto');
const User = require('../models/userModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const sendToken = require('../utils/sendToken');
const ErrorHandler = require('../handlers/ErrorHandler');
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
    await sendEmail({
      email: user.email,
      templateId: process.env.SENDGRID_RESET_TEMPLATEID,
      data: {
        reset_url: resetPasswordUrl
      }
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`
    });
  } catch (error) {
    user.resetPasswordExpire = undefined;
    user.resetPasswordToken = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
  const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });
  if (!user) {
    return next(new ErrorHandler("Invalid reset password token", 404));
  }
  user.password = req.body.password;
  user.resetPasswordExpire = undefined;
  user.resetPasswordToken = undefined;
  await user.save();
  sendToken(user, 200, res);
});

exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is invalid", 400));
  }
  user.password = req.body.newPassword;
  await user.save();
  sendToken(user, 201, res);
});

exports.updateProfile = asyncErrorHandler(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email
  }
  if (req.body.avatar != "") {
    const user = await User.findById(req.user.id);
    const imageId = user.avatar.public_id;
    await cloudinary.v2.uploader.destroy(imageId);
    const newImage = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale"
    });
    newUserData.avatar = {
      public_id: newImage.public_id,
      url: newImage.secure_url
    };
  }
  await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: true
  });
  res.status(200).json({
    success: true
  });
});

// Admin Dashboard
exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    success: true,
    users
  });
});

exports.getSingleUser = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorHandler(`User doesn't exist with id: ${req.params.id}`, 404));
  }
  res.status(200).json({
    success: true,
    user
  });
});

exports.updateUserRole = asyncErrorHandler(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    gender: req.body.gender,
    role: req.body.role
  };
  await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false
  });
  res.status(200).json({
    success: true
  });
});

exports.deleteUser = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorHandler(`User doesn't exist with id: ${req.params.id}`, 404));
  }
  await user.remove();
  res.status(200).json({
    success: true
  });
});
