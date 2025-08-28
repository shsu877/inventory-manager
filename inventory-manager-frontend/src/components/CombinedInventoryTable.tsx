import React, { useState, useRef } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  InventoryService,
  SalesService,
  ProductService,
} from "../services/api";
import { InventoryItem, Product, Sale } from "../types";
import { Button } from "@mui/material";
import InventoryAdjustmentDialog from "./InventoryAdjustmentDialog";

interface RowData {
  id: string;
  productName: string;
  variant: string;
  stock: number;
  itemsSold: number;
  productId: string;
  variantId: string;
  handleAdjust: (rowId: string) => void;
}

const columns: GridColDef[] = [
  {
    field: "productName",
    headerName: "Product Name",
    flex: 1,
    editable: true,
  },
  {
    field: "variant",
    headerName: "Variant",
    width: 120,
    editable: true,
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
    width: 150,
    renderCell: ({ row }) => (
      <Button
        size="small"
        variant="outlined"
        onClick={() => row.handleAdjust(row.id)}
      >
        Adjust
      </Button>
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
  const queryClient = useQueryClient();

  // Calculate items sold for each product variant by aggregating sales data
  const salesByVariant = sales.reduce((acc, sale) => {
    const key = `${sale.productId}-${sale.variantId}`;
    acc[key] = (acc[key] || 0) + sale.quantity;
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

  // Store the original rows data for retrieving current stock values
  const rowDataRef = useRef<RowData[]>([]);
  const rowsRef = useRef<RowData[]>([]);

  // Combine product and inventory data
  const rows: RowData[] = products.flatMap((product) =>
    product.variants.map((variant) => {
      const inventoryItem = inventory.find(
        (item) => item.productId === product.id && item.variantId === variant.id
      );
      const variantKey = `${product.id}-${variant.id}`;
      const itemsSold = salesByVariant[variantKey] || 0;

      const rowData: RowData = {
        id: `${product.id}-${variant.id}`,
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        variant: variant.color,
        stock: inventoryItem?.quantityOnHand || 0,
        itemsSold: itemsSold,
        handleAdjust: handleAdjustClick,
      };

      return rowData;
    })
  );

  // Store the rows for cell editing
  rowDataRef.current = rows;
  rowsRef.current = rows;

  // Mutation for adjusting inventory
  const adjustMutation = useMutation({
    mutationFn: ({
      productId,
      variantId,
      adjustment,
    }: {
      productId: string;
      variantId: string;
      adjustment: number;
    }) =>
      InventoryService.adjustInventory({ productId, variantId, adjustment }),
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

  // Handle inline cell editing
  const processRowUpdate = async (newRow: any, oldRow: any) => {
    if (newRow.productName !== oldRow.productName) {
      ProductService.updateProduct(newRow.productId, {
        name: newRow.productName,
      });
    }

    if (newRow.variant !== oldRow.variant) {
      ProductService.updateVariant(newRow.productId, {
        id: newRow.variantId,
        name: newRow.variant,
      });
    }

    if (newRow.stock !== oldRow.stock) {
      // Calculate adjustment: new value - old value
      const adjustment = newRow.stock - oldRow.stock;

      // If adjustment is negative (items were sold), create a sale record
      if (adjustment < 0) {
        const product = products.find((p) => p.id === newRow.productId);
        if (product) {
          const quantitySold = Math.abs(adjustment);
          const saleData = {
            productId: newRow.productId,
            variantId: newRow.variantId,
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
        variantId: newRow.variantId,
        adjustment,
      });
    }
    return newRow;
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedRow(null);
  };

  return (
    <>
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
          variantId={selectedRow.variantId}
          productName={selectedRow.productName}
          variantName={selectedRow.variant}
          currentStock={selectedRow.stock}
          sales={sales}
          products={products}
        />
      )}
    </>
  );
};

export default CombinedInventoryTable;
