const asyncErrorHandler = require("../middlewares/asyncErrorHandler");
const Product = require("../models/productModel");

exports.getAllProducts = asyncErrorHandler(async (req, res, next) => {
  const resultPerPage = 12;
  const productsCount = await Product.countDocuments();
  
})