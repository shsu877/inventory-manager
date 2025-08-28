import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3000/api/auth'
});

export const AuthService = {
  loginWithGoogle: () => {
    window.location.href = 'http://localhost:3000/api/auth/google';
  },
  
  handleCallback: async (code: string) => {
    const response = await API.get(`/google/callback?code=${code}`);
    return response.data.token;
  },

  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  }
};