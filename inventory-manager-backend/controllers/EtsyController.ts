import { Request, Response } from 'express';
import axios from 'axios';
import { Sale, Product, Inventory } from '../models';

// Etsy API configuration
const ETSY_API_BASE = 'https://openapi.etsy.com/v3';
const ETSY_SANDBOX_API_BASE = 'https://sandbox.openapisandbox.etsy.com/v3';

// Etsy credentials configuration
interface EtsyConfig {
  apiKey: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  useSandbox: boolean;
}

// Default configuration (these would be set via environment variables in production)
const etsyConfig: EtsyConfig = {
  apiKey: process.env.ETSY_API_KEY || '',
  clientId: process.env.ETSY_CLIENT_ID || '',
  clientSecret: process.env.ETSY_CLIENT_SECRET || '',
  redirectUri: process.env.ETSY_REDIRECT_URI || 'http://localhost:3001/auth/etsy/callback',
  useSandbox: process.env.ETSY_SANDBOX === 'true'
};

// Get sales data from Etsy API
export const getEtsySales = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const apiBase = etsyConfig.useSandbox ? ETSY_SANDBOX_API_BASE : ETSY_API_BASE;

    // Etsy API endpoint for shop receipts (sales data)
    // Note: This requires authentication and proper shop permissions
    const url = `${apiBase}/application/listings/active`;

    // TODO: Implement proper OAuth flow and authentication
    // For now, this is a placeholder structure
    const headers = {
      'x-api-key': etsyConfig.apiKey,
      'Content-Type': 'application/json'
    };

    const response = await axios.get(url, { headers });

    res.json({
      message: 'Etsy data retrieved (placeholder)',
      data: response.data,
      dateRange: { startDate, endDate }
    });

  } catch (error: any) {
    console.error('Error fetching Etsy sales:', error);

    if (error.response) {
      return res.status(error.response.status).json({
        message: 'Etsy API Error',
        details: error.response.data
      });
    }

    res.status(500).json({
      message: 'Failed to fetch Etsy sales data',
      error: error.message
    });
  }
};

// Start Etsy OAuth flow
export const startEtsyAuth = (req: Request, res: Response) => {
  const authUrl = `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=${encodeURIComponent(etsyConfig.redirectUri)}&scope=profile_r email_r listings_r transactions_r&client_id=${etsyConfig.clientId}`;

  res.json({
    authUrl,
    redirectUri: etsyConfig.redirectUri
  });
};

// Handle Etsy OAuth callback
export const handleEtsyCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    // Exchange authorization code for access token
    const tokenUrl = `${ETSY_API_BASE}/public/oauth/token`;
    const tokenData = {
      grant_type: 'authorization_code',
      client_id: etsyConfig.clientId,
      client_secret: etsyConfig.clientSecret,
      redirect_uri: etsyConfig.redirectUri,
      code: code as string
    };

    const tokenResponse = await axios.post(tokenUrl, tokenData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // TODO: Store access token securely (in database or secure storage)
    const accessToken = tokenResponse.data.access_token;

    res.json({
      message: 'Etsy authentication successful',
      tokenType: 'access_token',
      expiresIn: tokenResponse.data.expires_in
    });

  } catch (error: any) {
    console.error('Error handling Etsy callback:', error);
    res.status(500).json({
      message: 'Failed to complete Etsy authentication',
      error: error.message
    });
  }
};

// Get shop receipts (sales transactions) from Etsy
export const getEtsyReceipts = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, shopId } = req.query;

    if (!shopId) {
      return res.status(400).json({ message: 'shopId is required' });
    }

    const apiBase = etsyConfig.useSandbox ? ETSY_SANDBOX_API_BASE : ETSY_API_BASE;

    // Etsy API endpoint for shop receipts
    const url = `${apiBase}/application/shops/${shopId}/receipts`;

    const params: any = {};
    if (startDate) params.min_created = startDate;
    if (endDate) params.max_created = endDate;

    const headers = {
      'x-api-key': etsyConfig.apiKey,
      'Content-Type': 'application/json',
      // TODO: Add proper authorization header with access token
      // 'Authorization': `Bearer ${accessToken}`
    };

    const response = await axios.get(url, { headers, params });

    res.json({
      message: 'Etsy receipts retrieved',
      data: response.data,
      dateRange: { startDate: startDate || 'all', endDate: endDate || 'all' }
    });

  } catch (error: any) {
    console.error('Error fetching Etsy receipts:', error);
    res.status(500).json({
      message: 'Failed to fetch Etsy receipts',
      error: error.message
    });
  }
};

// Get shop information
export const getEtsyShopInfo = async (req: Request, res: Response) => {
  try {
    const apiBase = etsyConfig.useSandbox ? ETSY_SANDBOX_API_BASE : ETSY_API_BASE;

    // Get user's shops
    const url = `${apiBase}/application/user/shops`;

    const headers = {
      'x-api-key': etsyConfig.apiKey,
      'Content-Type': 'application/json'
    };

    const response = await axios.get(url, { headers });

    res.json({
      message: 'Etsy shop info retrieved',
      data: response.data
    });

  } catch (error: any) {
    console.error('Error fetching Etsy shop info:', error);
    res.status(500).json({
      message: 'Failed to fetch Etsy shop information',
      error: error.message
    });
  }
};

// Import Etsy sales data into our system
export const importEtsySales = async (req: Request, res: Response) => {
  try {
    const { etsyData } = req.body;

    if (!etsyData || !Array.isArray(etsyData)) {
      return res.status(400).json({ message: 'etsyData array is required' });
    }

    const importedSales = [];
    const errors = [];

    for (const etsySale of etsyData) {
      try {
        // TODO: Transform Etsy data structure to match our internal Sale model
        // This is a placeholder implementation - needs to be adjusted based on actual Etsy API response

        // Try to find matching product by name or create a placeholder
        let product = await Product.findOne({
          name: new RegExp(etsySale.title, 'i') // Case-insensitive search
        });

        if (!product) {
          // Create a new product if not found
          product = new Product({
            name: etsySale.title,
            description: etsySale.description || 'Imported from Etsy',
            price: etsySale.price,
            quantity: etsySale.quantity,
            tags: etsySale.tags || [],
            isDeprecated: false
          });
          await product.save();

          // Create inventory entry
          const inventory = new Inventory({
            productId: product._id,
            quantityOnHand: 0 // Will be adjusted when sales are processed
          });
          await inventory.save();
        }

        // Create sale record
        const sale = new Sale({
          productId: product._id,
          quantity: etsySale.quantity,
          salePrice: etsySale.price,
          totalAmount: etsySale.price * etsySale.quantity,
          channel: 'etsy',
          channelOrderId: etsySale.receipt_id?.toString(),
          dateTime: new Date(etsySale.created_timestamp * 1000) // Convert Unix timestamp
        });

        await sale.save();
        importedSales.push(sale);

      } catch (error: any) {
        console.error('Error importing individual sale:', error);
        errors.push({
          sale: etsySale,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Etsy sales import completed',
      imported: importedSales.length,
      errors: errors.length,
      data: {
        importedSales,
        errors
      }
    });

  } catch (error: any) {
    console.error('Error importing Etsy sales:', error);
    res.status(500).json({
      message: 'Failed to import Etsy sales',
      error: error.message
    });
  }
};