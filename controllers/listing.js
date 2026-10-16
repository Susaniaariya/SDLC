const Listing = require("../models/listing");

const PRICE_SLIDER_MAX = 20000;

module.exports.index = async (req, res) => {
  // "location" is the Where/When/Who search bar's field; "search" is the
  // navbar's compact search. Both feed the same text match.
  const search = (req.query.search || req.query.location || "").trim();

  // Check-in/check-out are accepted and echoed back into the form, but there
  // is no booking/availability data in this app yet, so they are not
  // filtered on - only guests and price are real filters for now.
  const checkin = req.query.checkin || "";
  const checkout = req.query.checkout || "";

  let guests = Number(req.query.guests);
  if (!Number.isFinite(guests) || guests < 1) guests = null;

  let minPrice = Number(req.query.minPrice);
  let maxPrice = Number(req.query.maxPrice);
  if (!Number.isFinite(minPrice) || minPrice < 0) minPrice = 0;
  if (!Number.isFinite(maxPrice) || maxPrice > PRICE_SLIDER_MAX) maxPrice = PRICE_SLIDER_MAX;

  const filter = {};
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: regex }, { location: regex }, { country: regex }];
  }
  if (minPrice > 0 || maxPrice < PRICE_SLIDER_MAX) {
    filter.price = {};
    if (minPrice > 0) filter.price.$gte = minPrice;
    if (maxPrice < PRICE_SLIDER_MAX) filter.price.$lte = maxPrice;
  }
  if (guests) {
    filter.maxGuests = { $gte: guests };
  }

  const allListings = await Listing.find(filter);
  res.render("listings/index", {
    allListings,
    search,
    minPrice,
    maxPrice,
    sliderMax: PRICE_SLIDER_MAX,
    checkin,
    checkout,
    guests: guests || "",
  });
};
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};
module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist");
    return res.redirect("/listings");
  }
  console.log(listing.owner);
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
  const listingData = { ...req.body.listing };
  if (!listingData.propertyType) delete listingData.propertyType;

  const newListing = new Listing(listingData);
  console.log(req.user);
  newListing.owner = req.user._id;

  await newListing.save();
  req.flash("success", "New Listing created!");
  res.redirect(`/listings/${newListing._id}`);
};
module.exports.editListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist");
    return res.redirect("/listings");
  }
  res.render("listings/edit.ejs", { listing });
};
module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  const listingData = { ...req.body.listing };
  if (!listingData.propertyType) delete listingData.propertyType;
  await Listing.findByIdAndUpdate(id, listingData, { runValidators: true });
  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${id}`);
};
module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
