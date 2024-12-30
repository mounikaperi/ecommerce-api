const ErrorHandler = require('../handlers/ErrorHandler');

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";
  if (err.name == "CastError") {
    const message = `Resource Not Found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }
  switch (err.code) {
    case 11000: {
      const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
      err = new ErrorHandler(message, 400);
      break;
    }
    case "JsonWebTokenError": {
      const message = 'JWT Error';
      err = new ErrorHandler(message, 400);
      break;
    }
    case "JsonWebTokenExpiredError": {
      const message = 'JWT is Expired';
      err = new ErrorHandler(message, 400);
      break;
    }
    default:
      break;
  }
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
}