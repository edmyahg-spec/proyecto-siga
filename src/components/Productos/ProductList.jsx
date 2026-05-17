import React from 'react';

export default function ProductList({ productos, onEdit, onDelete }) {
  const getStockBadge = (stock, stock_min) => {
    if (stock === 0) return 'badge-modern-danger';
    if (stock <= stock_min) return 'badge-modern-warning';
    return 'badge-modern-success';
  };

  const getStockText = (stock, stock_min) => {
    if (stock === 0) return 'Agotado';
    if (stock <= stock_min) return 'Bajo stock';
    return 'Disponible';
  };

  const handleEdit = (producto) => {
    // Ejecutar la función onEdit para cargar los datos
    onEdit(producto);
    
    // Desplazar la página al formulario
    const formElement = document.querySelector('.modern-form-card');
    if (formElement) {
      formElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  if (productos.length === 0) {
    return (
      <div className="modern-table-card">
        <div className="modern-table-header">
          <h3>📋 Listado de Productos</h3>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <p>No hay productos registrados</p>
          <small>Utilice el formulario para agregar productos</small>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-table-card">
      <div className="modern-table-header">
        <h3>📋 Listado de Productos</h3>
      </div>

      <div className="modern-table">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id}>
                <td>
                  <span className="product-code">{producto.codigo}</span>
                </td>
                <td>
                  <div className="product-name">{producto.nombre}</div>
                  {producto.proveedor && (
                    <div className="product-supplier">🏭 {producto.proveedor}</div>
                  )}
                </td>
                <td>
                  <span className="product-category">{producto.categoria || '-'}</span>
                </td>
                <td>
                  <div className="product-price">${parseFloat(producto.precio_venta).toFixed(2)}</div>
                  <div className="product-buy-price">Compra: ${parseFloat(producto.precio_compra).toFixed(2)}</div>
                </td>
                <td>
                  <span className={`badge-modern ${getStockBadge(producto.stock, producto.stock_min)}`}>
                    {getStockText(producto.stock, producto.stock_min)} ({producto.stock})
                  </span>
                  <div className="product-min-stock">Mínimo: {producto.stock_min}</div>
                </td>
                <td>
                  <span className={`badge-modern ${producto.estado === 'activo' ? 'badge-modern-success' : 'badge-modern-danger'}`}>
                    {producto.estado === 'activo' ? '✅ Activo' : '⛔ Inactivo'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => handleEdit(producto)} className="btn-action edit" title="Editar">
                      ✏️
                    </button>
                    <button onClick={() => onDelete(producto.id)} className="btn-action delete" title="Eliminar">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}