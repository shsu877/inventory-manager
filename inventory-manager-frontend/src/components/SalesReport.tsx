import { DataGrid, GridColDef, GridValueGetter } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import { SalesService, ProductService } from "../services/api";
import { Sale, Product } from "../types";
import { Box, Typography } from "@mui/material";
import { useMemo } from "react";

export default function SalesReport() {
  const { data: sales, isLoading: salesLoading, error: salesError } = useQuery({
    queryKey: ["sales"],
    queryFn: () => SalesService.getSales(),
  });

  const { data: products, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ["products"],
    queryFn: () => ProductService.getProducts(),
  });

  const productMap = useMemo(() => {
    const map = new Map<string, string>();
    products?.forEach(product => map.set(product._id, product.name));
    return map;
  }, [products]);

  const isLoading = salesLoading || productsLoading;
  const error = salesError || productsError;

  const columns: GridColDef[] = [
    {
      field: "productId",
      headerName: "Product",
      flex: 1,
      width: 200,
      valueGetter: (params) => {
        return productMap.get(params) || "Unknown Product";
      },
    },
    { field: "quantity", headerName: "Qty", type: "number", width: 80 },
    {
      field: "salePrice",
      headerName: "Unit Price",
      type: "number",
      width: 100,
      valueFormatter: (value) => `$${value}`,
    },
    {
      field: "dateTime",
      headerName: "Date",
      width: 180,
      valueFormatter: (what: any) => {
        const date = new Date(what);
        if (isNaN(date.getTime())) return "Invalid Date";
        return (
          date.toLocaleDateString() +
          " " +
          date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
      },
    },
    { field: "channel", headerName: "Channel", width: 100 },
  ];

  return (
    <Box sx={{ height: 600, width: "100%", p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Sales Report
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error loading sales data:{" "}
          {(error as Error)?.message || "Unknown error"}
        </Typography>
      )}

      {/* Display data count for debugging */}
      {sales && !isLoading && (
        <Typography variant="caption" sx={{ mb: 1, display: "block" }}>
          Loaded {Array.isArray(sales) ? sales.length : 0} sales records
        </Typography>
      )}

      <DataGrid
        rows={Array.isArray(sales) ? sales : []}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row._id}
        disableRowSelectionOnClick
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 25 },
          },
          sorting: {
            sortModel: [{ field: 'dateTime', sort: 'desc' }],
          },
        }}
        pagination
        autoHeight={false}
      />
    </Box>
  );
}
