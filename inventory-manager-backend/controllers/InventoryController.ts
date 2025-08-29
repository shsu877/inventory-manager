import { Request, Response } from 'express';
import { Inventory } from '../models';

type GetInventoryParams = { productId?: string };
type InventoryCreateBody = { productId: string; quantityOnHand: number; };
type AdjustmentBody = { productId: string; adjustment: number; };

// Get all inventory records
export const getInventory = async (req: Request, res: Response) => {
  try {
    const inventory = await Inventory.find().populate('productId');
    res.json(inventory);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get inventory record for a product
export const getInventoryByProduct = async (req: Request<GetInventoryParams>, res: Response) => {
  try {
    const inventory = await Inventory.findOne({
      productId: req.params.productId,
    }).populate('productId');
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory record not found' });
    }
    res.json(inventory);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Create or update inventory record
export const upsertInventory = async (req: Request<{}, {}, InventoryCreateBody>, res: Response) => {
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
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// Adjust inventory for a product
export const adjustInventory = async (req: Request<{}, {}, AdjustmentBody>, res: Response) => {
  try {
    const { productId, adjustment } = req.body;

    const inventory = await Inventory.findOne({ productId });
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory record not found' });
    }

    inventory.quantityOnHand += adjustment;
    const updatedInventory = await inventory.save();

    res.json(updatedInventory);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};