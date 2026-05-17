import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    totalProductos: 0,
    lowStock: 0,
    outStock: 0,
    ventasHoy: 0,
    comprasHoy: 0,
    totalUsuarios: 0,
    ventasMes: 0
  });
  const [productosBajoStock, setProductosBajoStock] = useState([]);
  const [productosMasVendidos, setProductosMasVendidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard');
      setMetrics(response.data.metrics);
      setProductosBajoStock(response.data.productosBajoStock || []);
      setProductosMasVendidos(response.data.productosMasVendidos || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error al cargar el tablero');
    } finally {
      setLoading(false);
    }
  };

  const metricCards = [
    { key: 'totalProductos', icon: '📦', label: 'Productos Totales', color: '#8B5E3C', bg: '#F5F0EB' },
    { key: 'lowStock', icon: '⚠️', label: 'Bajo Stock', color: '#F39C12', bg: '#FEF5E7' },
    { key: 'outStock', icon: '❌', label: 'Agotados', color: '#E74C3C', bg: '#FDEDEC' },
    { key: 'ventasHoy', icon: '💰', label: 'Ventas Hoy', color: '#27AE60', bg: '#E8F8F0', prefix: '$' },
    { key: 'comprasHoy', icon: '🚚', label: 'Compras Hoy', color: '#3498DB', bg: '#EBF5FB', prefix: '$' },
    { key: 'totalUsuarios', icon: '👥', label: 'Usuarios', color: '#8E44AD', bg: '#F4ECF7' },
    { key: 'ventasMes', icon: '📅', label: 'Ventas del Mes', color: '#1ABC9C', bg: '#E8F8F5', prefix: '$' },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="welcome-banner">
        <div>
          <h2>¡Bienvenido, {user?.nombre}!</h2>
          <p>Resumen general del sistema</p>
        </div>
        <div className="date-badge">
          📅 {new Date().toLocaleDateString('es-MX', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      <div className="metrics-grid">
        {metricCards.map((card) => {
          const value = metrics[card.key] || 0;
          const formattedValue = card.prefix === '$' 
            ? `${card.prefix}${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
            : value.toLocaleString('es-MX');
          
          return (
            <div key={card.key} className="metric-card" style={{ borderTop: `4px solid ${card.color}` }}>
              <div className="metric-header">
                <span className="metric-icon" style={{ background: card.bg, color: card.color }}>
                  {card.icon}
                </span>
              </div>
              <div className="metric-value" style={{ color: card.color }}>{formattedValue}</div>
              <div className="metric-label">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        {/* Productos con bajo stock */}
        <div className="info-card">
          <div className="info-card-header" style={{ background: '#FEF5E7', color: '#F39C12' }}>
            <span>⚠️</span>
            <h3>Productos con Bajo Stock</h3>
          </div>
          <div className="info-card-body">
            {productosBajoStock.length === 0 ? (
              <p className="empty-message">✅ No hay productos con bajo stock</p>
            ) : (
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Stock</th>
                    <th>Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  {productosBajoStock.map((producto, idx) => (
                    <tr key={idx}>
                      <td>{producto.codigo}</td>
                      <td>{producto.nombre}</td>
                      <td className="text-center"><span className="badge-warning">{producto.stock}</span></td>
                      <td className="text-center">{producto.stock_min}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Productos más vendidos */}
        <div className="info-card">
          <div className="info-card-header" style={{ background: '#E8F8F0', color: '#27AE60' }}>
            <span>🏆</span>
            <h3>Productos Más Vendidos</h3>
          </div>
          <div className="info-card-body">
            {productosMasVendidos.length === 0 ? (
              <p className="empty-message">📊 No hay datos de ventas</p>
            ) : (
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Unidades</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {productosMasVendidos.map((producto, idx) => (
                    <tr key={idx}>
                      <td>{producto.nombre}</td>
                      <td className="text-center"><strong>{producto.total_vendido}</strong></td>
                      <td className="text-center"><span className="badge-success">Popular</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}