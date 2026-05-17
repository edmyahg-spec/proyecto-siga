import React from 'react';

export default function MovimientosTable({ movimientos }) {
  const getTipoBadge = (tipo) => {
    const config = {
      compra: { class: 'tipo-badge tipo-compra', label: 'Entrada', icon: '↓' },
      venta: { class: 'tipo-badge tipo-venta', label: 'Salida', icon: '↑' },
      ajuste: { class: 'tipo-badge tipo-ajuste', label: 'Ajuste', icon: '↻' }
    };
    const cfg = config[tipo] || config.ajuste;
    return (
      <span className={cfg.class}>
        {cfg.icon} {cfg.label}
      </span>
    );
  };

  if (movimientos.length === 0) {
    return (
      <div className="movimientos-empty">
        <p>No hay movimientos registrados</p>
        <small>Los movimientos aparecerán cuando se realicen compras o ventas</small>
      </div>
    );
  }

  return (
    <div className="movimientos-section">
      <div className="movimientos-header">
        <h3>Historial de Movimientos</h3>
        <span className="movimientos-count">{movimientos.length} registros</span>
      </div>

      <div className="movimientos-table-wrapper">
        <table className="movimientos-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Usuario</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((mov) => (
              <tr key={mov.id}>
                <td className="fecha-cell">
                  {new Date(mov.fecha).toLocaleString('es-MX')}
                </td>
                <td>{getTipoBadge(mov.tipo)}</td>
                <td className="producto-cell">
                  <span className="producto-nombre">{mov.producto}</span>
                </td>
                <td className={`cantidad-cell ${mov.cantidad > 0 ? 'cantidad-positiva' : 'cantidad-negativa'}`}>
                  {mov.cantidad > 0 ? `+${mov.cantidad}` : mov.cantidad}
                </td>
                <td className="usuario-cell">{mov.usuario}</td>
                <td className="observaciones-cell">{mov.observaciones || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}