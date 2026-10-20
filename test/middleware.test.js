const { test } = require("node:test");
const assert = require("node:assert");
const Listing = require("../models/listing");
const Review = require("../models/review");
const { isOwner, isReviewAuthor } = require("../middleware");
const { newId, fakeReqRes, populated } = require("./helpers");

const me = { _id: newId() };
const run = async (fn) => {
  const { req, res, next, result } = fakeReqRes({ params: { id: "L1", reviewId: "R1" }, user: me });
  await fn(req, res, next);
  return result;
};

test("isOwner: missing listing redirects instead of crashing", async () => {
  Listing.findById = () => populated(null);
  const r = await run(isOwner);
  assert.strictEqual(r.redirect, "/listings");
});

test("isOwner: listing with no owner is refused", async () => {
  Listing.findById = () => populated({ owner: null });
  const r = await run(isOwner);
  assert.strictEqual(r.nextCalled, false);
});

test("isOwner: the owner is let through", async () => {
  Listing.findById = () => populated({ owner: { _id: me._id } });
  const r = await run(isOwner);
  assert.strictEqual(r.nextCalled, true);
});

test("isOwner: someone else is refused", async () => {
  Listing.findById = () => populated({ owner: { _id: newId() } });
  const r = await run(isOwner);
  assert.strictEqual(r.nextCalled, false);
});

test("isReviewAuthor: missing review redirects instead of crashing", async () => {
  Review.findById = () => populated(null);
  const r = await run(isReviewAuthor);
  assert.strictEqual(r.redirect, "/listings/L1");
});

test("isReviewAuthor: the author is let through", async () => {
  Review.findById = () => populated({ author: me._id });
  const r = await run(isReviewAuthor);
  assert.strictEqual(r.nextCalled, true);
});
