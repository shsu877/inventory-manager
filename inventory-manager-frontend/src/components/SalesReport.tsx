import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { SalesService } from '../services/api';
import { Sale } from '../types';
import { Box, Typography } from '@mui/material';

const columns: GridColDef<Sale>[] = [
  {
    field: 'productName',
    headerName: 'Product',
    flex: 1,
    valueGetter: (params: any) => params.row.productId?.name || 'N/A'
  },
  { field: 'quantity', headerName: 'Qty', type: 'number' },
  { field: 'salePrice', headerName: 'Price', type: 'number' },
  { 
    field: 'saleDate', 
    headerName: 'Date', 
    type: 'date',
    valueGetter: (params: any) => new Date(params.row.saleDate)
  },
  { field: 'channel', headerName: 'Channel' }
];

export default function SalesReport() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sales'],
    queryFn: () => SalesService.getSales()
  });

  return (
    <Box sx={{ height: 600, width: '100%', p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Sales Report</Typography>
      
      {error && (
        <Typography color="error">Error loading sales data: {(error as Error).message}</Typography>
      )}
      
      <DataGrid
        rows={data || []}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row._id}
        disableRowSelectionOnClick
      />
    </Box>
  );
}