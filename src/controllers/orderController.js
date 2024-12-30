const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../handlers/ErrorHandler');
const sendEmail = require('../utils/sendEmail');

const newOrder = asyncErrorHandler(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    totalPrice
  } = req.body;
  const isOrderAlreadyPlaced = await Order.findOne({ paymentInfo });
  if (isOrderAlreadyPlaced) {
    return next(new ErrorHandler("Order already placed", 400));
  }
  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    totalPrice,
    paidAt: Date.now(),
    user: req.user._id
  });
  await sendEmail({
    email: req.user.email,
    templateId: process.env.SENDGRID_ORDER_TEMPLATEID,
    data: {
      name: req.user.name,
      shippingInfo,
      orderItems,
      totalPrice,
      oid: order._id
    }
  });
  res.status(201).json({
    success: true,
    order
  });
});

const getSingleOrderDetails = asyncErrorHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }
  res.status(200).json({
    success: true,
    order
  });
});

const myOrders = asyncErrorHandler(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });
  if (!orders) {
    return next(new ErrorHandler("No orders found", 404));
  }
  res.status(200).json({
    success: true,
    orders
  });
});

const getAllOrders = asyncErrorHandler(async (req, res, next) => {
  const orders = await Order.find();
  if (!orders) {
    return next(new ErrorHandler("Order not found", 404));
  }
  let totalAmount = 0;
  orders.forEach((order) => totalAmount += order.totalPrice);
  res.status(200).json({
    success: true,
    orders,
    totalAmount
  });
});

const updateOrder = asyncErrorHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }
  if (order.orderStatus === "Delivered") {
    order.deliveredAt = Date.now();
    return next(new ErrorHandler("Order Already Delivered", 400));
  }
  if (req.body.status === "Shipped") {
    order.shippedAt = Date.now();
    order.orderItems.forEach(async (order) => await updateStock(order.product, order.quantity));
  }
  order.orderStatus = req.body.status;
  await order.save({ validateBeforeSave: false });
  res.status(200).json({
    success: true
  });
});

const updateStock = async (productId, quantity) => {
  const product = await Product.findById(productId);
  product.stock = quantity;
  await product.save({ validateBeforeSave: false });
};

const deleteOrder = asyncErrorHandler(async(req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }
  await order.remove();
  res.status(200).json({
    success: true
  });
});

module.exports = {
  newOrder,
  getSingleOrderDetails,
  myOrders,
  getAllOrders,
  updateOrder,
  deleteOrder
}