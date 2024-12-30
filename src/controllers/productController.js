const cloudinary = require('cloudinary');
const SearchFeaturesHandler = require("../handlers/SearchFeaturesHandler");
const asyncErrorHandler = require("../middlewares/asyncErrorHandler");
const ErrorHandler = require('../handlers/ErrorHandler');
const Product = require("../models/productModel");
const { uploadProductImages, uploadProductBrandLogo, createProductSpecifications, uploadUpdatedProductImages, uploadUpdatedProductBrandLogo, updateProductSpecifications, addReviewNUpdateRatingsOfProduct, deleteReviewNUpdateRatings } = require('../helpers/productsHelper');

exports.getAllProducts = asyncErrorHandler(async (req, res, next) => {
  const resultPerPage = 12;
  const productsCount = await Product.countDocuments();
  const searchFeatures = new SearchFeaturesHandler(Product.find(), req.query).search().filter();
  let products = await searchFeatures.query;
  let filteredProductsCount = products.length;
  searchFeatures.pagination(resultPerPage);
  products = await searchFeatures.query.clone();
  res.status(200).json({
    success: true,
    products,
    productsCount,
    resultPerPage,
    filteredProductsCount
  });
});

exports.getProducts = asyncErrorHandler(async (req, res, next) => {
  const products = await Product.find();
  res.status(200).json({
    success: true,
    products
  });
});

exports.getProductDetails = asyncErrorHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  res.status(200).json({
    success: true,
    product
  });
});

exports.getAdminProducts = asyncErrorHandler(async (req, res, next) => {
  const products = await Product.find();
  res.status(200).json({
    success: true,
    products
  });
});

exports.createProduct = asyncErrorHandler(async (req, res, next) => {
  await uploadProductImages(req, res, next);
  await uploadProductBrandLogo(req, res, next);
  req.body.user = req.user.id;
  await createProductSpecifications(req, res, next);
  const product = await Product.create(req.body);
  res.status(201).json({
    success: true,
    product
  });
});

exports.updateProduct = asyncErrorHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  await uploadUpdatedProductImages(req, res, next, product);
  await uploadUpdatedProductBrandLogo(req, res, next);
  await updateProductSpecifications(req, res, next);
  req.body.user = req.user.id;
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(201).json({
      success: true,
      product
  });
});

exports.deleteProduct = asyncErrorHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }
  product.images.forEach(async (currentImage) => {
    await cloudinary.v2.uploader.destroy(currentImage.public_id);
  });
  await product.remove();
  res.status(201).json({
    success: true
  });
});

exports.createProductReview = asyncErrorHandler(async (req, res, next) => {
  const { rating, comment, productId } = req.body;
  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment
  };
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler("Product Not Found", 404));
  }
  await addReviewNUpdateRatingsOfProduct(req, res, next, product);
  await product.save({ validateBeforeSave: false });
  res.status(200).json({
    success: true
  });
});

exports.getProductReviews = asyncErrorHandler (async (req, res, next) => {
  const product = await Product.findById(req.query.id);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  res.status(200).json({
    success: true,
    reviews: product.reviews
  });
});

exports.deleteReview = asyncErrorHandler (async (req, res, next) => {
  const product = await Product.findById(req.query.productId);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  const updatedReviewsNRatings = deleteReviewNUpdateRatings(product);
  await Product.findByIdAndUpdate(req.query.productId, updatedReviewsNRatings, {
    new: true,
    runValidators: true,
    useFindAndModify: false
  });
  res.status(200).json({
    success: true
  });
});