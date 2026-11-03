const Booking = require("../models/booking");
const Listing = require("../models/listing");

const ONE_DAY = 24 * 60 * 60 * 1000;
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD, what a date input sends

// How many hours before check-in cancellation is still allowed.
const CANCEL_CUTOFF_HOURS = Number(process.env.CANCEL_CUTOFF_HOURS) || 48;

// POST /listings/:id/bookings
// Expects req.body.booking = { checkIn, checkOut, guests }
module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "That listing doesn't exist.");
    return res.redirect("/listings");
  }

  // Send the guest back to the listing page with a message.
  const fail = (message) => {
    req.flash("error", message);
    return res.redirect(`/listings/${id}`);
  };

  const { checkIn, checkOut, guests } = req.body.booking || {};

  // Hosts can't book their own place.
  if (listing.owner && listing.owner.equals(req.user._id)) {
    return fail("You can't book your own listing.");
  }

  // Dates: both present, not in the past, check-out after check-in.
  if (!DATE_FORMAT.test(checkIn || "") || !DATE_FORMAT.test(checkOut || "")) {
    return fail("Please choose check-in and check-out dates.");
  }
  const today = new Date().toLocaleDateString("en-CA"); // today as YYYY-MM-DD
  if (checkIn < today) return fail("Check-in can't be in the past.");
  if (checkOut <= checkIn) return fail("Check-out must be after check-in.");

  // Guests: a whole number, at least 1, not more than the listing allows.
  const numGuests = Number(guests);
  if (!Number.isInteger(numGuests) || numGuests < 1) {
    return fail("Please enter at least 1 guest.");
  }
  if (listing.maxGuests && numGuests > listing.maxGuests) {
    return fail(`This stay allows up to ${listing.maxGuests} guests.`);
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);

  // No double bookings: two stays overlap when one starts before the other
  // ends. Back-to-back is fine (checking out the day someone checks in).
  const clash = await Booking.exists({
    listing: listing._id,
    status: "confirmed",
    checkIn: { $lt: end },
    checkOut: { $gt: start },
  });
  if (clash) return fail("Sorry, those dates are already booked.");

  // Price is worked out here on the server, never taken from the form.
  const nights = Math.round((end - start) / ONE_DAY);
  const totalPrice = nights * (listing.price || 0);

  await Booking.create({
    listing: listing._id,
    guest: req.user._id, // from the login session, never from the form
    checkIn: start,
    checkOut: end,
    guests: numGuests,
    totalPrice,
  });

  req.flash(
    "success",
    `You're booked! ${nights} night${nights === 1 ? "" : "s"} for रु ${totalPrice.toLocaleString("en-NP")}.`,
  );
  res.redirect(`/listings/${id}`);
};

// POST /listings/:id/bookings/:bookingId/cancel-request
// Guest submits a cancellation request with a reason. Blocked same day as check-in.
// Booking moves to "pending_cancellation" for the host to review.
module.exports.cancelBooking = async (req, res) => {
  const { id, bookingId } = req.params;
  const booking = await Booking.findById(bookingId);
  const back = "/trips";

  if (!booking) {
    req.flash("error", "That booking doesn't exist.");
    return res.redirect(back);
  }
  if (!booking.guest.equals(req.user._id)) {
    req.flash("error", "You can only cancel your own bookings.");
    return res.redirect(back);
  }
  if (booking.status !== "confirmed") {
    req.flash("error", "This booking cannot be cancelled.");
    return res.redirect(back);
  }

  // Block same-day cancellations (check-in is today).
  const checkInDate = new Date(booking.checkIn).toLocaleDateString("en-CA");
  const today = new Date().toLocaleDateString("en-CA");
  if (checkInDate === today) {
    req.flash("error", "Same-day cancellations are not permitted. Please contact your host directly.");
    return res.redirect(back);
  }

  const reason = (req.body.cancellationReason || "").trim();
  if (!reason) {
    req.flash("error", "Please provide a reason for your cancellation request.");
    return res.redirect(back);
  }

  booking.status = "pending_cancellation";
  booking.cancellationReason = reason;
  booking.cancelRequestedAt = new Date();
  await booking.save();

  req.flash("success", "Your cancellation request has been sent to the host for review.");
  res.redirect(back);
};

// PATCH /listings/:id/bookings/:bookingId/approve-cancel
// Host approves the cancellation request.
module.exports.approveCancellation = async (req, res) => {
  const { id, bookingId } = req.params;
  const booking = await Booking.findById(bookingId).populate("listing");

  if (!booking) {
    req.flash("error", "That booking doesn't exist.");
    return res.redirect("/host/cancellations");
  }
  if (!booking.listing || !booking.listing.owner.equals(req.user._id)) {
    req.flash("error", "You are not the host of this listing.");
    return res.redirect("/host/cancellations");
  }
  if (booking.status !== "pending_cancellation") {
    req.flash("error", "This request is no longer pending.");
    return res.redirect("/host/cancellations");
  }

  booking.status = "cancelled";
  await booking.save();
  req.flash("success", "Cancellation approved.");
  res.redirect("/host/cancellations");
};

// PATCH /listings/:id/bookings/:bookingId/deny-cancel
// Host denies the cancellation request — booking is reinstated as confirmed.
module.exports.denyCancellation = async (req, res) => {
  const { id, bookingId } = req.params;
  const booking = await Booking.findById(bookingId).populate("listing");

  if (!booking) {
    req.flash("error", "That booking doesn't exist.");
    return res.redirect("/host/cancellations");
  }
  if (!booking.listing || !booking.listing.owner.equals(req.user._id)) {
    req.flash("error", "You are not the host of this listing.");
    return res.redirect("/host/cancellations");
  }
  if (booking.status !== "pending_cancellation") {
    req.flash("error", "This request is no longer pending.");
    return res.redirect("/host/cancellations");
  }

  booking.status = "confirmed";
  booking.cancellationReason = "";
  booking.cancelRequestedAt = undefined;
  await booking.save();
  req.flash("success", "Cancellation request denied — booking is confirmed.");
  res.redirect("/host/cancellations");
};

// GET /host/cancellations
// Shows all pending cancellation requests for the logged-in host's listings.
module.exports.hostCancellations = async (req, res) => {
  const Listing = require("../models/listing");
  const myListings = await Listing.find({ owner: req.user._id }).select("_id");
  const listingIds = myListings.map((l) => l._id);

  const pending = await Booking.find({
    listing: { $in: listingIds },
    status: "pending_cancellation",
  })
    .populate("listing")
    .populate("guest")
    .sort({ cancelRequestedAt: 1 });

  res.render("host/cancellations.ejs", { pending });
};

// GET /trips
// The logged-in guest's bookings: upcoming stays first, then past/cancelled.
module.exports.myTrips = async (req, res) => {
  const bookings = await Booking.find({ guest: req.user._id })
    .populate("listing")
    .sort({ checkIn: 1 });

  const today = new Date(new Date().toLocaleDateString("en-CA")); // midnight today
  const upcoming = [];
  const past = [];
  for (const b of bookings) {
    if ((b.status === "confirmed" || b.status === "pending_cancellation") && b.checkOut > today) upcoming.push(b);
    else past.push(b);
  }
  past.reverse(); // most recent first

  res.render("bookings/index.ejs", { upcoming, past });
};
