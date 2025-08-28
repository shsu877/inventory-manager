interface ProductVariant {
  id: string;
  color: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  isDeprecated: boolean;
  variants: ProductVariant[];
}

interface InventoryItem {
  productId: string;
  variantId: string;
  quantityOnHand: number;
  product?: Product;
  lastSold?: string;
}

interface InventoryAdjustment {
  productId: string;
  variantId: string;
  adjustment: number;
  reason?: string;
}

interface Sale {
  id: string;
  productId: string;
  variantId: string;
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
  ProductVariant,
  Sale
};