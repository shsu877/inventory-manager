import React, { useState, useRef } from "react";
import { DataGrid, GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  InventoryService,
  SalesService,
  ProductService,
} from "../services/api";
import { InventoryItem, Product, Sale } from "../types";
import {
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Checkbox,
  Chip,
  Autocomplete,
  TextField,
  Popover,
  Card,
  CardContent,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  ShoppingCart as ShoppingCartIcon,
  CloudDownload as CloudDownloadIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import InventoryAdjustmentDialog from "./InventoryAdjustmentDialog";
import ProductCreationDialog from "./ProductCreationDialog";
import BulkSalesDialog from "./BulkSalesDialog";
import EtsyImportDialog from "./EtsyImportDialog";

interface RowData {
  id: string;
  productName: string;
  tags: string;
  tagsArray: string[];
  stock: number;
  itemsSold: number;
  price: number;
  productId: string;
  isDeprecated: boolean;
  handleAdjust: (rowId: string) => void;
  handleDelete: (productId: string) => void;
}

// Define processRowUpdate first
let processRowUpdateFunction: any;

// Custom Tags Cell Component
const TagsCell: React.FC<{
  value: string[];
  onSave: (tags: string[]) => void;
  availableTags: string[];
}> = ({ value, onSave, availableTags }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string[]>(value || []);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setEditValue(value || []);
    setAnchorEl(event.currentTarget);
    setIsEditing(true);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setIsEditing(false);
  };

  const handleSave = () => {
    onSave(editValue);
    handleClose();
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.5,
          cursor: "pointer",
          minHeight: 24,
        }}
        onClick={handleClick}
      >
        {value && value.length > 0 ? (
          value.map((tag: string) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: "italic" }}
          >
            No tags (click to edit)
          </Typography>
        )}
      </Box>

      <Popover
        open={isEditing}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Edit Tags
          </Typography>
          <Autocomplete
            multiple
            freeSolo
            options={availableTags}
            value={editValue}
            onChange={(event, newValue) => {
              setEditValue(newValue);
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
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button size="small" onClick={handleClose}>
              Cancel
            </Button>
            <Button size="small" variant="contained" onClick={handleSave}>
              Save
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

interface CombinedInventoryTableProps {
  inventory: InventoryItem[];
  products: Product[];
  sales: Sale[];
}

const CombinedInventoryTable = ({
  inventory,
  products,
  sales,
}: CombinedInventoryTableProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<RowData | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [bulkSalesOpen, setBulkSalesOpen] = useState(false);
  const [etsyImportOpen, setEtsyImportOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
    type: "include",
    ids: new Set(),
  });
  const queryClient = useQueryClient();

  // Theme and responsive breakpoint
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Query for available tags
  const { data: availableTags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: ProductService.getTags,
  });

  // Calculate items sold for each product by aggregating sales data
  const salesByProduct = sales.reduce((acc, sale) => {
    acc[sale.productId.toString()] =
      (acc[sale.productId.toString()] || 0) + sale.quantity;
    return acc;
  }, {} as Record<string, number>);

  // Filter products based on selected tag and search query
  const filteredProducts = products.filter((product) => {
    // Check tag filter
    const tagMatch = !selectedTag || product.tags?.includes(selectedTag);

    // Check search query (case-insensitive)
    const searchMatch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase());

    return tagMatch && searchMatch;
  });

  // Handle button click for adjustments
  const handleAdjustClick = (rowId: string) => {
    const row = rowsRef.current.find((r) => r.id === rowId);
    if (row) {
      setSelectedRow(row);
      setDialogOpen(true);
    }
  };

  // Handle button click for deletion
  const handleDeleteClick = (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(productId);
    }
  };

  // Handle bulk sales
  const handleBulkSalesClick = () => {
    setBulkSalesOpen(true);
  };

  // Handle Etsy import
  const handleEtsyImportClick = () => {
    setEtsyImportOpen(true);
  };

  // Get selected products
  const selectedProducts = filteredProducts.filter((product) =>
    selectionModel.ids.has(product._id)
  );

  const handleBulkSalesClose = () => {
    setBulkSalesOpen(false);
  };

  // Store the original rows data for retrieving current stock values
  const rowDataRef = useRef<RowData[]>([]);
  const rowsRef = useRef<RowData[]>([]);

  // Create rows from filtered products (one row per product)
  const rows: RowData[] = filteredProducts.map((product) => {
    const inventoryItem = inventory.find(
      (item) => item.productId.toString() === product._id.toString()
    );
    const itemsSold = salesByProduct[product._id.toString()] || 0;

    const rowData: RowData = {
      id: product._id,
      productId: product._id,
      productName: product.name,
      tags: product.tags?.join(", ") || "",
      tagsArray: product.tags || [],
      price: product.price,
      stock: inventoryItem?.quantityOnHand || 0,
      itemsSold: itemsSold,
      isDeprecated: product.isDeprecated,
      handleAdjust: handleAdjustClick,
      handleDelete: handleDeleteClick,
    };

    return rowData;
  });

  // Store the rows for cell editing
  rowDataRef.current = rows;
  rowsRef.current = rows;

  // Handler for tag updates
  const handleTagUpdate = async (productId: string, newTags: string[]) => {
    try {
      await ProductService.updateProduct(productId, { tags: newTags });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    } catch (error) {
      console.error("Failed to update tags:", error);
    }
  };

  // Columns definition with available tags from query
  const columns: GridColDef[] = [
    {
      field: "productName",
      headerName: "Product Name",
      flex: 2,
      editable: true,
    },
    {
      field: "tagsArray",
      headerName: "Tags",
      width: 250,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", width: "100%", height: "100%" }}>
          <TagsCell
            value={params.value}
            onSave={(tags: string[]) =>
              handleTagUpdate(String(params.id), tags)
            }
            availableTags={availableTags}
          />
        </Box>
      ),
      headerClassName: "tags-header",
    },
    {
      field: "price",
      headerName: "Price",
      type: "number",
      width: 100,
      valueFormatter: (value) => `$${value}`,
    },
    {
      field: "stock",
      headerName: "Stock",
      type: "number",
      width: 150,
      editable: true,
      headerClassName: "stock-header",
    },
    {
      field: "itemsSold",
      headerName: "Items Sold",
      type: "number",
      width: 120,
    },
    {
      field: "isDeprecated",
      headerName: "Deprecated",
      type: "boolean",
      width: 120,
      editable: true,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 250,
      renderCell: ({ row }) => (
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1,
            alignItems: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => handleDeleteClick(row.productId)}
            fullWidth
          >
            Delete
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleAdjustClick(row.id)}
            fullWidth
          >
            Adjust
          </Button>
        </Box>
      ),
    },
  ];

  // Mutation for adjusting inventory
  const adjustMutation = useMutation({
    mutationFn: ({
      productId,
      adjustment,
    }: {
      productId: string;
      adjustment: number;
    }) => InventoryService.adjustInventory({ productId, adjustment }),
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("Failed to adjust inventory:", error);
    },
  });

  // Mutation for deleting a product
  const deleteMutation = useMutation({
    mutationFn: (productId: string) => ProductService.deleteProduct(productId),
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.error("Failed to delete product:", error);
    },
  });

  // Handle inline cell editing
  const processRowUpdate = async (newRow: any, oldRow: any) => {
    if (newRow.productName !== oldRow.productName) {
      ProductService.updateProduct(newRow.productId, {
        name: newRow.productName,
      });
    }

    if (newRow.variant !== oldRow.variant) {
      ProductService.updateVariant(newRow.productId, {
        name: newRow.variant,
      });
    }

    if (newRow.tags !== oldRow.tags) {
      // Parse tags from comma-separated string to array
      const tagsArray = newRow.tags
        ? newRow.tags
            .split(",")
            .map((tag: string) => tag.trim())
            .filter((tag: string) => tag.length > 0)
        : [];

      ProductService.updateProduct(newRow.productId, {
        tags: tagsArray,
      });

      // Update the row data with the new tags format
      newRow.tagsArray = tagsArray;

      // Refresh tags query to update filter dropdown
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    }

    if (newRow.isDeprecated !== oldRow.isDeprecated) {
      ProductService.updateProduct(newRow.productId, {
        isDeprecated: newRow.isDeprecated,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }

    if (newRow.stock !== oldRow.stock) {
      // Calculate adjustment: new value - old value
      const adjustment = newRow.stock - oldRow.stock;

      // If adjustment is negative (items were sold), create a sale record
      if (adjustment < 0) {
        const product = products.find((p) => p._id === newRow.productId._id);
        if (product) {
          const quantitySold = Math.abs(adjustment);
          const saleData = {
            productId: newRow.productId._id.toString(),
            quantity: quantitySold,
            salePrice: product.price,
            totalAmount: quantitySold * product.price,
            channel: "manual", // Default channel for manual adjustments
          };

          try {
            await SalesService.createSale(saleData);
          } catch (error) {
            console.error("Failed to create sale record:", error);
            // Continue with inventory adjustment even if sale creation fails
          }
        }
      }

      // Adjust inventory
      adjustMutation.mutate({
        productId: newRow.productId,
        adjustment,
      });
    }
    return newRow;
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedRow(null);
  };

  const handleProductDialogClose = () => {
    setProductDialogOpen(false);
  };

  const handleEtsyImportDialogClose = () => {
    setEtsyImportOpen(false);
  };

  // Mobile Product Card Component
  const MobileProductCard = ({ row }: { row: RowData }) => (
    <Card sx={{ mb: 2, mx: 1 }}>
      <CardContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
              {row.productName}
            </Typography>
            <Chip
              label={row.isDeprecated ? "Deprecated" : "Active"}
              color={row.isDeprecated ? "error" : "success"}
              size="small"
            />
          </Box>

          {row.tagsArray.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
              {row.tagsArray.map((tag: string) => (
                <Chip key={tag} label={tag} variant="outlined" size="small" />
              ))}
            </Box>
          )}

          <Divider />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                Stock:{" "}
                <Typography component="span" variant="body1" color="primary">
                  {row.stock}
                </Typography>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sold:{" "}
                <Typography component="span" variant="body1">
                  {row.itemsSold}
                </Typography>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Price:{" "}
                <Typography component="span" variant="body1">
                  ${row.price}
                </Typography>
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => handleDeleteClick(row.productId)}
              >
                Delete
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleAdjustClick(row.id)}
              >
                Adjust
              </Button>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Conditional rendering based on screen size
  const renderProductView = () => {
    if (isMobile) {
      return (
        <Box sx={{ mt: 2 }}>
          {rows.map((row, index) => (
            <MobileProductCard key={row.id} row={row} />
          ))}
        </Box>
      );
    }

    // Desktop DataGrid view
    return (
      <Box
        sx={{
          height: { xs: "500px", sm: "600px", md: "700px" },
          width: "100%",
          overflow: "auto",
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          checkboxSelection
          rowSelectionModel={selectionModel}
          onRowSelectionModelChange={(newSelectionModel) => {
            setSelectionModel(newSelectionModel);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          processRowUpdate={processRowUpdate}
        />
      </Box>
    );
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          💡 <strong>Inventory Adjustment:</strong>{" "}
          {isMobile
            ? "Edit stock directly from product cards below"
            : "Double-click any stock number to edit directly. Enter the new total stock level (not the adjustment amount)."}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          💡 <strong>Tags:</strong>{" "}
          {isMobile
            ? "Tags are displayed as chips on cards"
            : "Click the tags display to edit with autocomplete. Choose from existing tags or create new ones."}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 2,
          alignItems: "stretch",
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "flex-start" },
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <FormControl
            sx={{
              minWidth: { xs: "100%", sm: 200 },
              flex: { xs: 1, sm: 1 },
            }}
          >
            <InputLabel>Filter by Tag</InputLabel>
            <Select
              value={selectedTag}
              label="Filter by Tag"
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              <MenuItem value="">
                <em>All Products</em>
              </MenuItem>
              {availableTags.map((tag) => (
                <MenuItem key={tag} value={tag}>
                  {tag}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              minWidth: { xs: "100%", sm: 250 },
              flex: { xs: 1, sm: 1 },
            }}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: "action.active", mr: 1, my: 0.5 }} />
              ),
            }}
            variant="outlined"
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "stretch",
          }}
        >
          <Button
            variant="contained"
            color="success"
            startIcon={<ShoppingCartIcon />}
            onClick={handleBulkSalesClick}
            disabled={selectionModel.ids.size === 0}
            fullWidth
          >
            Add Sales ({selectionModel.ids.size})
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setProductDialogOpen(true)}
            fullWidth
          >
            Add Product
          </Button>

          <Button
            variant="outlined"
            startIcon={<CloudDownloadIcon />}
            onClick={handleEtsyImportClick}
            fullWidth
          >
            Import Etsy Sales
          </Button>
        </Box>
      </Box>

      {renderProductView()}

      {selectedRow && (
        <InventoryAdjustmentDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          productId={selectedRow!.productId}
          productName={selectedRow!.productName}
          currentStock={selectedRow!.stock}
          sales={sales}
          products={products}
        />
      )}

      <ProductCreationDialog
        open={productDialogOpen}
        onClose={handleProductDialogClose}
      />

      <BulkSalesDialog
        open={bulkSalesOpen}
        onClose={handleBulkSalesClose}
        selectedProducts={selectedProducts}
      />

      <EtsyImportDialog
        open={etsyImportOpen}
        onClose={handleEtsyImportDialogClose}
      />
    </>
  );
};

export default CombinedInventoryTable;
