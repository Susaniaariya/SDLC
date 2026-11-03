const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const { isLoggedIn } = require("../middleware.js");
const { isOwner, validateListing } = require("../middleware.js");
const upload = require("../middleware/upload.js");

const listingController = require("../controllers/listing.js");
// INDEX
router.route("/").get(wrapAsync(listingController.index)).post(
  isLoggedIn,
  upload.array("images", 5),
  validateListing,
  wrapAsync(listingController.createListing),
);
router.get("/new", isLoggedIn, listingController.renderNewForm);
router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.array("images", 5),
    validateListing,
    wrapAsync(listingController.updateListing),
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

// NEW

// EDIT
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.editListing),
);

module.exports = router;
