import { useQuery } from '@tanstack/react-query';
import { ProductService } from '../services/api';
import { Product } from '../types';

export const useProducts = (options: any) => {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => ProductService.getProducts(),
    ...options
  });
};