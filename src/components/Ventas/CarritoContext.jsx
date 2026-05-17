import React, { createContext, useState, useContext, useEffect } from 'react';

export const CarritoContext = createContext();

export function CarritoProvider({ children }) {
  const [carrito, setCarrito] = useState([]);

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('carrito');
    if (savedCart) {
      setCarrito(JSON.parse(savedCart));
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('carrito', JSON.stringify(carrito));
  }, [carrito]);

  const agregarProducto = (producto, cantidad, precio_unit, descuento = 0) => {
    const nuevoItem = {
      id: producto.id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      cantidad,
      precio_unit,
      descuento,
      subtotal: (precio_unit * cantidad) - descuento
    };
    setCarrito(prev => [...prev, nuevoItem]);
  };

  const eliminarProducto = (index) => {
    setCarrito(prev => prev.filter((_, i) => i !== index));
  };

  const vaciarCarrito = () => {
    setCarrito([]);
  };

  const calcularTotal = () => {
    return carrito.reduce((sum, item) => sum + (item.precio_unit * item.cantidad - item.descuento), 0);
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