export interface ProductVariant {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  isDeprecated: boolean;
  variants: ProductVariant[];
}