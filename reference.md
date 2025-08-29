# Inventory Manager Reference Document

## 📋 Project Overview

This is a full-stack inventory management system built with:
- **Backend**: Node.js, Express.js, MongoDB with Mongoose
- **Frontend**: React with TypeScript, Material-UI, React Query
- **Architecture**: RESTful API, JWT authentication, React Query for state management

---

## 🏗️ Project Structure

```
/
├── inventory-manager-backend/
│   ├── controllers/
│   │   ├── AuthController.ts        # User authentication (register/login)
│   │   ├── ProductController.ts     # Product CRUD operations
│   │   ├── InventoryController.ts   # Stock management and adjustments
│   │   └── SalesController.ts       # Sales recording and reporting
│   ├── models/
│   │   ├── models.ts                # MongoDB schemas for Product, Inventory, Sale, User
│   │   └── models.js                # Legacy/CommonJS exports
│   ├── services/
│   │   ├── AuthService.ts           # JWT token generation/validation
│   │   └── GoogleDriveService.ts    # Cloud backup integration
│   └── server.ts                    # Express server setup, routes, middleware
│
└── inventory-manager-frontend/
    ├── src/
    │   ├── components/
    │   │   ├── CombinedInventoryTable.tsx    # Main inventory display with CRUD
    │   │   ├── SalesReport.tsx               # Sales history table
    │   │   ├── InventoryAdjustmentDialog.tsx # Stock adjustment with manual sales
    │   │   ├── AdjustInventoryForm.tsx       # Quick stock adjustment
    │   │   ├── ProductCreationDialog.tsx     # Add new products
    │   │   ├── LoginButton.tsx               # Authentication UI
    │   │   └── SalesReport.tsx               # Sales data visualization
    │   ├── services/
    │   │   ├── api.ts                        # Axios API client
    │   │   └── auth.ts                        # Authentication helpers
    │   ├── hooks/
    │   │   ├── useInventory.ts               # React Query hook
    │   │   ├── useProducts.ts                # React Query hook
    │   │   └── useSales.ts                   # React Query hook
    │   ├── types.ts                          # TypeScript interfaces
    │   └── App.tsx                           # Main React app component
```

---

## 💾 Database Models (MongoDB with Mongoose)

### Product Model
```typescript
interface IProduct {
  name: string;
  description: string;
  tags?: string[];
  price: number;
  isDeprecated: boolean;
}
```

### Inventory Model
```typescript
interface IInventory {
  productId: mongoose.Types.ObjectId;  // Reference to Product
  quantityOnHand: number;
}
```

### Sale Model
```typescript
interface ISale {
  productId: mongoose.Types.ObjectId;  // Reference to Product (populated)
  quantity: number;
  salePrice: number;                    // Price at time of sale
  totalAmount: number;                  // quantity * salePrice
  channel: string;                      // e.g., 'manual', 'web', 'store'
  channelOrderId?: string;             // External order tracking
  dateTime: Date;
}
```

### User Model
```typescript
interface IUser {
  email: string;                        // Unique
  password: string;                     // Hashed
  createdAt: Date;
  updatedAt: Date;
  validatePassword(password: string): Promise<boolean>;
}
```

---

## 🔧 Backend API Endpoints

### Authentication Routes
```
POST /api/auth/register    # Create new user account
POST /api/auth/login       # User login with JWT token
```

### Product Routes
```
GET    /api/products       # Get all products
GET    /api/products/:id   # Get single product by ID
POST   /api/products       # Create new product
PUT    /api/products/:id   # Update product
DELETE /api/products/:id   # Delete product
GET    /api/tags           # Get all unique tags across products
```

### Inventory Routes
```
GET    /api/inventory             # Get all inventory items (populated)
GET    /api/inventory/:productId  # Get inventory for specific product
PUT    /api/inventory             # Adjust inventory quantity
POST   /api/inventory             # Create/update inventory record
```

### Sales Routes
```
GET    /api/sales          # Get all sales (populated with product data)
POST   /api/sales          # Create new sale record
```

---

## 🖥️ Frontend Components & Hooks

### Core Components

#### CombinedInventoryTable
- **Purpose**: Main inventory display with full CRUD functionality
- **Features**:
  - Tabular view of all products with stock levels
  - Items sold calculation and display
  - Tag filtering with dropdown
  - Inline editing (product name, stock)
  - Delete confirmation dialogs
  - Manual/adjust inventory buttons
  - Product creation dialog

#### SalesReport
- **Purpose**: Historical sales data visualization
- **Features**:
  - Table view of all sales records
  - Product name display (from populated data)
  - Sales quantity, price, date, channel
  - Automatic data loading via React Query

#### InventoryAdjustmentDialog
- **Purpose**: Manual inventory adjustments with sale recording
- **Features**:
  - Positive/negative quantity adjustments
  - Automatic sale creation for reductions
  - Warning for excessive negative adjustments
  - Real-time stock preview

### Custom Hooks (React Query)

#### useInventory()
- **Query**: `['inventory']`
- **Returns**: Inventory data with populated product information
- **Auto-refreshes** on inventory mutations

#### useProducts()
- **Query**: `['products']`
- **Returns**: All active products
- **Auto-refreshes** on product mutations

#### useSales()
- **Query**: `['sales']`
- **Returns**: Sales data with populated product information
- **Auto-refreshes** on sale creation

---

## 🏷️ TypeScript Interfaces

