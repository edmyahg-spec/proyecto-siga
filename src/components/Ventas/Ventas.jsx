import React, { useState, useEffect } from 'react';
import { useCarrito } from '../../contexts/CarritoContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import VentasRecientes from './VentasRecientes';

export default function Ventas() {
  const { carrito, vaciarCarrito, eliminarProducto, calcularTotal } = useCarrito();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metodoPago, setMetodoPago] = useState('');
  const [notas, setNotas] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [precio, setPrecio] = useState('');
  const [descuento, setDescuento] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/productos/activos');
      setProductos(response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Error al cargar productos. Verifica que el servidor esté corriendo.');
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (e) => {
    const productId = e.target.value;
    setSelectedProduct(productId);
    const product = productos.find(p => p.id === parseInt(productId));
    if (product) {
      setPrecio(product.precio_venta);
    }
  };

  const handleAgregarProducto = (e) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      toast.error('Seleccione un producto');
      return;
    }

    const product = productos.find(p => p.id === parseInt(selectedProduct));
    
    if (!product) {
      toast.error('Producto no encontrado');
      return;
    }
    
    if (cantidad > product.stock) {
      toast.error(`Stock insuficiente. Solo hay ${product.stock} unidades disponibles`);
      return;
    }

    // Agregar al carrito usando el contexto
    const nuevoItem = {
      id: product.id,
      codigo: product.codigo,
      nombre: product.nombre,
      cantidad: cantidad,
      precio_unit: parseFloat(precio),
      descuento: parseFloat(descuento),
      subtotal: (parseFloat(precio) * cantidad) - parseFloat(descuento)
    };
    
    const carritoActual = JSON.parse(localStorage.getItem('carrito') || '[]');
    carritoActual.push(nuevoItem);
    localStorage.setItem('carrito', JSON.stringify(carritoActual));
    
    // Actualizar el contexto (si el contexto tiene función para agregar)
    if (typeof agregarProducto === 'function') {
      agregarProducto(product, cantidad, parseFloat(precio), parseFloat(descuento));
    }
    
    setSelectedProduct('');
    setCantidad(1);
    setDescuento(0);
    
    toast.success('Producto agregado al carrito');
    
    // Forzar recarga del componente para actualizar el carrito
    window.location.reload();
  };

  const handleEliminarProducto = (index) => {
    const carritoActual = JSON.parse(localStorage.getItem('carrito') || '[]');
    carritoActual.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carritoActual));
    if (typeof eliminarProducto === 'function') {
      eliminarProducto(index);
    }
    window.location.reload();
  };

  const handleVaciarCarrito = () => {
    localStorage.setItem('carrito', '[]');
    if (typeof vaciarCarrito === 'function') {
      vaciarCarrito();
    }
    window.location.reload();
  };

  const obtenerCarrito = () => {
    const carritoStorage = localStorage.getItem('carrito');
    if (carritoStorage) {
      return JSON.parse(carritoStorage);
    }
    return carrito.length > 0 ? carrito : [];
  };

  const calcularTotalCarrito = () => {
    const items = obtenerCarrito();
    return items.reduce((sum, item) => sum + (item.subtotal || (item.precio_unit * item.cantidad - item.descuento)), 0);
  };

  const handleConfirmarVenta = async () => {
    const items = obtenerCarrito();
    
    if (items.length === 0) {
      toast.error('No hay productos en la venta');
      return;
    }

    if (!metodoPago) {
      toast.error('Seleccione método de pago');
      return;
    }

    setConfirmando(true);
    try {
      const response = await api.post('/ventas', {
        items: items,
        metodo_pago: metodoPago,
        notas: notas,
        total: calcularTotalCarrito()
      });

      toast.success('Venta registrada exitosamente');
      localStorage.setItem('carrito', '[]');
      setMetodoPago('');
      setNotas('');
      
      if (response.data.venta_id) {
        window.open(`/ticket/${response.data.venta_id}`, '_blank');
      }
      
      window.location.reload();
    } catch (error) {
      console.error('Error confirming sale:', error);
      toast.error(error.response?.data?.error || 'Error al confirmar venta');
    } finally {
      setConfirmando(false);
    }
  };

  const carritoItems = obtenerCarrito();
  const total = calcularTotalCarrito();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Error de conexión</h3>
        <p>{error}</p>
        <button className="btn-modern-primary" onClick={cargarProductos}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="ventas-container">
      <div className="page-header">
        <h1>Registro de Ventas</h1>
        <p>Sistema de Gestión Comercial</p>
      </div>

      <div className="ventas-grid">
        {/* Formulario para agregar productos */}
        <div className="modern-form-card">
          <div className="modern-form-header">
            <h3>Agregar Producto</h3>
          </div>

          <form onSubmit={handleAgregarProducto} className="modern-form-body">
            <div className="modern-form-group">
              <label>Producto *</label>
              <select
                value={selectedProduct}
                onChange={handleProductChange}
                required
              >
                <option value="">Seleccione un producto</option>
                {productos.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.codigo} - {producto.nombre} (Stock: {producto.stock})
                  </option>
                ))}
              </select>
            </div>

            <div className="modern-form-row">
              <div className="modern-form-group">
                <label>Cantidad *</label>
                <input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                  required
                />
              </div>

              <div className="modern-form-group">
                <label>Precio unitario *</label>
                <input
                  type="number"
                  step="0.01"
                  value={precio}
                  onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            <div className="modern-form-group">
              <label>Descuento</label>
              <input
                type="number"
                step="0.01"
                value={descuento}
                onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <button type="submit" className="btn-modern-primary" style={{ width: '100%' }}>
              + Agregar al carrito
            </button>
          </form>
        </div>

        {/* Carrito de compras */}
        <div className="modern-form-card">
          <div className="modern-form-header">
            <h3>Carrito de Venta</h3>
          </div>

          <div className="modern-form-body">
            {carritoItems.length === 0 ? (
              <div className="empty-cart">
                <p>No hay productos en el carrito</p>
                <small>Agregue productos para iniciar una venta</small>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  <table className="cart-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cant</th>
                        <th>Precio</th>
                        <th>Desc</th>
                        <th>Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {carritoItems.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{item.nombre}</strong>
                            <br />
                            <small>{item.codigo}</small>
                          </td>
                          <td className="text-center">{item.cantidad}</td>
                          <td className="text-right">${item.precio_unit.toFixed(2)}</td>
                          <td className="text-right text-danger">
                            {item.descuento > 0 ? `-$${item.descuento.toFixed(2)}` : '-'}
                          </td>
                          <td className="text-right">${(item.precio_unit * item.cantidad - item.descuento).toFixed(2)}</td>
                          <td className="text-center">
                            <button onClick={() => handleEliminarProducto(idx)} className="btn-remove">
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="cart-total">
                        <td colSpan="4" className="text-right"><strong>TOTAL:</strong></td>
                        <td className="text-right"><strong>${total.toFixed(2)}</strong></td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="cart-actions">
                  <button onClick={handleVaciarCarrito} className="btn-secondary">
                    Vaciar carrito
                  </button>
                </div>
              </>
            )}

            <div className="payment-section">
              <div className="modern-form-group">
                <label>Método de pago *</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  required
                >
                  <option value="">Seleccione método de pago</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>

              <div className="modern-form-group">
                <label>Observaciones</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows="3"
                  placeholder="Notas adicionales..."
                />
              </div>

              <button
                onClick={handleConfirmarVenta}
                disabled={confirmando || carritoItems.length === 0}
                className="btn-confirm"
              >
                {confirmando ? 'Procesando...' : 'Confirmar Venta'}
              </button>
            </div>
          </div>
        </div>
      </div>
          
      <VentasRecientes />
    </div>
  );
}

     
   