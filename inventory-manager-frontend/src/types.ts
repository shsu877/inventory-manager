
interface Product {
  _id: string;
  name: string;
  description: string;
  category?: string;
  tags: string[];
  price: number;
  isDeprecated: boolean;
}

interface InventoryItem {
  productId: string;
  quantityOnHand: number;
  lastSold?: string;
}

interface InventoryAdjustment {
  productId: string;
  adjustment: number;
  reason?: string;
}

interface Sale {
  _id: string;
  productId: string;
  quantity: number;
  salePrice: number;
  saleDate: string;
  channel: string;
  product?: Product;
}

export type {
  Product,
  InventoryItem,
  InventoryAdjustment,
  Sale
};