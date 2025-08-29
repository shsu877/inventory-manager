import { DataGrid, GridColDef, GridValueGetter } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { SalesService } from '../services/api';
import { Sale } from '../types';
import { Box, Typography } from '@mui/material';

const columns: GridColDef<Sale>[] = [
  {
    field: 'productName',
    headerName: 'Product',
    flex: 1,
    valueGetter: (params: { row: Sale }) => params.row.productId || 'N/A'
  },
  { field: 'quantity', headerName: 'Qty', type: 'number' },
  { 
    field: 'saleDate', 
    headerName: 'Date', 
    type: 'date',
    valueGetter: (params: { row: Sale }) => new Date(params.row.dateTime)
  },
  { field: 'channel', headerName: 'Channel' }
];

export default function SalesReport() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sales'],
    queryFn: () => SalesService.getSales()
  });
console.log('Sales data:', data);
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