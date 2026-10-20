// Fake request/response objects so we can test controllers and middleware
// without starting the server or touching the real database.
const mongoose = require("mongoose");

const newId = () => new mongoose.Types.ObjectId();

function fakeReqRes({ params = {}, body = {}, user = null } = {}) {
  const result = { flash: null, redirect: null, nextCalled: false };
  const req = {
    params,
    body,
    user,
    flash: (type, message) => (result.flash = { type, message }),
  };
  const res = {
    locals: { currUser: user },
    redirect: (url) => (result.redirect = url),
  };
  const next = () => (result.nextCalled = true);
  return { req, res, next, result };
}

// A date N days from today, as YYYY-MM-DD (what a date input sends).
function daysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("en-CA");
}

// Mongoose's findById(...).populate(...) returns a chain; this fakes it.
const populated = (value) => ({ populate: async () => value });

module.exports = { newId, fakeReqRes, daysFromToday, populated };
