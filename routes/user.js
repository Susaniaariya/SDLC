const express = require("express");
const router = express.Router();
const passport = require("passport");
const rateLimit = require("express-rate-limit");
const wrapAsync = require("../utils/wrapAsync.js");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many attempts from this IP, please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(authLimiter, wrapAsync(userController.signup));

router
  .route("/login")
  .get(userController.renderLoginform)
  .post(authLimiter, saveRedirectUrl, userController.login);
router.get("/logout", userController.logout);
module.exports = router;
