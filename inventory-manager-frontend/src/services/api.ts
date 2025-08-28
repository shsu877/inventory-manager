import axios from 'axios';
import { InventoryItem, Sale } from '../types';

const API = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});

export const InventoryService = {
  getInventory: async (): Promise<InventoryItem[]> => {
    const response = await API.get('/inventory');
    return response.data;
  },
  adjustInventory: async (adjustment: {
    productId: string;
    variantId: string;
    adjustment: number;
  }): Promise<InventoryItem> => {
    const response = await API.put('/inventory', adjustment);
    return response.data;
  }
};

export const ProductService = {
  getProducts: async (): Promise<any[]> => {
    const response = await API.get('/products');
    return response.data;
  },

  updateProduct: async (productId: string, data: any): Promise<any> => {
    const response = await API.put(`/products/${productId}`, data);
    return response.data;
  },

  updateVariant: async (productId: string, variantData: any): Promise<any> => {
    const response = await API.put(`/products/${productId}/variants`, variantData);
    return response.data;
  }
};

export const SalesService = {
  getSales: async (): Promise<Sale[]> => {
    const response = await API.get('/sales');
    return response.data;
  },
  createSale: async (sale: {
    productId: string;
    variantId: string;
    quantity: number;
    totalAmount: number;
    channel?: string;
    channelOrderId?: string;
  }): Promise<Sale> => {
    const response = await API.post('/sales', sale);
    return response.data;
  }
};
