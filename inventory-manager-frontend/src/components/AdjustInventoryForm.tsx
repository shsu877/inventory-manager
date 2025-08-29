import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryService } from '../services/api';
import { Product } from '../types';
import { Button, TextField, Box, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';

interface AdjustmentData {
  productId: string;
  adjustment: number;
}

export default function AdjustInventoryForm({ products }: { products: Product[] }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustment, setAdjustment] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: AdjustmentData) => 
      InventoryService.adjustInventory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setSelectedProduct(null);
      setAdjustment(0);
    },
    onError: (err: Error) => {
      setError(`Adjustment failed: ${err.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError('Please select a product and variant');
      return;
    }
    
    mutation.mutate({
      productId: selectedProduct._id,
      adjustment
    });
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1, maxWidth: 400 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Manual Inventory Adjustment</Typography>
      
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Product</InputLabel>
          <Select
            value={selectedProduct?._id || ''}
            onChange={(e) => {
              const product = products.find(p => p._id === e.target.value);
              setSelectedProduct(product || null);
            }}
            required
          >
            {products.map(product => (
              <MenuItem key={product._id} value={product._id}>
                {product.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          fullWidth
          type="number"
          label="Adjustment Amount"
          value={adjustment}
          onChange={(e) => setAdjustment(Number(e.target.value))}
          sx={{ mb: 2 }}
          required
          inputProps={{ min: -1000, max: 1000 }}
        />
        
        <Button 
          type="submit" 
          variant="contained" 
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Adjusting...' : 'Adjust Inventory'}
        </Button>
      </form>
    </Box>
  );
}