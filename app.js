const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js"); // Ensure this path is correct

const MONGO_URL = "mongodb://127.0.0.1:27017/MyNewProject"; // Ensure this matches your MongoDB setup

// --- Connect to MongoDB ---
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log("DB Connection Error:", err));

// --- App configuration ---
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// --- Session configuration ---

app.use(
  session({
    secret: "your-secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, // Security best practice
    },
  }),
);

app.use(flash());

// --- Passport configuration (FIXED) ---
app.use(passport.initialize());
app.use(passport.session());

// The strategy must explicitly look for 'email' in the request body
// to match the configuration in User.js
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// --- Flash middleware for all routes ---
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user; // Added for display in boilerplate/navbar
  next();
});

// --- Routes ---

// User routes
app.use("/", userRouter);

// Listings routes
app.use("/listings", listingRouter);

// Review routes
app.use("/listings", reviewRouter);

const Listing = require("./models/listing");

// Home route
app.get("/", async (req, res, next) => {
  try {
    const featured = await Listing.find({}).limit(4);
    res.render("home.ejs", { featured });
  } catch (err) {
    next(err);
  }
});

app.get("/test-listings", async (req, res) => {
  try {
    const listings = await Listing.find({}).populate("owner");
    console.log("Listings from DB:", listings);
    res.send(listings);
  } catch (err) {
    console.log(err);
    res.send("Error fetching listings");
  }
});

// --- 404 handler ---
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// --- Error handler ---
app.use((err, req, res, next) => {
  const statusCode =
    err.statusCode && typeof err.statusCode === "number"
      ? err.statusCode
      : 500;

  const message = err.message || "Something went wrong";

  res.status(statusCode).render("error.ejs", { message });
});
// --- Start server ---
app.listen(8080, () => {
  console.log("Server is listening on port 8080");
});
