import axios from 'axios';
import { InventoryItem, Product, Sale } from '../types';
import authService from './auth';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Set up authorization header if token exists
const token = authService.getToken();
if (token) {
  API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export const InventoryService = {
  getInventory: async (): Promise<InventoryItem[]> => {
    const response = await API.get('/inventory');
    return response.data;
  },
  adjustInventory: async (adjustment: {
    productId: string;
    adjustment: number;
  }): Promise<InventoryItem> => {
    const response = await API.put('/inventory', adjustment);
    return response.data;
  },
  upsertInventory: async (inventory: {
    productId: string;
    quantityOnHand: number;
  }): Promise<InventoryItem> => {
    const response = await API.post('/inventory', inventory);
    return response.data;
  }
};

export const ProductService = {
  getProducts: async (): Promise<Product[]> => {
    const response = await API.get('/products');
    return response.data;
  },

  getTags: async (): Promise<string[]> => {
    const response = await API.get('/tags');
    return response.data;
  },

  createProduct: async (productData: any): Promise<any> => {
    const response = await API.post('/products', productData);
    return response.data;
  },

  updateProduct: async (productId: string, data: any): Promise<any> => {
    const response = await API.put(`/products/${productId}`, data);
    return response.data;
  },

  updateVariant: async (productId: string, variantData: any): Promise<any> => {
    const response = await API.put(`/products/${productId}/variants`, variantData);
    return response.data;
  },

  deleteProduct: async (productId: string): Promise<void> => {
    await API.delete(`/products/${productId}`);
  },

  // Bulk update product prices (calls updateProduct for each item)
  bulkUpdatePrices: async (updates: { productId: string; price: number }[]): Promise<any[]> => {
    const results = [];
    for (const update of updates) {
      const result = await API.put(`/products/${update.productId}`, { price: update.price });
      results.push(result.data);
    }
    return results;
  }
};

// Etsy types
interface EtsyAuth {
  authUrl: string;
  redirectUri: string;
}

interface EtsyImportResult {
  imported: number;
  errors: number;
  data: {
    importedSales: any[];
    errors: any[];
  };
}

interface CsvImportResult {
  imported: number;
  errors: number;
  messages: string[];
}

export const SalesService = {
  getSales: async (): Promise<Sale[]> => {
    const response = await API.get('/sales');
    return response.data;
  },
  createSale: async (sale: {
    productId: string;
    quantity: number;
    salePrice: number;
    totalAmount: number;
    channel?: string;
    channelOrderId?: string;
  }): Promise<Sale> => {
    const response = await API.post('/sales', sale);
    return response.data;
  }
};

export const EtsyService = {
  startAuth: async (): Promise<EtsyAuth> => {
    const response = await API.get('/etsy/auth');
    return response.data;
  },

  getSales: async (startDate: string, endDate: string): Promise<any> => {
    const response = await API.get(`/etsy/sales?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  getReceipts: async (shopId: string, startDate?: string, endDate?: string): Promise<any> => {
    const params = new URLSearchParams();
    params.append('shopId', shopId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await API.get(`/etsy/receipts?${params.toString()}`);
    return response.data;
  },

  importSales: async (etsyData: any[]): Promise<EtsyImportResult> => {
    const response = await API.post('/etsy/import', { etsyData });
    return response.data;
  }
};

export const CsvService = {
  importCsv: async (csvData: any[]): Promise<CsvImportResult> => {
    const response = await API.post('/csv-import', { csvData });
    return response.data;
  }
};
