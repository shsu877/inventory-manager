// src/components/InventoryTable.tsx
import { DataGrid, GridRowsProp, GridColDef } from '@mui/x-data-grid';
import { InventoryItem } from '../types';

const columns: GridColDef<InventoryItem>[] = [
  { 
    field: 'productName',
    headerName: 'Product Name',
    flex: 1,
    valueGetter: (params: any) => params.row.product?.name || 'N/A'
  },
  {
    field: 'variantColor',
    headerName: 'Variant',
    width: 120,
    valueGetter: (params: any) => params.row.product?.variants.find((v: any) => v.id === params.row.variantId)?.color || 'N/A'
  },
  {
    field: 'quantityOnHand',
    headerName: 'Stock',
    type: 'number',
    width: 100,
    editable: true
  },
  {
    field: 'lastSold',
    headerName: 'Last Sold',
    type: 'date',
    width: 150,
    valueGetter: (params: any) => new Date(params.row.lastSold)
  }
];

interface InventoryTableProps {
  inventory: InventoryItem[];
  loading: boolean;
}

const InventoryTable = ({ inventory, loading }: InventoryTableProps) => {
  return (
    <div style={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={inventory}
        columns={columns}
        loading={loading}
        disableRowSelectionOnClick
        getRowId={(row) => `${row.productId}-${row.variantId}`}
      />
    </div>
  );
};

export default InventoryTable;
