const Listing = require("../models/listing");
const Review = require("../models/review");
const ExpressError = require("../utils/ExpressError.js");

module.exports.createReview = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) throw new ExpressError(404, "Listing not found");

  // Extra safety
  if (!req.body.review || !req.body.review.comment) {
    throw new ExpressError(400, "Review data missing");
  }

  const newReview = new Review(req.body.review);
  newReview.author = req.user._id;
  console.log(newReview);
  await newReview.save();
  listing.reviews.push(newReview._id);
  await listing.save();

  console.log("New review saved");
  req.flash("success", "New review created");
  res.redirect(`/listings/${listing._id}`);
};
module.exports.destroyReview = async (req, res) => {
  let { id, reviewId } = req.params;
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  req.flash("success", "Review deleted");
  res.redirect(`/listings/${id}`);
};
