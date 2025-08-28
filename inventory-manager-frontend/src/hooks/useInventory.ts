import { useQuery } from '@tanstack/react-query';
import { InventoryService } from '../services/api';

export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: () => InventoryService.getInventory()
  });
};