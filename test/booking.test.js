const { test, beforeEach } = require("node:test");
const assert = require("node:assert");
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const controller = require("../controllers/booking");
const { newId, fakeReqRes, daysFromToday } = require("./helpers");

const host = newId();
const guest = newId();
let listing, saved, clash;

beforeEach(() => {
  listing = { _id: newId(), price: 3000, owner: host, maxGuests: 4 };
  saved = null;
  clash = false;
  Listing.findById = async () => listing;
  Booking.exists = async () => clash;
  Booking.create = async (data) => (saved = data);
});

async function book(booking, user = guest) {
  const { req, res, result } = fakeReqRes({
    params: { id: "L1" },
    body: { booking },
    user: { _id: user },
  });
  await controller.createBooking(req, res);
  return result;
}

const valid = () => ({ checkIn: daysFromToday(5), checkOut: daysFromToday(8), guests: "2" });

// ---------- Booking model ----------

test("model: a complete booking passes validation", async () => {
  const b = new Booking({
    listing: newId(), guest: newId(),
    checkIn: new Date(), checkOut: new Date(), guests: 2, totalPrice: 9000,
  });
  await b.validate();
  assert.strictEqual(b.status, "confirmed");
});

test("model: missing fields, 0 guests and unknown status are rejected", async () => {
  const b = new Booking({ guests: 0, status: "pending" });
  const err = await b.validate().catch((e) => e);
  for (const field of ["listing", "guest", "checkIn", "checkOut", "guests", "totalPrice", "status"]) {
    assert.ok(err.errors[field], `expected an error on ${field}`);
  }
});

// ---------- Creating a booking ----------

test("create: a valid 3-night stay is saved with the server's price", async () => {
  const r = await book(valid());
  assert.strictEqual(r.flash.type, "success");
  assert.strictEqual(saved.totalPrice, 9000);
  assert.ok(saved.guest.equals(guest), "guest comes from the login session");
});

test("create: price sent in the form is ignored", async () => {
  await book({ ...valid(), totalPrice: 1 });
  assert.strictEqual(saved.totalPrice, 9000);
});

test("create: check-in today is allowed", async () => {
  const r = await book({ checkIn: daysFromToday(0), checkOut: daysFromToday(1), guests: "1" });
  assert.strictEqual(r.flash.type, "success");
});

const rejected = [
  ["past check-in", { checkIn: daysFromToday(-1), checkOut: daysFromToday(2), guests: "1" }, "past"],
  ["check-out same day as check-in", { checkIn: daysFromToday(5), checkOut: daysFromToday(5), guests: "1" }, "after check-in"],
  ["missing dates", { guests: "1" }, "choose check-in"],
  ["0 guests", { ...valid(), guests: "0" }, "at least 1"],
  ["more guests than allowed", { ...valid(), guests: "9" }, "up to 4"],
];
for (const [name, body, expected] of rejected) {
  test(`create: rejects ${name}`, async () => {
    const r = await book(body);
    assert.strictEqual(r.flash.type, "error");
    assert.match(r.flash.message, new RegExp(expected));
    assert.strictEqual(saved, null, "nothing should be saved");
  });
}

test("create: host can't book their own listing", async () => {
  const r = await book(valid(), host);
  assert.match(r.flash.message, /own listing/);
  assert.strictEqual(saved, null);
});

test("create: overlapping dates are rejected", async () => {
  clash = true;
  const r = await book(valid());
  assert.match(r.flash.message, /already booked/);
  assert.strictEqual(saved, null);
});

test("create: missing listing goes back to /listings", async () => {
  listing = null;
  const r = await book(valid());
  assert.strictEqual(r.redirect, "/listings");
});

// ---------- Cancelling a booking ----------

async function cancel(found, user = guest) {
  Booking.findById = async () => found;
  const { req, res, result } = fakeReqRes({
    params: { id: "L1", bookingId: "B1" },
    user: { _id: user },
  });
  await controller.cancelBooking(req, res);
  return result;
}

test("cancel: the guest can cancel their own booking", async () => {
  const b = { guest, status: "confirmed", save: async () => {} };
  const r = await cancel(b);
  assert.strictEqual(b.status, "cancelled");
  assert.strictEqual(r.flash.type, "success");
});

test("cancel: someone else can't cancel it", async () => {
  const b = { guest, status: "confirmed", save: async () => {} };
  const r = await cancel(b, newId());
  assert.strictEqual(b.status, "confirmed");
  assert.match(r.flash.message, /your own/);
});

test("cancel: missing booking doesn't crash", async () => {
  const r = await cancel(null);
  assert.match(r.flash.message, /doesn't exist/);
});
