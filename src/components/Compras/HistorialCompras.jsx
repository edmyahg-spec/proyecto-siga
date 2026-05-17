import React from 'react';

export default function HistorialCompras({ compras }) {
  if (compras.length === 0) {
    return (
      <div className="modern-table-card">
        <div className="modern-table-header">
          <h3>Historial de Compras</h3>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>No hay compras registradas</p>
          <small>Registre su primera compra utilizando el formulario</small>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-table-card">
      <div className="modern-table-header">
        <h3>Historial de Compras</h3>
      </div>

      <div className="modern-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Total</th>
              <th>Proveedor</th>
              <th>Fecha</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            {compras.map((compra) => (
              <tr key={compra.id}>
                <td>
                  <span className="id-badge">#{compra.id}</span>
                </td>
                <td>
                  <div className="product-name">{compra.nombre}</div>
                  <div className="product-code">{compra.codigo}</div>
                </td>
                <td className="text-center">
                  <span className="quantity-badge">{compra.cantidad}</span>
                </td>
                <td className="text-right">
                  <span className="price-value">${parseFloat(compra.precio_compra).toFixed(2)}</span>
                </td>
                <td className="text-right">
                  <span className="total-value">${(compra.cantidad * compra.precio_compra).toFixed(2)}</span>
                </td>
                <td>
                  <span className="supplier-badge">{compra.proveedor}</span>
                </td>
                <td className="date-cell">
                  {new Date(compra.fecha).toLocaleString('es-MX')}
                </td>
                <td>
                  <span className="user-badge">{compra.usuario}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}