const Booking = require("../models/booking");
const Listing = require("../models/listing");

const ONE_DAY = 24 * 60 * 60 * 1000;
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD, what a date input sends

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

// PATCH /listings/:id/bookings/:bookingId/cancel
// Only the guest who made the booking can cancel it. We mark it cancelled
// instead of deleting it, so there is still a record.
module.exports.cancelBooking = async (req, res) => {
  const { id, bookingId } = req.params;
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    req.flash("error", "That booking doesn't exist.");
    return res.redirect(`/listings/${id}`);
  }
  if (!booking.guest.equals(req.user._id)) {
    req.flash("error", "You can only cancel your own bookings.");
    return res.redirect(`/listings/${id}`);
  }
  if (booking.status === "cancelled") {
    req.flash("error", "This booking is already cancelled.");
    return res.redirect(`/listings/${id}`);
  }

  booking.status = "cancelled";
  await booking.save();
  req.flash("success", "Your booking has been cancelled.");
  res.redirect(`/listings/${id}`);
};
