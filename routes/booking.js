const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

// Create a booking for a listing
router.post("/:id/bookings", isLoggedIn, wrapAsync(bookingController.createBooking));

// Cancel a booking (only the guest who made it)
router.patch(
  "/:id/bookings/:bookingId/cancel",
  isLoggedIn,
  wrapAsync(bookingController.cancelBooking),
);

module.exports = router;
