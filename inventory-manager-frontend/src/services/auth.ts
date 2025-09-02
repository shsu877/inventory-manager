import axios from 'axios';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
}

interface User {
  id: string;
  email: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  private baseURL = '/api';

  private isAuthenticated: boolean = false;
  private user: User | null = null;
  private token: string | null = null;

  constructor() {
    // Initialize with stored token if available
    this.checkStoredToken();

    // Set up axios interceptors
    this.setupAxiosInterceptors();
  }

  private checkStoredToken(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Verify token is valid (basic check)
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          this.token = token;
          this.isAuthenticated = true;
          this.user = payload.user;
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          // Token expired, clear it
          this.logout();
        }
      } catch (error) {
        console.error('Invalid token format:', error);
        this.logout();
      }
    }
  }

  private setupAxiosInterceptors(): void {
    // Response interceptor for handling authentication errors
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const { response } = error;

        if (response && response.status === 401) {
          // Token expired or invalid, logout user
          this.logout();
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    );
  }

  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, loginData);

      if (response.data.token) {
        const { token, user } = response.data;

        this.token = token;
        this.user = user;
        this.isAuthenticated = true;

        // Store token
        localStorage.setItem('token', token);

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async register(registerData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/auth/register`, registerData);

      if (response.data.token) {
        const { token, user } = response.data;

        this.token = token;
        this.user = user;
        this.isAuthenticated = true;

        // Store token
        localStorage.setItem('token', token);

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  logout(): void {
    this.token = null;
    this.user = null;
    this.isAuthenticated = false;

    // Clear token from storage
    localStorage.removeItem('token');

    // Remove axios default header
    delete axios.defaults.headers.common['Authorization'];
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  getUserId(): string | null {
    return this.user?.id || null;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated && !!this.token;
  }

  // Token refresh functionality (optional enhancement)
  async refreshToken(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await axios.post(`${this.baseURL}/auth/refresh`, {}, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      if (response.data.token) {
        const { token } = response.data;
        this.token = token;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      return false;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

export default authService;