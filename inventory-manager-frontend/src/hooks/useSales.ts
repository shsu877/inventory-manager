import { useQuery } from '@tanstack/react-query';
import { SalesService } from '../services/api';

export const useSales = () => {
  return useQuery({
    queryKey: ['sales'],
    queryFn: () => SalesService.getSales()
  });
};