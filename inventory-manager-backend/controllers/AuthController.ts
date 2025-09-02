import { Request, Response } from 'express';
const AuthService = require('../services/AuthService');

interface RegisterBody {
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface LoginResponse {
  user: any; // or proper type
  token: string;
}

// Input validation helpers
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

// Register a new user
// export const register = async (req: Request<{}, {}, RegisterBody>, res: Response) => {
//   try {
//     const { email, password } = req.body;

//     // Input validation
//     if (!email || !password) {
//       return res.status(400).json({ message: 'Email and password are required' });
//     }

//     if (!validateEmail(email)) {
//       return res.status(400).json({ message: 'Please enter a valid email address' });
//     }

//     if (!validatePassword(password)) {
//       return res.status(400).json({ message: 'Password must be at least 6 characters long' });
//     }

//     const user = await AuthService.registerUser(req.body);
//     res.status(201).json({
//       message: 'User registered successfully. Please login with your credentials.',
//       user: { id: user.id, email: user.email }
//     });
//   } catch (err: any) {
//     // Handle duplicate email error
//     if (err.message.includes('duplicate') || err.message.includes('unique')) {
//       return res.status(409).json({ message: 'An account with this email already exists' });
//     }

//     console.error('Registration error:', err);
//     res.status(500).json({ message: 'Registration failed. Please try again.' });
//   }
// };

// Login user
export const login = async (req: Request<{}, {}, LoginBody>, res: Response) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    const { user, token }: LoginResponse = await AuthService.loginUser(email, password);

    // Exclude sensitive information from response
    const safeUser = { id: user.id, email: user.email, createdAt: user.createdAt };

    res.json({
      message: 'Login successful',
      user: safeUser,
      token
    });
  } catch (err: any) {
    // Generic error message to prevent credential enumeration
    if (err.message.includes('Invalid credentials')) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};