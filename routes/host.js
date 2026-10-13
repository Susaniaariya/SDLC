const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware.js");

router.get("/", (req, res) => {
  res.render("host/landing.ejs");
});

router.get("/new", isLoggedIn, (req, res) => {
  res.render("host/new.ejs");
});

module.exports = router;
