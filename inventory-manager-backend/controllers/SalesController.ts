import { Request, Response } from 'express';
import { Product, Inventory, Sale } from '../models';

type SaleBody = {
  productId: string;
  quantity: number;
  salePrice: number;
  totalAmount: number;
  channel: string;
  channelOrderId?: string;
};

// Create a new sale
export const createSale = async (req: Request<{}, {}, SaleBody>, res: Response) => {
  try {
    const { productId, quantity, salePrice, totalAmount, channel, channelOrderId } = req.body;

    // Check if sufficient inventory is available
    const inventory = await Inventory.findOne({ productId });
    if (!inventory || inventory.quantityOnHand < quantity) {
      return res.status(400).json({ message: 'Insufficient inventory' });
    }

    // Create the sale record
    const sale = new Sale({
      productId,
      quantity,
      salePrice,
      totalAmount,
      channel,
      channelOrderId
    });
    const newSale = await sale.save();

    // Update inventory
    inventory.quantityOnHand -= quantity;
    await inventory.save();

    res.status(201).json(newSale);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// Get all sales
export const getSales = async (req: Request, res: Response) => {
  try {
    const sales = await Sale.find();
    res.json(sales);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};