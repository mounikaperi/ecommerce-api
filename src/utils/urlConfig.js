exports.getResetPasswordUrl = (host, resetToken) => {
  return `http://${host}/password/reset/${resetToken}`;
};
