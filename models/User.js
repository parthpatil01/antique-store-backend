
const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  country: { type: String, required: true },
  streetAddress: { type: String, required: true },
  city: { type: String, required: true },
  region: { type: String, required: true },  
  postalCode: { type: String, required: true }
});

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetToken: { type: String, required: false },
  cart: { type: Array, required: false },
  country: { type: String, required: false },
  streetAddress: { type: String, required: false },
  city: { type: String, required: false },
  region: { type: String, required: false },
  postalCode: { type: String, required: false },
  phone: { type: Number, required: false },
  wishlist: { type: [mongoose.Schema.Types.ObjectId], default: [], ref: 'Product' },
  orders: [
    {
      product: { type: Array, required: false },
      receiptId: String,
      invoice: {
        invoiceNumber: String,
        totalAmount: Number,
        tax: Number,
        paymentMethod: String,
        userInfoBilling: billingSchema
      },
      orderId: String,
      date: { type: Date, default: Date.now }
    }
  ]
});




const User = mongoose.model('User', userSchema);

module.exports = User;