exports.getResetPasswordUrl = (host, resetToken) => {
  return `http://${host}/password/reset/${resetToken}`;
};

exports.getCallbackUrl = (host) => {
  return `https://${host}/api/v1/callback`;
};

exports.getPaymentRedirectUrl = (host, orderId) => {
  return `https://${host}/order/${orderId}`;
};