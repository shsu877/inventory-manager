import { DataGrid, GridColDef, GridValueGetter } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import { SalesService } from "../services/api";
import { Sale } from "../types";
import { Box, Typography } from "@mui/material";

const columns: GridColDef[] = [
  {
    field: "productId",
    headerName: "Product",
    flex: 1,
    width: 200,
    valueGetter: (params: any) => {
      return "Product ID: " + params;
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

export default function SalesReport() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["sales"],
    queryFn: () => SalesService.getSales(),
  });
  // Debug logging (can be removed in production)
  console.log("Sales data:", data);
  console.log("Sales data type:", Array.isArray(data) ? "array" : typeof data);
  console.log("Loading state:", isLoading);
  console.log("Error state:", error);

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
      {data && !isLoading && (
        <Typography variant="caption" sx={{ mb: 1, display: "block" }}>
          Loaded {Array.isArray(data) ? data.length : 0} sales records
        </Typography>
      )}

      <DataGrid
        rows={Array.isArray(data) ? data : []}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row._id}
        disableRowSelectionOnClick
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 25 },
          },
        }}
        pagination
        autoHeight={false}
      />
    </Box>
  );
}
