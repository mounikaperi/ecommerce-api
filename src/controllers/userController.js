const cloudinary = require('cloudinary');
const User = require('../models/userModel');

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