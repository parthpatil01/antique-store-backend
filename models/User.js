
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  resetToken: {
    type: String,
    required: false
  },
  cart: {
    type: Array,
    required: false
  },
  country: {
    type:String,
    required:false
  },
  streetAddress: {
    type:String,
    required:false
  },
  city: {
    type:String,
    required:false
  },
  region: {
    type:String,
    required:false
  },
  postalCode: {
    type:String,
    required:false
  },
  phone: {
    type:Number,
    required:false
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;