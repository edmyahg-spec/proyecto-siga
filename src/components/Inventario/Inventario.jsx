import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Inventario() {
  const [stock, setStock] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    tipo: '',
    producto: '',
    desde: '',
    hasta: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Cargando datos de inventario...');
      
      // Cargar stock
      const stockRes = await api.get('/inventario/stock');
      console.log('Stock response:', stockRes.data);
      setStock(stockRes.data || []);
      
      // Cargar movimientos
      const movimientosRes = await api.get('/inventario/movimientos', { params: filters });
      console.log('Movimientos response:', movimientosRes.data);
      setMovimientos(movimientosRes.data || []);
      
    } catch (error) {
      console.error('Error loading inventory:', error);
      console.error('Error details:', error.response?.data);
      
      let errorMsg = 'Error al cargar inventario';
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    await cargarDatos();
  };

  const handleClearFilters = () => {
    setFilters({ tipo: '', producto: '', desde: '', hasta: '' });
    setTimeout(() => cargarDatos(), 100);
  };

  const getStockClass = (estado) => {
    switch(estado) {
      case 'agotado': return 'stock-card stock-agotado';
      case 'bajo': return 'stock-card stock-bajo';
      default: return 'stock-card stock-ok';
    }
  };

  const getTipoBadge = (tipo) => {
    const config = {
      compra: { class: 'tipo-badge tipo-compra', label: 'Entrada' },
      venta: { class: 'tipo-badge tipo-venta', label: 'Salida' },
      ajuste: { class: 'tipo-badge tipo-ajuste', label: 'Ajuste' }
    };
    const cfg = config[tipo] || config.ajuste;
    return <span className={cfg.class}>{cfg.label}</span>;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando inventario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Error al cargar datos</h3>
        <p>{error}</p>
        <button className="btn-modern-primary" onClick={cargarDatos}>
          Reintentar
        </button>
        <details style={{ marginTop: '16px', textAlign: 'left' }}>
          <summary style={{ cursor: 'pointer', color: '#6B7280' }}>Ver detalles técnicos</summary>
          <pre style={{ fontSize: '11px', marginTop: '8px', padding: '8px', background: '#F3F4F6', borderRadius: '8px' }}>
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="inventario-container">
      <div className="page-header">
        <h1>Inventario</h1>
        <p>Resumen de stock y movimientos</p>
      </div>

      <div className="filters-bar">
        <button 
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Tipo de movimiento</label>
              <select
                value={filters.tipo}
                onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="compra">Entrada (Compra)</option>
                <option value="venta">Salida (Venta)</option>
                <option value="ajuste">Ajuste manual</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Producto</label>
              <input
                type="text"
                value={filters.producto}
                onChange={(e) => setFilters({ ...filters, producto: e.target.value })}
                placeholder="Buscar producto..."
              />
            </div>

            <div className="filter-group">
              <label>Fecha desde</label>
              <input
                type="date"
                value={filters.desde}
                onChange={(e) => setFilters({ ...filters, desde: e.target.value })}
              />
            </div>

            <div className="filter-group">
              <label>Fecha hasta</label>
              <input
                type="date"
                value={filters.hasta}
                onChange={(e) => setFilters({ ...filters, hasta: e.target.value })}
              />
            </div>
          </div>

          <div className="filter-actions">
            <button className="btn-filter" onClick={handleFilter}>
              Aplicar filtros
            </button>
            <button className="btn-filter-clear" onClick={handleClearFilters}>
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Stock Section */}
      <div className="stock-section">
        <div className="stock-header">
          <h3>Stock Actual por Producto</h3>
          <div className="stock-stats">
            <span className="stat ok">✓ Disponible: {stock.filter(p => p.estado_stock === 'ok').length}</span>
            <span className="stat warning">⚠ Bajo: {stock.filter(p => p.estado_stock === 'bajo').length}</span>
            <span className="stat danger">✗ Agotado: {stock.filter(p => p.estado_stock === 'agotado').length}</span>
            <span className="stat total">Total: {stock.length}</span>
          </div>
        </div>

        {stock.length === 0 ? (
          <div className="empty-stock">
            <p>No hay productos registrados</p>
          </div>
        ) : (
          <div className="stock-grid">
            {stock.map((item, idx) => (
              <div key={idx} className={getStockClass(item.estado_stock)}>
                <div className="stock-card-header">
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
        )}
      </div>

      {/* Movimientos Section */}
      <div className="movimientos-section">
        <div className="movimientos-header">
          <h3>Historial de Movimientos</h3>
          <span className="movimientos-count">{movimientos.length} registros</span>
        </div>

        {movimientos.length === 0 ? (
          <div className="movimientos-empty">
            <p>No hay movimientos registrados</p>
            <small>Los movimientos aparecerán cuando se realicen compras o ventas</small>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}