import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductService, InventoryService } from '../services/api';

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  startingStock: number;
}

interface ProductCreationDialogProps {
  open: boolean;
  onClose: () => void;
}

const ProductCreationDialog: React.FC<ProductCreationDialogProps> = ({
  open,
  onClose,
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: '',
    price: 0,
    startingStock: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // Create the product first
      const productData = {
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
      };

      const newProduct = await ProductService.createProduct(productData);

      // Create inventory record if starting stock is specified
      if (data.startingStock > 0) {
        await InventoryService.upsertInventory({
          productId: newProduct._id,
          quantityOnHand: data.startingStock,
        });
      }

      return newProduct;
    },
    onSuccess: () => {
      // Refresh the queries to show the new product
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Failed to create product:', error);
      setErrors({ submit: error?.message || 'Failed to create product' });
    },
  });

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: 0,
      startingStock: 0,
    });
    setErrors({});
    onClose();
  };

  const handleFieldChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    if (formData.startingStock < 0) {
      newErrors.startingStock = 'Starting stock cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createProductMutation.mutate(formData);
    }
  };

  const isLoading = createProductMutation.isPending;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
      }}
    >
      <DialogTitle>Add New Product</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {errors.submit && (
            <Typography color="error" variant="body2">
              {errors.submit}
            </Typography>
          )}

          <TextField
            label="Product Name"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            required
            fullWidth
          />

          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            error={!!errors.description}
            helperText={errors.description}
            required
            multiline
            rows={3}
            fullWidth
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="Category"
              value={formData.category}
              onChange={(e) => handleFieldChange('category', e.target.value)}
              error={!!errors.category}
              helperText={errors.category}
              required
              fullWidth
            />

            <TextField
              label="Price"
              type="number"
              value={formData.price}
              onChange={(e) => handleFieldChange('price', parseFloat(e.target.value) || 0)}
              error={!!errors.price}
              helperText={errors.price}
              required
              inputProps={{ min: 0, step: 0.01 }}
              fullWidth
            />
          </Box>

          <TextField
            label="Starting Inventory"
            type="number"
            value={formData.startingStock}
            onChange={(e) => handleFieldChange('startingStock', parseInt(e.target.value) || 0)}
            error={!!errors.startingStock}
            helperText={errors.startingStock}
            inputProps={{ min: 0 }}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Product'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductCreationDialog;