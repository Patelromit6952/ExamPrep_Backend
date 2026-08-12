// import Plan from "../models/Plan.js";
// import Subscription from "../models/Subscription.js";
// import asyncHandler from "../utils/asyncHandler.js";
// import ApiError from "../utils/ApiError.js";
// import ApiResponse from "../utils/ApiResponse.js";

// // @desc    List subscription plans. Students see only active plans; admins
// //          can pass ?all=true to see hidden/inactive ones too.
// // @route   GET /api/subscriptions/plans
// // @access  Private
// export const getPlans = asyncHandler(async (req, res) => {
//   const wantsAll = req.query.all === "true" && req.user.role === "admin";
//   const filter = wantsAll ? {} : { isActive: true };
//   const plans = await Plan.find(filter).sort({ price: 1 });
//   res.status(200).json(new ApiResponse(200, { plans }, "Plans fetched"));
// });

// // @desc    Create a subscription plan
// // @route   POST /api/subscriptions/plans
// // @access  Private/Admin
// export const createPlan = asyncHandler(async (req, res) => {
//   const { name, description, price, currency, durationDays, features } =
//     req.body;

//   const plan = await Plan.create({
//     name,
//     description,
//     price,
//     currency: currency || "INR",
//     durationDays,
//     features: Array.isArray(features) ? features : []
//   });

//   res
//     .status(201)
//     .json(new ApiResponse(201, { plan }, "Plan created successfully"));
// });

// // @desc    Update a subscription plan (including hide/show via isActive)
// // @route   PUT /api/subscriptions/plans/:id
// // @access  Private/Admin
// export const updatePlan = asyncHandler(async (req, res) => {
//   const plan = await Plan.findById(req.params.id);
//   if (!plan) throw new ApiError(404, "Plan not found");

//   const allowedFields = [
//     "name",
//     "description",
//     "price",
//     "currency",
//     "durationDays",
//     "features",
//     "isActive"
//   ];
//   allowedFields.forEach((field) => {
//     if (req.body[field] !== undefined) plan[field] = req.body[field];
//   });

//   await plan.save();

//   res
//     .status(200)
//     .json(new ApiResponse(200, { plan }, "Plan updated successfully"));
// });

// // @desc    Delete a subscription plan
// // @route   DELETE /api/subscriptions/plans/:id
// // @access  Private/Admin
// export const deletePlan = asyncHandler(async (req, res) => {
//   const plan = await Plan.findById(req.params.id);
//   if (!plan) throw new ApiError(404, "Plan not found");

//   await Plan.deleteOne({ _id: plan._id });

//   res.status(200).json(new ApiResponse(200, null, "Plan deleted successfully"));
// });

// // @desc    Get the logged-in student's current active subscription, if any
// // @route   GET /api/subscriptions/me
// // @access  Private
// export const getMySubscription = asyncHandler(async (req, res) => {
//   const subscription = await Subscription.findOne({
//     userId: req.user._id,
//     status: "active",
//     endDate: { $gt: new Date() }
//   })
//     .populate("planId")
//     .sort({ endDate: -1 });

//   res
//     .status(200)
//     .json(
//       new ApiResponse(200, { subscription }, "Subscription status fetched")
//     );
// });

// // @desc    Admin view of every subscription/payment record (revenue overview)
// // @route   GET /api/subscriptions/all
// // @access  Private/Admin
// export const getAllSubscriptions = asyncHandler(async (req, res) => {
//   const subscriptions = await Subscription.find({ status: { $ne: "created" } })
//     .populate("userId", "name email")
//     .populate("planId", "name price durationDays")
//     .sort({ createdAt: -1 });

//   res
//     .status(200)
//     .json(new ApiResponse(200, { subscriptions }, "Subscriptions fetched"));
// });

import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// @desc    List subscription plans. Students see only active plans; admins
//          can pass ?all=true to see hidden/inactive ones too.
// @route   GET /api/subscriptions/plans
// @access  Private
export const getPlans = asyncHandler(async (req, res) => {
  const wantsAll = req.query.all === "true" && req.user.role === "admin";
  const filter = wantsAll ? {} : { isActive: true };
  const plans = await Plan.find(filter).sort({ price: 1 });
  res.status(200).json(new ApiResponse(200, { plans }, "Plans fetched"));
});

// @desc    Create a subscription plan
// @route   POST /api/subscriptions/plans
// @access  Private/Admin
export const createPlan = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    currency,
    durationDays,
    features,
    maxAttemptsPerExam
  } = req.body;

  const plan = await Plan.create({
    name,
    description,
    price,
    currency: currency || "INR",
    durationDays,
    maxAttemptsPerExam: maxAttemptsPerExam || 0,
    features: Array.isArray(features) ? features : []
  });

  res
    .status(201)
    .json(new ApiResponse(201, { plan }, "Plan created successfully"));
});

// @desc    Update a subscription plan (including hide/show via isActive)
// @route   PUT /api/subscriptions/plans/:id
// @access  Private/Admin
export const updatePlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (!plan) throw new ApiError(404, "Plan not found");

  const allowedFields = [
    "name",
    "description",
    "price",
    "currency",
    "durationDays",
    "features",
    "isActive",
    "maxAttemptsPerExam"
  ];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) plan[field] = req.body[field];
  });

  await plan.save();

  res
    .status(200)
    .json(new ApiResponse(200, { plan }, "Plan updated successfully"));
});

// @desc    Delete a subscription plan
// @route   DELETE /api/subscriptions/plans/:id
// @access  Private/Admin
export const deletePlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (!plan) throw new ApiError(404, "Plan not found");

  await Plan.deleteOne({ _id: plan._id });

  res.status(200).json(new ApiResponse(200, null, "Plan deleted successfully"));
});

// @desc    Get the logged-in student's current active subscription, if any
// @route   GET /api/subscriptions/me
// @access  Private
export const getMySubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    userId: req.user._id,
    status: "active",
    endDate: { $gt: new Date() }
  })
    .populate("planId")
    .sort({ endDate: -1 });

  res
    .status(200)
    .json(
      new ApiResponse(200, { subscription }, "Subscription status fetched")
    );
});

// @desc    Admin view of every subscription/payment record (revenue overview)
// @route   GET /api/subscriptions/all
// @access  Private/Admin
export const getAllSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ status: { $ne: "created" } })
    .populate("userId", "name email")
    .populate("planId", "name price durationDays")
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, { subscriptions }, "Subscriptions fetched"));
});