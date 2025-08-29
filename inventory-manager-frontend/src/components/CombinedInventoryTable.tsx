import React, { useState, useRef } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  InventoryService,
  SalesService,
  ProductService,
} from "../services/api";
import { InventoryItem, Product, Sale } from "../types";
import { Button, Box } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import InventoryAdjustmentDialog from "./InventoryAdjustmentDialog";
import ProductCreationDialog from "./ProductCreationDialog";

interface RowData {
  id: string;
  productName: string;
  tags: string;
  stock: number;
  itemsSold: number;
  price: number;
  productId: string;
  handleAdjust: (rowId: string) => void;
  handleDelete: (productId: string) => void;
}

const columns: GridColDef[] = [
  {
    field: "productName",
    headerName: "Product Name",
    flex: 2,
    editable: true,
  },
  {
    field: "tags",
    headerName: "Tags",
    width: 200,
    renderCell: (params) => params.value || "No tags",
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
    width: 100,
    editable: true,
  },
  {
    field: "itemsSold",
    headerName: "Items Sold",
    type: "number",
    width: 120,
  },
  {
    field: "actions",
    headerName: "Actions",
    width: 250,
    renderCell: ({ row }) => (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          color="error"
          onClick={() => row.handleDelete(row.productId)}
        >
          Delete
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => row.handleAdjust(row.id)}
        >
          Adjust
        </Button>
      </Box>
    ),
  },
];

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
  const queryClient = useQueryClient();

  // Calculate items sold for each product by aggregating sales data
  const salesByProduct = sales.reduce((acc, sale) => {
    acc[sale.productId] = (acc[sale.productId] || 0) + sale.quantity;
    return acc;
  }, {} as Record<string, number>);

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
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(productId);
    }
  };

  // Store the original rows data for retrieving current stock values
  const rowDataRef = useRef<RowData[]>([]);
  const rowsRef = useRef<RowData[]>([]);

  // Create rows from products directly (one row per product)
  const rows: RowData[] = products.map((product) => {
    const inventoryItem = inventory.find(
      (item) => item.productId === product._id
    );
    const itemsSold = salesByProduct[product._id] || 0;

    const rowData: RowData = {
      id: product._id,
      productId: product._id,
      productName: product.name,
      tags: product.tags?.join(', ') || '',
      price: product.price,
      stock: inventoryItem?.quantityOnHand || 0,
      itemsSold: itemsSold,
      handleAdjust: handleAdjustClick,
      handleDelete: handleDeleteClick,
    };

    return rowData;
  });

  // Store the rows for cell editing
  rowDataRef.current = rows;
  rowsRef.current = rows;

  // Mutation for adjusting inventory
  const adjustMutation = useMutation({
    mutationFn: ({
      productId,
      adjustment,
    }: {
      productId: string;
      adjustment: number;
    }) =>
      InventoryService.adjustInventory({ productId, adjustment }),
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

    if (newRow.stock !== oldRow.stock) {
      // Calculate adjustment: new value - old value
      const adjustment = newRow.stock - oldRow.stock;

      // If adjustment is negative (items were sold), create a sale record
      if (adjustment < 0) {
        const product = products.find((p) => p._id === newRow.productId);
        if (product) {
          const quantitySold = Math.abs(adjustment);
          const saleData = {
            productId: newRow.productId,
            quantity: quantitySold,
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

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setProductDialogOpen(true)}
        >
          Add Product
        </Button>
      </Box>

      <div style={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          disableRowSelectionOnClick
          processRowUpdate={processRowUpdate}
        />
      </div>

      {selectedRow && (
        <InventoryAdjustmentDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          productId={selectedRow.productId}
          productName={selectedRow.productName}
          currentStock={selectedRow.stock}
          sales={sales}
          products={products}
        />
      )}

      <ProductCreationDialog
        open={productDialogOpen}
        onClose={handleProductDialogClose}
      />
    </>
  );
};

export default CombinedInventoryTable;
