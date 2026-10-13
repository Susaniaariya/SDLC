const Joi = require("joi");
module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    price: Joi.number().required().min(0),
    image: Joi.string().allow("", null),
    propertyType: Joi.string()
      .valid("House", "Apartment", "Guesthouse", "Hotel", "Villa", "Cabin")
      .allow("", null),
    geo: Joi.object({
      lat: Joi.number().allow("", null),
      lng: Joi.number().allow("", null),
    }).allow(null),
  }).required(),
});
module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required(),
  }).required(),
});
