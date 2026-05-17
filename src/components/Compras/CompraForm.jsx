import React, { useState } from 'react';

export default function CompraForm({ productos, onRegistrar }) {
  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad: 1,
    precio_compra: '',
    proveedor: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.producto_id) newErrors.producto_id = 'Seleccione un producto';
    if (!formData.cantidad || formData.cantidad <= 0) newErrors.cantidad = 'Cantidad válida requerida';
    if (!formData.precio_compra || formData.precio_compra <= 0) newErrors.precio_compra = 'Precio de compra requerido';
    if (!formData.proveedor.trim()) newErrors.proveedor = 'Nombre del proveedor requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onRegistrar(formData);
      setFormData({
        producto_id: '',
        cantidad: 1,
        precio_compra: '',
        proveedor: ''
      });
      setErrors({});
    } finally {
      setLoading(false);
    }
  };

  const productoSeleccionado = productos.find(p => p.id === parseInt(formData.producto_id));

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
              onChange={(e) => setFormData({ ...formData, precio_compra: parseFloat(e.target.value) || 0 })}
              className={errors.precio_compra ? 'error' : ''}
              placeholder="0.00"
            />
            {errors.precio_compra && <span className="error-message">{errors.precio_compra}</span>}
          </div>
        </div>

        <div className="modern-form-group">
          <label>Proveedor *</label>
          <input
            type="text"
            value={formData.proveedor}
            onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
            className={errors.proveedor ? 'error' : ''}
            placeholder="Nombre del proveedor"
          />
          {errors.proveedor && <span className="error-message">{errors.proveedor}</span>}
        </div>

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