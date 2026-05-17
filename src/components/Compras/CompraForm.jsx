import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function CompraForm({ productos, onRegistrar }) {
  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad: 1,
    precio_compra: '',
    proveedor_id: ''
  });
  
  const [proveedores, setProveedores] = useState([]);
  const [showNewProveedor, setShowNewProveedor] = useState(false);
  const [newProveedor, setNewProveedor] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Cargar proveedores desde la API
  const fetchProveedores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/proveedores', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProveedores(response.data);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  // Producto seleccionado
  const productoSeleccionado = productos.find(p => p.id === parseInt(formData.producto_id));

  // Cuando cambia el producto, auto-cargar precio de compra Y proveedor
  useEffect(() => {
    if (productoSeleccionado) {
      console.log('Producto seleccionado:', productoSeleccionado); // Para depuración
      setFormData(prev => ({
        ...prev,
        precio_compra: productoSeleccionado.precio_compra || 0,
        proveedor_id: productoSeleccionado.proveedor_id || ''   // ← Arrastra el proveedor
      }));
    }
  }, [formData.producto_id, productoSeleccionado]);

  // Guardar nuevo proveedor
  const handleNewProveedor = async () => {
    if (!newProveedor.trim()) {
      alert('Ingrese el nombre del proveedor');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/proveedores', 
        { nombre: newProveedor },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const nuevoProveedorObj = { id: response.data.id, nombre: newProveedor };
      setProveedores([...proveedores, nuevoProveedorObj]);
      setFormData({ ...formData, proveedor_id: response.data.id });
      setShowNewProveedor(false);
      setNewProveedor('');
    } catch (error) {
      alert(error.response?.data?.error || 'Error al crear proveedor');
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.producto_id) newErrors.producto_id = 'Seleccione un producto';
    if (!formData.cantidad || formData.cantidad <= 0) newErrors.cantidad = 'Cantidad válida requerida';
    if (!formData.precio_compra || formData.precio_compra <= 0) newErrors.precio_compra = 'Precio de compra requerido';
    if (!formData.proveedor_id) newErrors.proveedor_id = 'Seleccione un proveedor';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const proveedorNombre = proveedores.find(p => p.id === parseInt(formData.proveedor_id))?.nombre || '';
      
      await onRegistrar({
        producto_id: formData.producto_id,
        cantidad: formData.cantidad,
        precio_compra: formData.precio_compra,
        proveedor: proveedorNombre,
        proveedor_id: formData.proveedor_id
      });
      
      setFormData({
        producto_id: '',
        cantidad: 1,
        precio_compra: '',
        proveedor_id: ''
      });
      setErrors({});
    } finally {
      setLoading(false);
    }
  };

  // Obtener el nombre del proveedor seleccionado
  const proveedorSeleccionado = proveedores.find(p => p.id === parseInt(formData.proveedor_id));

  return (
    <div className="modern-form-card">
      <div className="modern-form-header">
        <h3>Registrar Nueva Compra</h3>
      </div>

      <form onSubmit={handleSubmit} className="modern-form-body">
        <div className="modern-form-group">
          <label>Producto *</label>
          <select
            value={formData.producto_id}
            onChange={(e) => setFormData({ ...formData, producto_id: e.target.value })}
            className={errors.producto_id ? 'error' : ''}
          >
            <option value="">Seleccione un producto</option>
            {productos.map((producto) => (
              <option key={producto.id} value={producto.id}>
                {producto.codigo} - {producto.nombre} (Stock: {producto.stock})
              </option>
            ))}
          </select>
          {errors.producto_id && <span className="error-message">{errors.producto_id}</span>}
        </div>

        <div className="modern-form-row">
          <div className="modern-form-group">
            <label>Cantidad *</label>
            <input
              type="number"
              min="1"
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
              className={errors.cantidad ? 'error' : ''}
            />
            {errors.cantidad && <span className="error-message">{errors.cantidad}</span>}
          </div>

          <div className="modern-form-group">
            <label>Precio Compra Unitario *</label>
            <input
              type="number"
              step="0.01"
              value={formData.precio_compra}
              readOnly
              style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
              className={errors.precio_compra ? 'error' : ''}
            />
            <small style={{ color: '#666', fontSize: '11px' }}>
              Se carga automáticamente desde el producto
            </small>
            {errors.precio_compra && <span className="error-message">{errors.precio_compra}</span>}
          </div>
        </div>

        {/* Campo Proveedor */}
        <div className="modern-form-group">
          <label>Proveedor *</label>
          {!showNewProveedor ? (
            <select
              value={formData.proveedor_id}
              onChange={(e) => {
                if (e.target.value === '__nuevo__') {
                  setShowNewProveedor(true);
                  setFormData({ ...formData, proveedor_id: '' });
                } else {
                  setFormData({ ...formData, proveedor_id: e.target.value });
                }
              }}
              className={errors.proveedor_id ? 'error' : ''}
            >
              <option value="">-- Seleccione un proveedor --</option>
              {proveedores.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {prov.nombre}
                </option>
              ))}
              <option value="__nuevo__" style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                + Agregar nuevo proveedor
              </option>
            </select>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={newProveedor}
                onChange={(e) => setNewProveedor(e.target.value)}
                placeholder="Nombre del nuevo proveedor"
                autoFocus
                style={{ flex: 1 }}
              />
              <button type="button" onClick={handleNewProveedor} style={{ background: '#4caf50', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                Guardar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewProveedor(false);
                  setNewProveedor('');
                }}
                style={{ background: '#ccc', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          )}
          
          {/* Mensaje cuando el proveedor se carga automáticamente */}
          {formData.proveedor_id && proveedorSeleccionado && !showNewProveedor && (
            <small style={{ color: '#2e7d32', fontSize: '11px', display: 'block', marginTop: '4px' }}>
              ✓ Proveedor cargado automáticamente: {proveedorSeleccionado.nombre}
            </small>
          )}
          
          {errors.proveedor_id && <span className="error-message">{errors.proveedor_id}</span>}
        </div>

        {/* Panel de información de stock */}
        {productoSeleccionado && (
          <div className="info-panel">
            <div className="info-panel-row">
              <span>Stock actual:</span>
              <strong>{productoSeleccionado.stock} unidades</strong>
            </div>
            <div className="info-panel-row highlight">
              <span>Nuevo stock:</span>
              <strong className="success-text">{productoSeleccionado.stock + formData.cantidad} unidades</strong>
            </div>
          </div>
        )}

        <div className="modern-form-actions">
          <button type="submit" className="btn-modern-primary" disabled={loading}>
            {loading ? 'Procesando...' : 'Registrar Compra'}
          </button>
        </div>
      </form>
    </div>
  );
}