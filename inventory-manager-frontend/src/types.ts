
interface Product {
  _id: string;
  name: string;
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
  productId: string; // populated object after populate()
  quantity: number;
  dateTime: string;
  channel: string;
  salePrice: number;
}

export type {
  Product,
  InventoryItem,
  InventoryAdjustment,
  Sale
};