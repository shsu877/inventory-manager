import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryService, SalesService } from '../services/api';
import { Product, Sale } from '../types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert
} from '@mui/material';

interface InventoryAdjustmentDialogProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  currentStock: number;
  sales: Sale[];
  products: Product[];
}

export default function InventoryAdjustmentDialog({
  open,
  onClose,
  productId,
  productName,
  currentStock,
  sales,
  products
}: InventoryAdjustmentDialogProps) {
  const [adjustment, setAdjustment] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const queryClient = useQueryClient();

  // Calculate current items sold
  const itemsSold = sales
    .filter(sale => sale.productId === productId)
    .reduce((total, sale) => total + sale.quantity, 0);

  const mutation = useMutation({
    mutationFn: (data: { productId: string; adjustment: number }) =>
      InventoryService.adjustInventory(data),
    onSuccess: async () => {
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      await queryClient.invalidateQueries({ queryKey: ['sales'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });

      setAdjustment(0);
      setReason('');
      setError('');
      onClose();
    },
    onError: (err: Error) => {
      setError(`Adjustment failed: ${err.message}`);
    }
  });

  const handleSubmit = async () => {
    if (adjustment === 0) {
      setError('Please enter an adjustment amount');
      return;
    }

    setError('');

    // If the adjustment is negative (items were sold), create a sale record first
    if (adjustment < 0) {
      const product = products.find(p => p._id === productId);
      if (product) {
        const quantitySold = Math.abs(adjustment);
        const saleData = {
          productId,
          quantity: quantitySold,
          totalAmount: quantitySold * product.price,
          channel: 'manual', // Default channel for manual adjustments
        };

        try {
          await SalesService.createSale(saleData);
        } catch (error) {
          console.error('Failed to create sale record:', error);
          setError('Failed to create sale record, but inventory will be adjusted');
          // Continue with inventory adjustment even if sale creation fails
        }
      }
    }

    // Adjust inventory
    mutation.mutate({
      productId,
      adjustment
    });
  };

  const handleClose = () => {
    setAdjustment(0);
    setReason('');
    setError('');
    onClose();
  };

  // Calculate projected new stock
  const projectedStock = currentStock + adjustment;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Adjust Inventory: {productName}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 1, mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current Stock: {currentStock}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Items Sold: {itemsSold}
          </Typography>
          {adjustment !== 0 && (
            <Typography variant="body2" color="primary" gutterBottom sx={{ mt: 1 }}>
              Projected Stock: {projectedStock} ({adjustment > 0 ? '+' : ''}{adjustment})
            </Typography>
          )}
        </Box>

        <TextField
          fullWidth
          type="number"
          label="Adjustment Amount"
          value={adjustment}
          onChange={(e) => {
            const value = Number(e.target.value);
            setAdjustment(value);
          }}
          sx={{ mb: 2 }}
          helperText="Use positive numbers to add inventory, negative to reduce"
          inputProps={{ step: 1 }}
        />

        <TextField
          fullWidth
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          rows={2}
          sx={{ mb: 2 }}
          helperText="Why are you adjusting the inventory?"
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {adjustment < 0 && Math.abs(adjustment) > currentStock && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Warning: This adjustment would result in negative inventory ({projectedStock})
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Adjusting...' : 'Adjust Inventory'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
