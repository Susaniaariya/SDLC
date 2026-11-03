const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

// The logged-in guest's trips
router.get("/", isLoggedIn, wrapAsync(bookingController.myTrips));

module.exports = router;
