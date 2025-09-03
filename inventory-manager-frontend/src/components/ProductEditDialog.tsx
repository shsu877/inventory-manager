import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { ProductService } from "../services/api";
import { Product } from "../types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Autocomplete,
  Chip,
  Alert,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

interface ProductEditDialogProps {
  open: boolean;
  onClose: () => void;
  product: Product;
}

export default function ProductEditDialog({
  open,
  onClose,
  product,
}: ProductEditDialogProps) {
  const [name, setName] = useState<string>(product.name);
  const [tags, setTags] = useState<string[]>(product.tags || []);
  const [price, setPrice] = useState<number>(product.price);
  const [isDeprecated, setIsDeprecated] = useState<boolean>(
    product.isDeprecated
  );
  const [error, setError] = useState<string>("");
  const queryClient = useQueryClient();

  // Query for available tags
  const { data: availableTags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: ProductService.getTags,
  });

  const mutation = useMutation({
    mutationFn: (updateData: Partial<Product>) =>
      ProductService.updateProduct(product._id, updateData),
    onSuccess: async () => {
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
      await queryClient.invalidateQueries({ queryKey: ["inventory"] });

      setError("");
      onClose();
    },
    onError: (err: Error) => {
      setError(`Update failed: ${err.message}`);
    },
  });

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Product name is required");
      return;
    }

    if (price < 0) {
      setError("Price cannot be negative");
      return;
    }

    setError("");

    const updateData: Partial<Product> = { name, tags, price, isDeprecated };
    mutation.mutate(updateData);
  };

  const handleClose = () => {
    setName(product.name);
    setTags(product.tags || []);
    setPrice(product.price);
    setIsDeprecated(product.isDeprecated);
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          Edit Product: {product.name}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
            required
          />

          <Autocomplete
            multiple
            freeSolo
            options={availableTags}
            value={tags}
            onChange={(event, newValue) => {
              setTags(newValue);
            }}
            renderTags={(value: readonly string[], getTagProps) =>
              value.map((option: string, index: number) => (
                <Chip
                  variant="outlined"
                  label={option}
                  {...getTagProps({ index })}
                  key={option}
                  size="small"
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder="Select or add tags"
                size="small"
              />
            )}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="number"
            label="Price"
            value={price}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
                setPrice(value === "" ? 0 : Number(value));
              }
            }}
            onFocus={(e) => e.target.select()}
            sx={{ mb: 2 }}
            inputProps={{
              step: "0.01",
              inputMode: "numeric",
              pattern: "^-?[0-9]*(.[0-9]*)?$",
              style: { textAlign: "right" },
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={isDeprecated}
                onChange={(e) => setIsDeprecated(e.target.checked)}
              />
            }
            label="Mark as Deprecated"
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
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
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
