const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

// Create a booking for a listing
router.post("/:id/bookings", isLoggedIn, wrapAsync(bookingController.createBooking));

// Guest submits a cancellation request with a reason
router.post(
  "/:id/bookings/:bookingId/cancel-request",
  isLoggedIn,
  wrapAsync(bookingController.cancelBooking),
);

// Host approves a pending cancellation
router.patch(
  "/:id/bookings/:bookingId/approve-cancel",
  isLoggedIn,
  wrapAsync(bookingController.approveCancellation),
);

// Host denies a pending cancellation
router.patch(
  "/:id/bookings/:bookingId/deny-cancel",
  isLoggedIn,
  wrapAsync(bookingController.denyCancellation),
);

module.exports = router;
