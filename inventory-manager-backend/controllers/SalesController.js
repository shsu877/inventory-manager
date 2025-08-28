const { Product, Inventory, Sale } = require('../models');

// Create a new sale
exports.createSale = async (req, res) => {
  try {
    const { productId, variantId, quantity, totalAmount, channel, channelOrderId } = req.body;

    // Check if sufficient inventory is available
    const inventory = await Inventory.findOne({ productId, variantId });
    if (!inventory || inventory.quantityOnHand < quantity) {
      return res.status(400).json({ message: 'Insufficient inventory' });
    }

    // Create the sale record
    const sale = new Sale({
      productId,
      variantId,
      quantity,
      totalAmount,
      channel,
      channelOrderId
    });
    const newSale = await sale.save();

    // Update inventory
    inventory.quantityOnHand -= quantity;
    await inventory.save();

    res.status(201).json(newSale);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all sales
exports.getSales = async (req, res) => {
  try {
    const sales = await Sale.find().populate('productId');
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};