import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProductForm({ categorias, editProduct, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: '',
    proveedor_id: '',        // Cambiado: ahora guarda ID del proveedor
    precio_compra: 0,
    precio_venta: 0,
    stock: 0,
    stock_min: 0,
    estado: 'activo'
  });
  
  const [proveedores, setProveedores] = useState([]);
  const [showNewProveedor, setShowNewProveedor] = useState(false);
  const [newProveedor, setNewProveedor] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
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

  // Cargar proveedores al montar el componente
  useEffect(() => {
    fetchProveedores();
  }, []);

  // Cargar datos del producto si se está editando
  useEffect(() => {
    if (editProduct) {
      setFormData({
        codigo: editProduct.codigo || '',
        nombre: editProduct.nombre || '',
        categoria: editProduct.categoria || '',
        proveedor_id: editProduct.proveedor_id || '',
        precio_compra: editProduct.precio_compra || 0,
        precio_venta: editProduct.precio_venta || 0,
        stock: editProduct.stock || 0,
        stock_min: editProduct.stock_min || 0,
        estado: editProduct.estado || 'activo'
      });
    }
  }, [editProduct]);

  // Validar formulario
  const validate = (finalCategoria = formData.categoria) => {
    const newErrors = {};
    if (!formData.codigo) newErrors.codigo = 'El código es requerido';
    if (!formData.nombre) newErrors.nombre = 'El nombre es requerido';
    if (!finalCategoria) newErrors.categoria = 'La categoría es requerida';
    if (formData.precio_venta < formData.precio_compra) {
      newErrors.precio_venta = 'El precio de venta no puede ser menor al precio de compra';
    }
    if (formData.stock_min > formData.stock) {
      newErrors.stock_min = 'El stock mínimo no puede ser mayor al stock actual';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
      
      // Agregar nuevo proveedor a la lista
      const nuevoProveedor = { id: response.data.id, nombre: newProveedor };
      setProveedores([...proveedores, nuevoProveedor]);
      setFormData({ ...formData, proveedor_id: response.data.id });
      setShowNewProveedor(false);
      setNewProveedor('');
    } catch (error) {
      alert(error.response?.data?.error || 'Error al crear proveedor');
    }
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalCategoria = showNewCategory ? newCategory : formData.categoria;

    if (!validate(finalCategoria)) return;

    setLoading(true);
    try {
      await onSave({
        ...formData,
        categoria: finalCategoria
      });
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      categoria: '',
      proveedor_id: '',
      precio_compra: 0,
      precio_venta: 0,
      stock: 0,
      stock_min: 0,
      estado: 'activo'
    });
    setShowNewCategory(false);
    setShowNewProveedor(false);
    setNewCategory('');
    setNewProveedor('');
    setErrors({});
  };

  return (
    <div className="modern-form-card">
      <div className="modern-form-header">
        <div className="modern-form-icon">📦</div>
        <h3>{editProduct ? '✏️ Editar Producto' : '✨ Agregar Producto'}</h3>
      </div>

      <form onSubmit={handleSubmit} className="modern-form-body">
        {/* Fila: Código y Nombre */}
        <div className="modern-form-row">
          <div className="modern-form-group">
            <label>Código *</label>
            <div className="modern-input-wrapper">
              <span className="input-icon">🔖</span>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className={errors.codigo ? 'error' : ''}
                readOnly={!!editProduct}
                placeholder="Ej. VID-001"
              />
            </div>
            {errors.codigo && <span className="error-message">{errors.codigo}</span>}
          </div>

          <div className="modern-form-group">
            <label>Nombre *</label>
            <div className="modern-input-wrapper">
              <span className="input-icon">🏷️</span>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className={errors.nombre ? 'error' : ''}
                placeholder="Nombre del producto"
              />
            </div>
            {errors.nombre && <span className="error-message">{errors.nombre}</span>}
          </div>
        </div>

        {/* Campo: Categoría */}
        <div className="modern-form-group">
          <label>Categoría *</label>
          <div className="modern-input-wrapper">
            <span className="input-icon">📂</span>
            {!showNewCategory ? (
              <select
                value={formData.categoria}
                onChange={(e) => {
                  if (e.target.value === '__nueva__') {
                    setShowNewCategory(true);
                    setFormData({ ...formData, categoria: '' });
                  } else {
                    setFormData({ ...formData, categoria: e.target.value });
                  }
                }}
                className={errors.categoria ? 'error' : ''}
              >
                <option value="">Seleccione una categoría...</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__nueva__">+ Crear nueva categoría</option>
              </select>
            ) : (
              <div className="new-category-input">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nombre de la nueva categoría"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategory(false);
                    setNewCategory('');
                  }}
                  className="cancel-btn"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
          {errors.categoria && <span className="error-message">{errors.categoria}</span>}
        </div>

        {/* Campo: Proveedor (NUEVO: Selector con opción "+ Agregar nuevo") */}
        <div className="modern-form-group">
          <label>Proveedor</label>
          <div className="modern-input-wrapper">
            <span className="input-icon">🏭</span>
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
              <div className="new-category-input">
                <input
                  type="text"
                  value={newProveedor}
                  onChange={(e) => setNewProveedor(e.target.value)}
                  placeholder="Nombre del nuevo proveedor"
                  autoFocus
                />
                <button type="button" onClick={handleNewProveedor} className="confirm-btn">
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewProveedor(false);
                    setNewProveedor('');
                  }}
                  className="cancel-btn"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Fila: Precios */}
        <div className="modern-form-row">
          <div className="modern-form-group">
            <label>Precio Compra</label>
            <div className="modern-input-wrapper">
              <span className="input-icon">💰</span>
              <input
                type="number"
                step="0.01"
                value={formData.precio_compra}
                onChange={(e) => setFormData({ ...formData, precio_compra: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="modern-form-group">
            <label>Precio Venta *</label>
            <div className="modern-input-wrapper">
              <span className="input-icon">💵</span>
              <input
                type="number"
                step="0.01"
                value={formData.precio_venta}
                onChange={(e) => setFormData({ ...formData, precio_venta: parseFloat(e.target.value) || 0 })}
                className={errors.precio_venta ? 'error' : ''}
              />
            </div>
            {errors.precio_venta && <span className="error-message">{errors.precio_venta}</span>}
          </div>
        </div>

        {/* Fila: Stock y Stock Mínimo */}
        <div className="modern-form-row">
          <div className="modern-form-group">
            <label>Stock Inicial</label>
            <div className="modern-input-wrapper">
              <span className="input-icon">📊</span>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="modern-form-group">
            <label>Stock Mínimo</label>
            <div className="modern-input-wrapper">
              <span className="input-icon">⚠️</span>
              <input
                type="number"
                min="0"
                value={formData.stock_min}
                onChange={(e) => setFormData({ ...formData, stock_min: parseInt(e.target.value) || 0 })}
                className={errors.stock_min ? 'error' : ''}
              />
            </div>
            {errors.stock_min && <span className="error-message">{errors.stock_min}</span>}
          </div>
        </div>

        {/* Estado */}
        <div className="modern-form-group">
          <label>Estado</label>
          <div className="toggle-switch">
            <button
              type="button"
              className={`toggle-option ${formData.estado === 'activo' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, estado: 'activo' })}
            >
              ✅ Activo
            </button>
            <button
              type="button"
              className={`toggle-option ${formData.estado === 'inactivo' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, estado: 'inactivo' })}
            >
              ⛔ Inactivo
            </button>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="modern-form-actions">
          <button type="submit" className="btn-modern-primary" disabled={loading}>
            {loading ? 'Guardando...' : (editProduct ? '💾 Actualizar Producto' : '✨ Guardar Producto')}
          </button>
          {editProduct && (
            <button type="button" className="btn-modern-secondary" onClick={onCancel}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}