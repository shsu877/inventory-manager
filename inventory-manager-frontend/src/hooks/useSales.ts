import { useQuery } from '@tanstack/react-query';
import { SalesService } from '../services/api';
import { Sale } from '../types';

export const useSales = (options: any) => {
  return useQuery<Sale[]>({
    queryKey: ['sales'],
    queryFn: () => SalesService.getSales(),
    ...options
  });
};