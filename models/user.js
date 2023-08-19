let mongoose = require("mongoose");
let passportLocalMongoose = require("passport-local-mongoose");
let Schema = new mongoose.Schema({
  email: {
    type: String,
    require: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
Schema.plugin(passportLocalMongoose);
let User = mongoose.model("User", Schema);
module.exports = User;
