import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryService, SalesService } from '../services/api';
import { Product } from '../types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  MenuItem
} from '@mui/material';

interface SaleQuantity {
  productId: string;
  quantity: number;
}

interface BulkSalesDialogProps {
  open: boolean;
  onClose: () => void;
  selectedProducts: Product[];
}

export default function BulkSalesDialog({
  open,
  onClose,
  selectedProducts
}: BulkSalesDialogProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [channel, setChannel] = useState<string>('retail');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const queryClient = useQueryClient();

  // Initialize quantities for selected products
  const initializeQuantities = () => {
    const initial: Record<string, number> = {};
    selectedProducts.forEach(product => {
      initial[product._id] = quantities[product._id] || 0;
    });
    setQuantities(initial);
  };

  // Reset dialog state
  const resetDialog = () => {
    setQuantities({});
    setChannel('retail');
    setError('');
    setSuccess('');
  };

  // Handle opening dialog
  const handleOpen = () => {
    initializeQuantities();
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  // Update quantity for a specific product
  const updateQuantity = (productId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: quantity
    }));
  };

  // Bulk sales mutation
  const bulkMutation = useMutation({
    mutationFn: async (saleItems: SaleQuantity[]) => {
      const results = [];

      // Process each sale item
      for (const item of saleItems) {
        if (item.quantity > 0) {
          const product = selectedProducts.find(p => p._id === item.productId);
          if (product) {
            // Create sale record
            const saleData = {
              productId: item.productId,
              quantity: item.quantity,
              salePrice: product.price,
              totalAmount: item.quantity * product.price,
              channel: channel
            };

            const saleResult = await SalesService.createSale(saleData);
            results.push({ product: product.name, sale: saleResult, type: 'sale' });

            // Adjust inventory (reduce by sold quantity)
            const inventoryResult = await InventoryService.adjustInventory({
              productId: item.productId,
              adjustment: -item.quantity
            });
            results.push({ product: product.name, inventory: inventoryResult, type: 'inventory' });
          }
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const productCount = selectedProducts.length;
      const totalQuantity = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

      setSuccess(`Successfully sold ${totalQuantity} items across ${productCount} products!`);
      setError('');

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      // Close dialog after a short delay
      setTimeout(() => {
        handleClose();
      }, 2000);
    },
    onError: (err: any) => {
      setError(`Failed to complete bulk sales: ${err.message}`);
      setSuccess('');
    }
  });

  const handleSubmit = () => {
    const saleItems = Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (saleItems.length === 0) {
      setError('Please enter at least one quantity greater than 0');
      return;
    }

    // Check stock availability
    const insufficientStock = saleItems.filter(item => {
      const product = selectedProducts.find(p => p._id === item.productId);
      return product && item.quantity > (product as any).stock; // This would need proper stock checking
    });

    if (insufficientStock.length > 0) {
      setError('Some products have insufficient stock for the requested quantities');
      return;
    }

    bulkMutation.mutate(saleItems);
  };

  const totalQuantity = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  const totalValue = Object.entries(quantities).reduce((sum, [productId, qty]) => {
    const product = selectedProducts.find(p => p._id === productId);
    return sum + (product ? product.price * qty : 0);
  }, 0);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Typography>
          Bulk Sales Entry
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Select quantities for products to record sales and automatically reduce inventory
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Selected Products ({selectedProducts.length})
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {selectedProducts.map((product) => (
              <Box
                key={product._id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Price: ${product.price}
                  </Typography>
                </Box>
                <TextField
                  type="number"
                  label="Quantity Sold"
                  value={quantities[product._id] || ''}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    updateQuantity(product._id, isNaN(value) ? 0 : value);
                  }}
                  sx={{ width: 120 }}
                  inputProps={{
                    min: 0,
                    step: 1
                  }}
                  size="small"
                />
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2">
                Total Items: <strong>{totalQuantity}</strong>
              </Typography>
              <Typography variant="body2">
                Total Value: <strong>${totalValue.toFixed(2)}</strong>
              </Typography>
            </Box>

            <TextField
              select
              label="Sales Channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              sx={{ width: 150 }}
              size="small"
            >
              <MenuItem value="tabling">Tabling</MenuItem>
              <MenuItem value="online">Online</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={bulkMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={bulkMutation.isPending || totalQuantity === 0}
        >
          {bulkMutation.isPending ? 'Processing...' : `Record ${totalQuantity} Sales`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}