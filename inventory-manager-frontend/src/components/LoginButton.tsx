import Button from '@mui/material/Button';
import GoogleIcon from '@mui/icons-material/Google';
import { AuthService } from '../services/auth';

const LoginButton = () => {
  return (
    <Button
      variant="contained"
      startIcon={<GoogleIcon />}
      onClick={AuthService.loginWithGoogle}
      sx={{ textTransform: 'none' }}
    >
      Continue with Google
    </Button>
  );
};

export default LoginButton;