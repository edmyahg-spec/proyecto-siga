import React, { createContext, useState, useContext } from 'react';

export const CarritoContext = createContext();

export function CarritoProvider({ children }) {
  const [carrito, setCarrito] = useState([]);

  const agregarProducto = (producto, cantidad, precio_unit, descuento = 0) => {
    setCarrito(prev => [...prev, {
      ...producto,
      cantidad,
      precio_unit,
      descuento,
      subtotal: (precio_unit * cantidad) - descuento
    }]);
  };

  const eliminarProducto = (index) => {
    setCarrito(prev => prev.filter((_, i) => i !== index));
  };

  const vaciarCarrito = () => {
    setCarrito([]);
  };

  const calcularTotal = () => {
    return carrito.reduce((sum, item) => sum + item.subtotal, 0);
  };

  return (
    <CarritoContext.Provider value={{
      carrito,
      agregarProducto,
      eliminarProducto,
      vaciarCarrito,
      calcularTotal
    }}>
      {children}
    </CarritoContext.Provider>
  );
}

export const useCarrito = () => useContext(CarritoContext);