### Frontend Types (src/types.ts)
```typescript
interface Product {
  _id: string;
  name: string;
  description: string;
  tags: string[];
  price: number;
  isDeprecated: boolean;
}

interface InventoryItem {
  productId: Product;        // Populated after populate()
  quantityOnHand: number;
  lastSold?: string;
}

interface Sale {
  _id: string;
  productId: Product;        // Populated after populate()
  quantity: number;
  salePrice: number;         // Individual item price at sale time
  saleDate: string;          // Frontend date string
  channel: string;
  totalAmount: number;       // Calculated: quantity * salePrice
}
```

---

## 🔄 Key Workflows

### 1. Product Management
```
User Action → ProductController → MongoDB → useProducts() → Component Update
   ↓
CombinedInventoryTable → ProductCreationDialog/Update/Delete
```

### 2. Inventory Adjustments
```
Manual Entry → InventoryAdjustmentDialog → SalesController (if negative)
   ↓                     ↓
CombinedInventoryTable → InventoryController → MongoDB
   ↓                        ↓
useInventory() ← invalidate → useSales()
```

### 3. Sales Recording
```
Stock Reduction → SalesController.createSale() → MongoDB
   ↓
useSales() invalidation → SalesReport updates
   ↓
Items Sold counter → CombinedInventoryTable updates
```

### 4. Authentication Flow
```
Frontend Login → AuthController → JWT Token → LocalStorage
   ↓
API Headers → Protected routes → AuthService.verifyToken()
```

---

## 🛠️ Utility Functions & Business Logic

### Sales Aggregation (CombinedInventoryTable)
```typescript
const salesByProduct = sales.reduce((acc, sale) => {
  acc[sale.productId._id.toString()] = (acc[sale.productId._id.toString()] || 0) + sale.quantity;
  return acc;
}, {} as Record<string, number>);

const itemsSold = salesByProduct[product._id.toString()] || 0;
```

### Tag Filtering
```typescript
const availableTags = [...new Set(products.flatMap(product => product.tags || []))].sort();
const filteredProducts = selectedTag
  ? products.filter(product => product.tags?.includes(selectedTag))
  : products;
```

### Stock Calculation
```typescript
const stock = inventoryItem?.quantityOnHand || 0;
```

### Sale Creation Logic
```typescript
if (adjustment < 0) {
  const saleData = {
    productId: productId,
    quantity: Math.abs(adjustment),
    salePrice: product.price,
    totalAmount: Math.abs(adjustment) * product.price,
    channel: 'manual'
  };
  await SalesService.createSale(saleData);
}
```

---

## ⚙️ Configuration & Setup

### Environment Variables
- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB Atlas connection string

### CORS Configuration
```typescript
app.use(cors({
  origin: 'http://localhost:3001', // Frontend URL
  credentials: true
}));
```

### MongoDB Connection
```typescript
mongoose.connect(MONGODB_CONNECTION_STRING);
```

---

## 🔐 Security & Authentication

### JWT Implementation
- **Token Storage**: LocalStorage on client side
- **Middleware**: Automatic inclusion in API headers
- **Verification**: Backend validation on protected routes

### Password Handling
- **Hashing**: bcrypt with 12 salt rounds
- **Storage**: Hashed passwords only

---

## 📊 Data Relationships

### Product → Inventory
- One-to-One: Each product has one inventory record
- Inventory tracks `quantityOnHand` per product
- Populated queries show full product information

### Product → Sales
- One-to-Many: Each product can have multiple sales
- Sales track `quantity`, `salePrice`, `totalAmount`
- Populated queries include product details
- Historical pricing preserved in `salePrice`

### User → System Access
- One-to-Many: Users can create/edit/delete all entities
- Role-based permissions (currently single user type)
- Session-based access control

---

## 🎯 Key Features Summary

✅ **Complete Inventory Tracking**: Real-time stock levels
✅ **Sales Management**: Automatic sale recording on stock reduction
✅ **Product CRUD**: Full product lifecycle management
✅ **Historical Data**: Sales price preservation over time
✅ **Data Import/Export**: Google Drive integration ready
✅ **Tag Filtering**: Categorization and organization
✅ **Real-time Updates**: React Query automatic refreshing
✅ **Responsive UI**: Material-UI component library
✅ **Type Safety**: Full TypeScript implementation

---

## 🚨 Important Notes

### Data Population
- All `productId` references are populated to full Product objects
- Frontend expects populated data structure
- Backend API endpoints using `populate('productId')`

### Query Invalidation
- Mutations automatically invalidate related queries
- Components refresh data without manual intervention
- Query keys: `['inventory']`, `['products']`, `['sales']`

### TypeScript Strict Mode
- All interfaces match database schemas exactly
- Strict typing prevents runtime errors
- Populated fields reflected in type definitions

### Business Rules
- Negative inventory adjustments create automatic sales
- Sales preserve price at time of transaction
- Product deletion requires confirmation
- Inventory adjustments check available stock

---

## 🔍 Common Patterns

### Identifying Populated Data
```typescript
// After populate('productId'), productId becomes Product object
export const adjustInventory = async (req, res) => {
  const inventory = await Inventory.find().populate('productId'); // ↯ populated
  // inventory[0].productId is now full Product object, not ObjectId
}
```

### Query Key Pattern
```typescript
// Backend route names match React Query keys
app.get('/inventory', getInventory);       // Key: ['inventory']
app.get('/products', getProducts);         // Key: ['products']
app.get('/sales', getSales);               // Key: ['sales']
```

### User Confirmation Pattern
```typescript
const handleDelete = async (productId: string) => {
  if (window.confirm('Delete this product?')) {
    deleteMutation.mutate(productId);
  }
};
```

This reference document provides a complete overview of the inventory management system architecture, components, and workflows for development and maintenance purposes.