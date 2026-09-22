const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongooseImport = require("passport-local-mongoose");
const passportLocalMongoose =
  passportLocalMongooseImport.default || passportLocalMongooseImport;

const userSchema = new Schema({
  email: { type: String, required: true },
});

// Attach the plugin
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
