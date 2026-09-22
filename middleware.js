// --- /utils/middleware.js ---
const Listing = require("./models/listing");
const ExpressError = require("./utils/ExpressError.js");
const Review = require("./models/review");
const { listingSchema } = require("./schema.js");

// Check if user is logged in
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    // Save the URL the user originally wanted to visit
    req.session.returnTo = req.originalUrl;
    req.flash("error", "You must be logged in to access this page.");
    return res.redirect("/login");
  }
  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  // If a redirect URL exists in the session, save it to res.locals
  // so it can be accessed in the login route handler after success.
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};
module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id).populate("owner");
  const currUser = res.locals.currUser; // get the logged-in user

  if (!currUser || !listing.owner._id.equals(currUser._id)) {
    req.flash("error", "You are not the owner of this listing");
    return res.redirect(`/listings/${id}`);
  }

  next(); // allow the owner to proceed
};
module.exports.validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};
module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId).populate("author");
  const currUser = req.user;

  if (!review.author.equals(currUser._id)) {
    req.flash("error", "You are not the author of this review");
    return res.redirect(`/listings/${id}`);
  }

  next(); // allow the owner to proceed
};
