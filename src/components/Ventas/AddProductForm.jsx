import React, { useState } from 'react';
import { useCarrito } from '../../contexts/CarritoContext';
import toast from 'react-hot-toast';

export default function AddProductForm({ productos, loading }) {
  const { agregarProducto } = useCarrito();
  const [selectedProduct, setSelectedProduct] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [precio, setPrecio] = useState('');
  const [descuento, setDescuento] = useState(0);

  const handleProductChange = (e) => {
    const productId = e.target.value;
    setSelectedProduct(productId);
    const product = productos.find(p => p.id === parseInt(productId));
    if (product) {
      setPrecio(product.precio_venta);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      toast.error('Seleccione un producto');
      return;
    }

    const product = productos.find(p => p.id === parseInt(selectedProduct));
    
    if (cantidad > product.stock) {
      toast.error(`Stock insuficiente. Solo hay ${product.stock} unidades disponibles`);
      return;
    }

    agregarProducto(product, cantidad, parseFloat(precio), parseFloat(descuento));
    
    setSelectedProduct('');
    setCantidad(1);
    setDescuento(0);
    
    toast.success('Producto agregado al carrito');
  };

  return (
    <div className="form-card">
      <div className="form-header">
        <h3>➕ Agregar Producto</h3>
      </div>

      <form onSubmit={handleSubmit} className="form-body">
        <div className="form-group">
          <label>📦 Producto *</label>
          <select
            value={selectedProduct}
            onChange={handleProductChange}
            required
            disabled={loading}
          >
            <option value="">Seleccione un producto</option>
            {productos.map((producto) => (
              <option key={producto.id} value={producto.id}>
                {producto.codigo} - {producto.nombre} (Stock: {producto.stock})
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>🔢 Cantidad *</label>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
              required
            />
          </div>

          <div className="form-group">
            <label>💰 Precio unitario *</label>
            <input
              type="number"
              step="0.01"
              value={precio}
              onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>🏷️ Descuento</label>
          <input
            type="number"
            step="0.01"
            value={descuento}
            onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%' }}>
          + Agregar al carrito
        </button>
      </form>
    </div>
  );
}