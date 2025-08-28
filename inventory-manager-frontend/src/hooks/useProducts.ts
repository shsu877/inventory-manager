import { useQuery } from '@tanstack/react-query';
import { ProductService } from '../services/api';

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => ProductService.getProducts()
  });
};