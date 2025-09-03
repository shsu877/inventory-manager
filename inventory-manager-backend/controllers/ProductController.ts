import { Request, Response } from "express";
import { Product } from "../models";
import mongoose from "mongoose";

type ProductParams = { id: string };
type ProductBody = {
  name: string;
  category?: string;
  tags?: string[];
  price: number;
  isDeprecated?: boolean;
};

type BulkPriceBody = {
  productIds: string[];
  price: number;
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
export const getProductById = async (
  req: Request<ProductParams>,
  res: Response
) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new product
export const createProduct = async (
  req: Request<{}, {}, ProductBody>,
  res: Response
) => {
  const product = new Product(req.body);
  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// Update a product
export const updateProduct = async (
  req: Request<ProductParams, {}, Partial<ProductBody>>,
  res: Response
) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    Object.assign(product, req.body);
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a product
export const deleteProduct = async (
  req: Request<ProductParams>,
  res: Response
) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    await product.deleteOne();
    res.json({ message: "Product deleted" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Bulk update product prices
export const bulkUpdatePrice = async (
  req: Request<{}, {}, BulkPriceBody>,
  res: Response
) => {
  try {
    const { productIds, price } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res
        .status(400)
        .json({ message: "productIds must be a non-empty array" });
    }

    if (typeof price !== "number" || price < 0) {
      return res
        .status(400)
        .json({ message: "price must be a positive number" });
    }

    const validProductIds = productIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validProductIds.length === 0) {
      return res.status(400).json({ message: "No valid productIds provided." });
    }

    // Update all products with the new price
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { price: price } }
    );

    res.json({
      message: `Updated price for ${result.modifiedCount} products`,
      updatedCount: result.modifiedCount,
      requestedCount: productIds.length,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get all unique tags
export const getAllTags = async (req: Request, res: Response) => {
  try {
    const tags = await Product.distinct("tags");
    const uniqueTags = [...new Set(tags.flat())].sort();
    res.json(uniqueTags);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
