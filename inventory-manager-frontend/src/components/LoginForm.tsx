import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  LinearProgress
} from '@mui/material';
import authService from '../services/auth';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

const LoginForm = ({ onLoginSuccess }: LoginFormProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await authService.login(formData);
      } else {
        // await authService.register(formData);
      }
      onLoginSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ email: '', password: '' });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          textAlign: 'center'
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          {isLogin ? 'Login' : 'Register'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            required
            margin="normal"
            autoComplete="email"
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleInputChange('password')}
            required
            margin="normal"
            autoComplete={isLogin ? "current-password" : "new-password"}
            helperText={!isLogin ? "Minimum 6 characters" : ""}
          />

          {loading && (
            <Box sx={{ mt: 2, mb: 1 }}>
              <LinearProgress />
            </Box>
          )}

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {isLogin ? 'Login' : 'Register'}
          </Button>
        </Box>

        {/* <Typography variant="body2" color="text.secondary">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <Button
            onClick={toggleMode}
            variant="text"
            size="small"
            disabled={loading}
          >
            {isLogin ? 'Register' : 'Login'}
          </Button>
        </Typography> */}
      </Paper>
    </Box>
  );
};

export default LoginForm;