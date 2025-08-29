const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const { Product, Inventory, Sale } = require('./models');
const ProductController = require('./controllers/ProductController');
const SalesController = require('./controllers/SalesController');
const InventoryController = require('./controllers/InventoryController');
const AuthController = require('./controllers/AuthController');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// CORS
app.use(cors({
  origin: 'http://localhost:3001', // allow your frontend origin
  credentials: true
}));
app.use(cors({
  origin: 'http://localhost:3001', // allow your frontend origin
  credentials: true
}));

// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://shsu877:ODjnrJZrQ7aO4xHL@sticker-inventory.hbksle7.mongodb.net/inventory-manager?retryWrites=true&w=majority', {
  useNewUrlParser: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Passport config
app.use(passport.initialize());
require('./config/passport')(passport);

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Inventory Manager API is running!');
});

// Auth routes
app.post('/api/auth/register', AuthController.register);
app.post('/api/auth/login', AuthController.login);

// Product routes
app.get('/api/products', ProductController.getProducts);
app.get('/api/products/:id', ProductController.getProductById);
app.post('/api/products', ProductController.createProduct);
app.put('/api/products/:id', ProductController.updateProduct);
app.delete('/api/products/:id', ProductController.deleteProduct);

// Inventory routes
app.get('/api/inventory', InventoryController.getInventory);
app.get('/api/inventory/:productId', InventoryController.getInventoryByProduct);
app.post('/api/inventory', InventoryController.upsertInventory);
app.put('/api/inventory', InventoryController.adjustInventory);

// Sales routes
app.post('/api/sales', SalesController.createSale);
app.get('/api/sales', SalesController.getSales);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});