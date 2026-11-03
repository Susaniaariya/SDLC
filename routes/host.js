const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

router.get("/", (req, res) => {
  res.render("host/landing.ejs");
});

router.get("/new", isLoggedIn, (req, res) => {
  res.render("host/new.ejs");
});

router.get("/cancellations", isLoggedIn, wrapAsync(bookingController.hostCancellations));

module.exports = router;
