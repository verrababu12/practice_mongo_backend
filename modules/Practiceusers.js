const mongoose = require("mongoose");

const LoginusersSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
});

const LoginModel = mongoose.model("loginusers", LoginusersSchema);
module.exports = LoginModel;
