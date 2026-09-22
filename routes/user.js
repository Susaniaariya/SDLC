// routes/user.js

const express = require("express");
const router = express.Router(); // CRITICAL: Creates the router instance
const User = require("../models/user.js");
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");

// const { saveRedirectUrl } = require("../middleware.js");

// --- 1. GET Register Form ---
router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(wrapAsync(userController.signup));

// --- 3. GET Login Form ---
router
  .route("/login")
  .get(userController.renderLoginform)
  .post(saveRedirectUrl, userController.login);
router.get("/logout", userController.logout);
module.exports = router;
