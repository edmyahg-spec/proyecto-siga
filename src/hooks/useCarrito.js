import { useContext } from 'react';
import { CarritoContext } from '../contexts/CarritoContext';

export function useCarrito() {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error('useCarrito must be used within a CarritoProvider');
  }
  return context;
}