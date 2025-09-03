import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Autocomplete,
  Chip,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProductService, InventoryService } from '../services/api';

interface ProductFormData {
  name: string;
  tags: string[];
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
    tags: [],
    price: 0,
    startingStock: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  // Query for available tags
  const { data: availableTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: ProductService.getTags,
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // Create the product first
      const productData = {
        name: data.name,
        tags: data.tags,
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
      tags: [],
      price: 0,
      startingStock: 0,
    });
    setErrors({});
    onClose();
  };

  const handleFieldChange = (field: string, value: string | number | string[]) => {
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


          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Autocomplete
              multiple
              freeSolo
              options={availableTags}
              value={formData.tags}
              onChange={(event, newValue) => {
                handleFieldChange('tags', newValue);
              }}
              renderTags={(value: readonly string[], getTagProps) =>
                value.map((option: string, index: number) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags"
                  error={!!errors.tags}
                  helperText={errors.tags}
                  placeholder="Select or add tags"
                />
              )}
              fullWidth
            />

            <TextField
              label="Price"
              type="number"
              value={formData.price || ''}
              onChange={(e) => {
                const value = e.target.value;
                const parsedValue = parseFloat(value);
                handleFieldChange('price', isNaN(parsedValue) || value === '' ? 0 : parsedValue);
              }}
              error={!!errors.price}
              helperText={errors.price}
              required
              fullWidth
            />
          </Box>

          <TextField
            label="Starting Inventory"
            type="number"
            value={formData.startingStock || ''}
            onChange={(e) => {
              const value = e.target.value;
              const parsedValue = parseInt(value);
              handleFieldChange('startingStock', isNaN(parsedValue) || value === '' ? 0 : parsedValue);
            }}
            error={!!errors.startingStock}
            helperText={errors.startingStock}
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