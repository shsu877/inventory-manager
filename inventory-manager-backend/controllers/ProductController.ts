import { Request, Response } from 'express';
import { Product } from '../models';

type ProductParams = { id: string };
type ProductBody = {
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  isDeprecated?: boolean;
};

// Get all products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single product
export const getProductById = async (req: Request<ProductParams>, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new product
export const createProduct = async (req: Request<{}, {}, ProductBody>, res: Response) => {
  const product = new Product(req.body);
  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// Update a product
export const updateProduct = async (req: Request<ProductParams, {}, Partial<ProductBody>>, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    Object.assign(product, req.body);
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a product
export const deleteProduct = async (req: Request<ProductParams>, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};