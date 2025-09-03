import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

// Product interface
export interface IProduct {
  name: string;
  tags?: string[];
  price: number;
  isDeprecated: boolean;
}

// Inventory interface
export interface IInventory {
  productId: mongoose.Types.ObjectId;
  quantityOnHand: number;
}

// Sale interface
export interface ISale {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  salePrice: number;
  totalAmount: number;
  channel: string;
  channelOrderId?: string;
  dateTime: Date;
}

// User interface
export interface IUser extends Document {
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  validatePassword(password: string): Promise<boolean>;
}

// Product Schema
const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  tags: [String],
  price: { type: Number, required: true },
  isDeprecated: { type: Boolean, default: false }
});

// Inventory Schema
const inventorySchema = new Schema<IInventory>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantityOnHand: { type: Number, required: true, default: 0 }
});

// Sales Schema
const salesSchema = new Schema<ISale>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  salePrice: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  channel: { type: String, required: true },
  channelOrderId: String,
  dateTime: { type: Date, required: true, default: Date.now }
});

// User Schema
const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Validate password
userSchema.methods.validatePassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

// Models
const Product = mongoose.model<IProduct>('Product', productSchema);
const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema);
const Sale = mongoose.model<ISale>('Sale', salesSchema);
const User = mongoose.model<IUser>('User', userSchema);

export { Product, Inventory, Sale, User };