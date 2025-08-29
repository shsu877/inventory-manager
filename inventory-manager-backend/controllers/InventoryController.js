const { Inventory } = require('../models');

// Get all inventory records
exports.getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find().populate('productId');
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get inventory record for a product
exports.getInventoryByProduct = async (req, res) => {
  try {
    const inventory = await Inventory.findOne({
      productId: req.params.productId,
    }).populate('productId');
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory record not found' });
    }
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create or update inventory record
exports.upsertInventory = async (req, res) => {
  try {
    const { productId, quantityOnHand } = req.body;
    let inventory = await Inventory.findOne({ productId });
    if (inventory) {
      inventory.quantityOnHand = quantityOnHand;
    } else {
      inventory = new Inventory({ productId, quantityOnHand });
    }
    const updatedInventory = await inventory.save();
    res.json(updatedInventory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Adjust inventory for a product
exports.adjustInventory = async (req, res) => {
  try {
    const { productId, adjustment } = req.body;

    const inventory = await Inventory.findOne({ productId });
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory record not found' });
    }

    inventory.quantityOnHand += adjustment;
    const updatedInventory = await inventory.save();

    res.json(updatedInventory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};