const mongoose = require('mongoose');

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  tags: [String],
  price: { type: Number, required: true },
  isDeprecated: { type: Boolean, default: false },
  variants: [{
    id: { type: String, required: true },
    name: { type: String, required: true }
  }]
});

const Product = mongoose.model('Product', productSchema);

// Inventory Schema 
const inventorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: String, required: true },
  quantityOnHand: { type: Number, required: true, default: 0 }
});

const Inventory = mongoose.model('Inventory', inventorySchema);

// Sales Schema
const salesSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: String, required: true },
  quantity: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  channel: { type: String, required: true },
  channelOrderId: String,
  dateTime: { type: Date, required: true, default: Date.now }
});

const Sale = mongoose.model('Sale', salesSchema);

module.exports = { Product, Inventory, Sale };