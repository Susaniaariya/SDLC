const Listing = require("../models/listing");

const PRICE_SLIDER_MAX = 20000;

module.exports.index = async (req, res) => {
  const search = (req.query.search || "").trim();

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

  const allListings = await Listing.find(filter);
  res.render("listings/index", {
    allListings,
    search,
    minPrice,
    maxPrice,
    sliderMax: PRICE_SLIDER_MAX,
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
  const newListing = new Listing(req.body.listing);
  console.log(req.user);
  newListing.owner = req.user._id;

  await newListing.save();
  req.flash("success", "New Listing created!");
  res.redirect("/listings");
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
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
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
