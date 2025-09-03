import express from 'express';
import mongoose from 'mongoose';
import passport from 'passport';
import { Product, Inventory, Sale } from './models';
import * as ProductController from './controllers/ProductController';
import * as AuthController from './controllers/AuthController';
import * as SalesController from './controllers/SalesController';
import * as InventoryController from './controllers/InventoryController';
import * as EtsyController from './controllers/EtsyController';
import * as CsvImportController from './controllers/CsvImportController';
import passportConfig from './config/passport';
import { authenticateToken } from './middleware/auth';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port: string | number = process.env.PORT!;

// CORS
const corsOrigin = process.env.CORS_ORIGIN!;
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

// Connect to MongoDB Atlas
const mongoUri = process.env.MONGODB_URI!;
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch((err: any) => console.log(err));

// Passport config
app.use(passport.initialize());
passportConfig(passport);

// Middleware
app.use(express.json());

// Routes
app.get('/', (req: express.Request, res: express.Response) => {
  res.send('Inventory Manager API is running!');
});

// Auth routes
// app.post('/api/auth/register', AuthController.register);
app.post('/api/auth/login', AuthController.login);

// Product routes
app.get('/api/products', authenticateToken, ProductController.getProducts);
app.get('/api/products/:id', authenticateToken, ProductController.getProductById);
app.get('/api/tags', authenticateToken, ProductController.getAllTags);
app.post('/api/products', authenticateToken, ProductController.createProduct);
app.put('/api/products/:id', authenticateToken, ProductController.updateProduct);
app.delete('/api/products/:id', authenticateToken, ProductController.deleteProduct);

// Inventory routes
app.get('/api/inventory', authenticateToken, InventoryController.getInventory);
app.get('/api/inventory/:productId', authenticateToken, InventoryController.getInventoryByProduct);
app.post('/api/inventory', authenticateToken, InventoryController.upsertInventory);
app.put('/api/inventory', authenticateToken, InventoryController.adjustInventory);

// Sales routes
app.post('/api/sales', authenticateToken, SalesController.createSale);
app.get('/api/sales', authenticateToken, SalesController.getSales);

// Etsy integration routes
app.get('/api/etsy/auth', authenticateToken, EtsyController.startEtsyAuth);
app.get('/auth/etsy/callback', EtsyController.handleEtsyCallback);
app.get('/api/etsy/shop', authenticateToken, EtsyController.getEtsyShopInfo);
app.get('/api/etsy/receipts', authenticateToken, EtsyController.getEtsyReceipts);
app.get('/api/etsy/sales', authenticateToken, EtsyController.getEtsySales);
app.post('/api/etsy/import', authenticateToken, EtsyController.importEtsySales);

// CSV import routes
app.post('/api/csv-import', authenticateToken, CsvImportController.importCsv);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});