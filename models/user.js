let mongoose = require("mongoose");
let passportLocalMongoose = require("passport-local-mongoose");
var findOrCreate = require("mongoose-findorcreate");
let Schema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  googleId: String,
});
Schema.plugin(passportLocalMongoose);
Schema.plugin(findOrCreate);
let User = mongoose.model("User", Schema);
module.exports = User;
