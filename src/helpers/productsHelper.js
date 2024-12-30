const cloudinary = require('cloudinary');
const asyncErrorHandler = require("../middlewares/asyncErrorHandler");

exports.uploadProductImages = asyncErrorHandler(async (req, res, next) => {
  let images = [];
  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }
  const uploadedImages = images.map(async (currentImage) => {
    const result = await cloudinary.v2.uploader.upload(currentImage, {
      folder: "products"
    });
    return ({
      public_id: result.public_id,
      url: result.secure_url
    });
  });
  req.body.images = Promise.all(uploadedImages);
});

exports.uploadProductBrandLogo = asyncErrorHandler(async (req, res, next) => {
  const uploadedBrandLogo = await cloudinary.v2.uploader.upload(req.body.logo, {
    folder: "brands"
  });
  const brandLogo = {
    public_id: uploadedBrandLogo.public_id,
    url: uploadedBrandLogo.secure_url
  };
  req.body.brand = {
    name: req.body.brandName,
    logo: brandLogo
  };
});

exports.createProductSpecifications = asyncErrorHandler(async (req, res, next) => {
  let specs = [];
  req.body.specifications.forEach((specification) => {
    specs.push(JSON.parse(specification));
  })
  req.body.specifications = specs;
});

exports.uploadUpdatedProductImages = asyncErrorHandler(async (req, res, next, product) => {
  if (req.body.images != undefined) {
    let images = [];
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }
    product.images.forEach(async (currentImage) => {
      await cloudinary.v2.uploader.destroy(product.currentImage.public_id);
    });
    const uploadedNewImages = images.map(async (currentImage) => {
      const result = await cloudinary.v2.uploader.upload(currentImage, {
        folder: "products"
      });
      return ({
        public_id: result.public_id,
        url: result.secure_url
      });
    });
    req.body.images = Promise.all(uploadedNewImages);
  }
});

exports.uploadUpdatedProductBrandLogo = asyncErrorHandler(async (req, res, next) => {
  if (req.body.logo.length > 0) {
    await cloudinary.v2.uploader.destroy(product.brand.logo.public_id);
    const updatedBrandLogo = await cloudinary.v2.uploader.upload(req.body.logo, {
      folder: "brands"
    });
    const brandLogo = {
      public_id: updatedBrandLogo.public_id,
      url: updatedBrandLogo.secure_url
    };
    req.body.brand = {
      name: req.body.brandName,
      logo: brandLogo
    };
  }
});

exports.updateProductSpecifications = asyncErrorHandler(async (req, res, next) => {
  let specs = [];
  req.body.specifications.forEach((s) => {
    specs.push(JSON.parse(s))
  });
  req.body.specifications = specs;
});

exports.addReviewNUpdateRatingsOfProduct = async (req, res, next, product) => {
  const isProductReviewed = product.reviews.find((review) => review.user.toString() === req.user._id.toString());
  if (isProductReviewed) {
    product.reviews.forEach((review) => {
      if (review.user.toString() === req.user._id.toString()) {
        review.rating = rating;
        review.comment = comment;
      }
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }
  let average = 0;
  product.reviews.forEach((currentReview) => average += currentReview.rating);
  product.ratings = average / product.reviews.length;
};

exports.deleteReviewNUpdateRatings = (product) => {
  const reviews = product.reviews.filter((review) => review._id.toString() != req.query.id.toString());
  let average = 0;
  reviews.forEach((currentReview) => average += currentReview.rating);
  let ratings = 0;
  const numOfReviews = reviews.length;
  if (reviews.length != 0) ratings = average / numOfReviews;
  return {
    reviews,
    ratings: Number(ratings),
    numOfReviews
  }
}
