import jwt from 'jsonwebtoken';
import { User, IUser } from '../models';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

interface RegisterData {
  email: string;
  password: string;
}

interface LoginResult {
  user: IUser;
  token: string;
}

// Register a new user
export const registerUser = async (userData: RegisterData): Promise<IUser> => {
  try {
    const user = new User(userData);
    const savedUser = await user.save();
    return savedUser;
  } catch (err: any) {
    throw new Error(`Error registering user: ${err.message}`);
  }
};

// Login and generate JWT token
export const loginUser = async (email: string, password: string): Promise<LoginResult> => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    return { user, token };
  } catch (err: any) {
    throw new Error(`Error logging in: ${err.message}`);
  }
};