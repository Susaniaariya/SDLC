const multer = require("multer");
const { storage } = require("../init/cloudinary.js");

// Up to 5 images per listing, 5 MB each
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed."), false);
  },
});

module.exports = upload;
