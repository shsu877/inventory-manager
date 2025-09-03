import { useQuery } from '@tanstack/react-query';
import { InventoryService } from '../services/api';
import { InventoryItem } from '../types';

export const useInventory = (options: any) => {
  return useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: () => InventoryService.getInventory(), 
    ...options,
  });
};