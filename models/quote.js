let mongoose = require("mongoose");
let Schema = new mongoose.Schema(
  {
    quote: {
      type: String,
      require: true,
    },
    author: {
      type: String,
      require: true,
    },
  },
  { timestamps: true }
);
let Quote = mongoose.model("Quote", Schema);
module.exports = Quote;
