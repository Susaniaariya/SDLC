const { test, beforeEach } = require("node:test");
const assert = require("node:assert");
const Booking = require("../models/booking");
const controller = require("../controllers/booking");
const { newId, fakeReqRes, daysFromToday } = require("./helpers");

const guest = newId();
const day = (n) => new Date(daysFromToday(n));

// ---------- My Trips ----------

test("trips: splits upcoming from past and cancelled", async () => {
  const bookings = [
    { _id: 1, status: "confirmed", checkIn: day(-10), checkOut: day(-7) }, // past
    { _id: 2, status: "cancelled", checkIn: day(5), checkOut: day(8) }, // cancelled
    { _id: 3, status: "confirmed", checkIn: day(5), checkOut: day(8) }, // upcoming
    { _id: 4, status: "confirmed", checkIn: day(-1), checkOut: day(2) }, // staying now
  ];
  let query;
  Booking.find = (q) => {
    query = q;
    return { populate: () => ({ sort: async () => bookings }) };
  };
  let rendered;
  const { req, res } = fakeReqRes({ user: { _id: guest } });
  res.render = (view, data) => (rendered = { view, data });

  await controller.myTrips(req, res);

  assert.deepStrictEqual(query, { guest }); // only this guest's bookings
  assert.strictEqual(rendered.view, "bookings/index.ejs");
  assert.deepStrictEqual(rendered.data.upcoming.map((b) => b._id), [3, 4]);
  assert.deepStrictEqual(rendered.data.past.map((b) => b._id), [2, 1]);
});

// ---------- Cancel redirect ----------

let booking;
beforeEach(() => {
  booking = { guest, status: "confirmed", save: async () => {} };
  Booking.findById = async () => booking;
});

test("cancel: from My Trips goes back to My Trips", async () => {
  const { req, res, result } = fakeReqRes({ params: { id: "L1", bookingId: "B1" }, user: { _id: guest } });
  req.query = { from: "trips" };
  await controller.cancelBooking(req, res);
  assert.strictEqual(booking.status, "cancelled");
  assert.strictEqual(result.redirect, "/trips");
});

test("cancel: from the listing page goes back to the listing", async () => {
  const { req, res, result } = fakeReqRes({ params: { id: "L1", bookingId: "B1" }, user: { _id: guest } });
  await controller.cancelBooking(req, res);
  assert.strictEqual(result.redirect, "/listings/L1");
});
