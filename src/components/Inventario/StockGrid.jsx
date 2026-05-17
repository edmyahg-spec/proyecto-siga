import React from 'react';

export default function StockGrid({ stock }) {
  const getStockClass = (estado) => {
    switch(estado) {
      case 'agotado': return 'stock-card stock-agotado';
      case 'bajo': return 'stock-card stock-bajo';
      default: return 'stock-card stock-ok';
    }
  };

  const getStockIcon = (estado) => {
    switch(estado) {
      case 'agotado': return '❌';
      case 'bajo': return '⚠️';
      default: return '✅';
    }
  };

  if (stock.length === 0) {
    return (
      <div className="empty-stock">
        <p>No hay productos registrados</p>
      </div>
    );
  }

  // Estadísticas de stock
  const totalProductos = stock.length;
  const productosAgotados = stock.filter(p => p.estado_stock === 'agotado').length;
  const productosBajo = stock.filter(p => p.estado_stock === 'bajo').length;
  const productosOk = stock.filter(p => p.estado_stock === 'ok').length;

  return (
    <div className="stock-section">
      <div className="stock-header">
        <h3>Stock Actual por Producto</h3>
        <div className="stock-stats">
          <span className="stat ok">✓ Disponible: {productosOk}</span>
          <span className="stat warning">⚠ Bajo: {productosBajo}</span>
          <span className="stat danger">✗ Agotado: {productosAgotados}</span>
          <span className="stat total">Total: {totalProductos}</span>
        </div>
      </div>

      <div className="stock-grid">
        {stock.map((item, idx) => (
          <div key={idx} className={getStockClass(item.estado_stock)}>
            <div className="stock-card-header">
              <span className="stock-status-icon">{getStockIcon(item.estado_stock)}</span>
              <span className="stock-codigo">{item.codigo}</span>
            </div>
            <div className="stock-card-body">
              <div className="stock-nombre">{item.nombre}</div>
              <div className="stock-categoria">{item.categoria || 'Sin categoría'}</div>
            </div>
            <div className="stock-card-footer">
              <div className="stock-cantidad">
                <span className="cantidad-valor">{item.stock}</span>
                <span className="cantidad-label">unidades</span>
              </div>
              <div className="stock-minimo">
                Mínimo: {item.stock_min}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}