import { Request, Response } from 'express';
import { Product, Inventory, Sale } from '../models';

interface CsvDataItem {
  name: string;
  quantity_inventory: number;
  quantity_sold: number;
  format: string;
  tags: string;
  deprecated: boolean;
}

interface CsvImportResult {
  imported: number;
  errors: number;
  messages: string[];
}

export const importCsv = async (req: Request<{}, {}, { csvData: CsvDataItem[] }>, res: Response) => {
  try {
    const { csvData } = req.body;
    let imported = 0;
    let errors = 0;
    const messages: string[] = [];

    for (const item of csvData) {
      try {
        // Create product
        const product = new Product({
          name: item.name,
          tags: [item.format, item.tags], // Combine format and tags as separate tags
          price: 0, // Default price as not provided in CSV
          isDeprecated: item.deprecated
        });

        const savedProduct = await product.save();

        // Create inventory
        const inventory = new Inventory({
          productId: savedProduct._id,
          quantityOnHand: item.quantity_inventory
        });

        await inventory.save();

        // Create sale record if there are sold items
        if (item.quantity_sold > 0) {
          const sale = new Sale({
            productId: savedProduct._id,
            quantity: item.quantity_sold,
            salePrice: 0, // Default as price not provided
            totalAmount: 0, // Calculate based on salePrice * quantity if price were known
            channel: 'csv_import'
          });

          await sale.save();
        }

        imported++;
        messages.push(`Successfully imported product: ${item.name}`);

      } catch (err: any) {
        errors++;
        messages.push(`Error importing ${item.name}: ${err.message}`);
        console.error(`Error importing CSV item ${JSON.stringify(item)}:`, err);
      }
    }

    const result: CsvImportResult = {
      imported,
      errors,
      messages
    };

    res.json(result);
  } catch (err: any) {
    console.error('Error in CSV import:', err);
    res.status(500).json({ message: `Server error during CSV import: ${err.message}` });
  }
};