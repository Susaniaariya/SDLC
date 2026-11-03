const Listing = require("../models/listing");
const Booking = require("../models/booking");
const { cloudinary } = require("../init/cloudinary.js");

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
  // Upcoming confirmed stays, so guests can see which dates are taken
  const now = new Date();
  const bookedRanges = await Booking.find({
    listing: listing._id,
    status: "confirmed",
    checkOut: { $gt: now },
  })
    .select("checkIn checkOut")
    .sort({ checkIn: 1 })
    .lean();
  res.render("listings/show.ejs", { listing, bookedRanges });
};

module.exports.createListing = async (req, res) => {
  const listingData = { ...req.body.listing };
  if (!listingData.propertyType) delete listingData.propertyType;
  delete listingData.image; // ignore any stray URL field; files come from multer

  const newListing = new Listing(listingData);
  newListing.owner = req.user._id;

  if (req.files && req.files.length) {
    newListing.images = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  }

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
  delete listingData.image;

  const listing = await Listing.findByIdAndUpdate(id, listingData, { runValidators: true, new: true });

  // Append any newly uploaded images
  if (req.files && req.files.length) {
    const newImages = req.files.map((f) => ({ url: f.path, filename: f.filename }));
    listing.images.push(...newImages);
    await listing.save();
  }

  // Remove images the host checked for deletion
  const toDelete = req.body.deleteImages; // array of filenames
  if (toDelete && toDelete.length) {
    await Promise.all(toDelete.map((fn) => cloudinary.uploader.destroy(fn)));
    await listing.updateOne({ $pull: { images: { filename: { $in: toDelete } } } });
  }

  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (listing && listing.images.length) {
    await Promise.all(listing.images.map((img) => cloudinary.uploader.destroy(img.filename)));
  }
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
