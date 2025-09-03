import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductService } from '../services/api';
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
} from '@mui/material';

interface BulkPriceDialogProps {
  open: boolean;
  onClose: () => void;
  selectedProducts: Product[];
}

export default function BulkPriceDialog({
  open,
  onClose,
  selectedProducts
}: BulkPriceDialogProps) {
  const [newPrice, setNewPrice] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const queryClient = useQueryClient();

  // Reset dialog state
  const resetDialog = () => {
    setNewPrice('');
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  // Bulk price update mutation
  const bulkPriceMutation = useMutation({
    mutationFn: async (priceData: { price: number }) => {
      const productIds = selectedProducts.map(product => product._id);
      return ProductService.bulkUpdatePrices(productIds, priceData.price);
    },
    onSuccess: (results) => {
      setSuccess(`Successfully updated price for ${results.length} products!`);
      setError('');

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });

      // Close dialog after a short delay
      setTimeout(() => {
        handleClose();
      }, 2000);
    },
    onError: (err: any) => {
      setError(`Failed to update prices: ${err.message}`);
      setSuccess('');
    }
  });

  const handleSubmit = () => {
    const price = parseFloat(newPrice);

    if (isNaN(price) || price < 0) {
      setError('Please enter a valid price (must be a positive number)');
      return;
    }

    if (selectedProducts.length === 0) {
      setError('No products selected');
      return;
    }

    bulkPriceMutation.mutate({ price });
  };

  const hasValidPrice = newPrice && parseFloat(newPrice) >= 0 && !isNaN(parseFloat(newPrice));

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Typography>
          Bulk Price Update
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Set the same price for all selected products
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Selected Products ({selectedProducts.length})
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
            {selectedProducts.map((product) => (
              <Box
                key={product._id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1
                }}
              >
                <Box>
                  <Typography variant="body1">
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current Price: ${product.price}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              label="New Price"
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              sx={{ width: 200 }}
              inputProps={{
                min: 0,
                step: 0.01
              }}
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              This price will be applied to all {selectedProducts.length} selected products
            </Typography>
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
        <Button onClick={handleClose} disabled={bulkPriceMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={bulkPriceMutation.isPending || !hasValidPrice}
        >
          {bulkPriceMutation.isPending ? 'Updating...' : `Update ${selectedProducts.length} Products`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}