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

// Register a new user
export const register = async (req: Request<{}, {}, RegisterBody>, res: Response) => {
  try {
    const user = await AuthService.registerUser(req.body);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// Login user
export const login = async (req: Request<{}, {}, LoginBody>, res: Response) => {
  try {
    const { email, password } = req.body;
    const { user, token }: LoginResponse = await AuthService.loginUser(email, password);
    res.json({ message: 'Login successful', user, token });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
};