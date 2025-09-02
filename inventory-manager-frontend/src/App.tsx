import { useState } from 'react';
import { useInventory, useProducts, useSales } from './hooks';
import CombinedInventoryTable from './components/CombinedInventoryTable';
import SalesReport from './components/SalesReport';
import { CircularProgress, Alert, Box, Tabs, Tab, Paper, Typography } from '@mui/material';
import LoginButton from './components/LoginButton';

function App() {
  const [isAuthenticated] = useState(true); // temp
  const [authError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const { data: inventory, isLoading: inventoryLoading, error: inventoryError } = useInventory();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: sales, isLoading: salesLoading } = useSales();

  // useEffect(() => {
  //   const urlParams = new URLSearchParams(window.location.search);
  //   const code = urlParams.get('code');
    
  //   const checkAuth = () => {
  //     const token = localStorage.getItem('token');
  //     setIsAuthenticated(!!token);
  //   };

  //   if (code) {
  //     AuthService.handleCallback(code)
  //       .then(token => {
  //         localStorage.setItem('token', token);
  //         window.history.replaceState({}, document.title, window.location.pathname);
  //         checkAuth();
  //       })
  //       .catch(err => {
  //         setAuthError('Authentication failed. Please try again.');
  //         AuthService.logout();
  //       });
  //   } else {
  //     checkAuth();
  //   }
  // }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (authError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{authError}</Alert>
        <LoginButton />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <LoginButton />
      </Box>
    );
  }

  return (
    <Box sx={{
      padding: { xs: '10px', sm: '20px' },
      maxWidth: '100vw',
      overflowX: 'auto'
    }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Inventory Manager!
      </Typography>
      
      <Paper sx={{ mb: 2 }}>
        <Tabs className='inventory-tabs' value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Inventory" />
          <Tab label="Sales Report" />
        </Tabs>
      </Paper>
      
      {activeTab === 0 && (
        inventoryLoading || productsLoading || salesLoading ? <CircularProgress /> :
        inventoryError ? <Alert severity="error">Error loading inventory: {(inventoryError as Error).message}</Alert> :
        <CombinedInventoryTable
          inventory={inventory || []}
          products={products || []}
          sales={sales || []}
        />
      )}

      {activeTab === 1 && (
        salesLoading ? <CircularProgress /> :
        <SalesReport />
      )}

    </Box>
  );
}

export default App;
