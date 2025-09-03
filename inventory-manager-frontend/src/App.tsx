import { useState, useEffect } from "react";
import { useInventory, useProducts, useSales } from "./hooks";
import CombinedInventoryTable from "./components/CombinedInventoryTable";
import SalesReport from "./components/SalesReport";
import LoginForm from "./components/LoginForm";
import authService from "./services/auth";
import {
  CircularProgress,
  Alert,
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  Button,
} from "@mui/material";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);

  const {
    data: inventory,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useInventory({ enabled: isAuthenticated });
  const { data: products, isLoading: productsLoading } = useProducts({
    enabled: isAuthenticated,
  });
  const { data: sales, isLoading: salesLoading } = useSales({
    enabled: isAuthenticated,
  });

  useEffect(() => {
    // Check if user is already logged in
    if (authService.isLoggedIn()) {
      setIsAuthenticated(true);
      setUser(authService.getUser());
    }
  }, []);

  const handleLoginSuccess = () => {
    setUser(authService.getUser());
    setIsAuthenticated(true);
    window.location.reload();
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Box
      sx={{
        padding: { xs: "10px", sm: "20px" },
        maxWidth: "100vw",
        overflowX: "auto",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          Inventory Manager!
        </Typography>
        <Box>
          {user && (
            <Typography variant="body1" sx={{ mr: 2, display: "inline" }}>
              Welcome, {user.email}
            </Typography>
          )}
          <Button variant="outlined" color="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Box>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          className="inventory-tabs"
          value={activeTab}
          onChange={handleTabChange}
          centered
        >
          <Tab label="Inventory" />
          <Tab label="Sales Report" />
        </Tabs>
      </Paper>

      {/* Content */}
      {activeTab === 0 &&
        (inventoryLoading || productsLoading || salesLoading ? (
          <CircularProgress />
        ) : inventoryError ? (
          <Alert severity="error">
            Error loading inventory: {(inventoryError as Error).message}
          </Alert>
        ) : (
          <CombinedInventoryTable
            inventory={inventory ?? []}
            products={products ?? []}
            sales={sales ?? []}
          />
        ))}

      {activeTab === 1 &&
        (salesLoading ? <CircularProgress /> : <SalesReport />)}
    </Box>
  );
}

export default App;
