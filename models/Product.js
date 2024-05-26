// models/Product.js

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  productsrno:{type: Number,required:true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  images:{type:Array},
  discount:{type:Number},
  status:{type:String}
});

module.exports = mongoose.model('Product', productSchema);

