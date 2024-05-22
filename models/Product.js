// models/Product.js

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  productsrno:{type: Number,required:true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  imagePath: { type: String }, // Path to the image file in the server file system
  images:{type:Array}
});

module.exports = mongoose.model('Product', productSchema);

