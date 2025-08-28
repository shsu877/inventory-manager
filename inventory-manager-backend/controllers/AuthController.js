const AuthService = require('../services/AuthService');

// Register a new user
exports.register = async (req, res) => {
  try {
    const user = await AuthService.registerUser(req.body);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await AuthService.loginUser(email, password);
    res.json({ message: 'Login successful', user, token });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};