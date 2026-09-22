const User = require("../models/user.js");

module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};
module.exports.signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const newUser = new User({ email, username });

    // Register user using method from passport-local-mongoose
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to YatraStay");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("signup");
  }
};
module.exports.renderLoginform = (req, res) => {
  res.render("users/login.ejs");
};
module.exports.login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      req.flash("error", "Invalid username or password.");
      return res.redirect("/login");
    }

    const result = await user.authenticate(password);

    if (result.user) {
      req.logIn(result.user, (err) => {
        if (err) return next(err);

        req.flash("success", "Welcome back to YatraStay!");

        // Redirect to the saved URL or default to /listings
        const redirectUrl = req.session.returnTo || "/listings";
        delete req.session.returnTo; // Clean up session
        return res.redirect(redirectUrl);
      });
    } else {
      req.flash("error", "Invalid username or password.");
      return res.redirect("/login");
    }
  } catch (e) {
    console.error("LOGIN EXCEPTION:", e);
    req.flash("error", "An unknown error occurred during login.");
    return res.redirect("/login");
  }
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      next(err);
    }
    req.flash("success", "You are logged out now");
    res.redirect("/listings");
  });
};
