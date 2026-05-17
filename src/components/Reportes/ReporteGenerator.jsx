import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const reportesInfo = {
  inventario: {
    titulo: 'Reporte de Inventario',
    descripcion: 'Listado completo de productos con stock actual',
    campos: 'Código, nombre, categoría, proveedor, stock, mínimo, estado',
    util: 'Revisión general de existencias'
  },
  ventas: {
    titulo: 'Reporte de Ventas',
    descripcion: 'Historial completo de ventas realizadas',
    campos: 'Fecha, folio, productos, total, tipo pago, observaciones, usuario',
    util: 'Análisis de ventas y rendimiento'
  },
  movimientos: {
    titulo: 'Reporte de Movimientos',
    descripcion: 'Todas las transacciones de inventario',
    campos: 'Fecha, tipo, producto, cantidad, usuario, observaciones',
    util: 'Auditoría y trazabilidad'
  },
  usuarios: {
    titulo: 'Reporte de Usuarios',
    descripcion: 'Listado del personal del sistema',
    campos: 'Usuario, nombre, rol, estado',
    util: 'Gestión de accesos y permisos'
  },
  compras: {
    titulo: 'Reporte de Compras',
    descripcion: 'Historial completo de compras a proveedores',
    campos: 'ID, código, producto, cantidad, precio unitario, total, proveedor, fecha, usuario',
    util: 'Control de adquisiciones y análisis por proveedor'
  }
};

export default function ReporteGenerator({ onGenerate, generating }) {
  const [tipo, setTipo] = useState('');
  const [formato, setFormato] = useState('');
  const [proveedores, setProveedores] = useState([]);
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const response = await api.get('/proveedores/todos');
        setProveedores(response.data);
      } catch (error) {
        console.error('Error cargando proveedores:', error);
      }
    };
    fetchProveedores();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tipo) {
      toast.error('Seleccione un tipo de reporte');
      return;
    }
    if (!formato) {
      toast.error('Seleccione un formato de exportación');
      return;
    }
    
    const params = {};
    if (tipo === 'compras') {
      if (filtroProveedor) params.proveedor_id = filtroProveedor;
      if (fechaDesde) params.desde = fechaDesde;
      if (fechaHasta) params.hasta = fechaHasta;
    }
    
    onGenerate(tipo, formato, params);
  };

  const info = reportesInfo[tipo];

  return (
    <div className="modern-form-card">
      <div className="modern-form-header">
        <h3>Generar Reporte</h3>
      </div>

      <form onSubmit={handleSubmit} className="modern-form-body">
        <div className="modern-form-group">
          <label>Tipo de Reporte</label>
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
              setFormato('');
              setFiltroProveedor('');
              setFechaDesde('');
              setFechaHasta('');
            }}
            required
          >
            <option value="">Seleccionar reporte...</option>
            <option value="inventario">📦 Reporte de Inventario</option>
            <option value="ventas">💰 Reporte de Ventas</option>
            <option value="movimientos">🔄 Reporte de Movimientos</option>
            <option value="compras">📥 Reporte de Compras</option>
            <option value="usuarios">👥 Reporte de Usuarios</option>
          </select>
        </div>

        {/* Filtros para reporte de compras */}
        {tipo === 'compras' && (
          <div className="filtros-container">
            <div className="modern-form-group">
              <label>Filtrar por Proveedor</label>
              <select
                value={filtroProveedor}
                onChange={(e) => setFiltroProveedor(e.target.value)}
              >
                <option value="">Todos los proveedores</option>
                {proveedores.map(prov => (
                  <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                ))}
              </select>
            </div>
            
            <div className="modern-form-row">
              <div className="modern-form-group">
                <label>Fecha desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                />
              </div>
              <div className="modern-form-group">
                <label>Fecha hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {info && (
          <div className="report-preview">
            <h4>{info.titulo}</h4>
            <p className="preview-desc">{info.descripcion}</p>
            <div className="preview-fields">
              <div className="preview-field">
                <span className="field-label">Campos:</span>
                <span className="field-value">{info.campos}</span>
              </div>
              <div className="preview-field">
                <span className="field-label">Utilidad:</span>
                <span className="field-value">{info.util}</span>
              </div>
            </div>
          </div>
        )}

        <div className="modern-form-group">
          <label>Formato de Exportación</label>
          <div className="format-options">
            <button
              type="button"
              className={`format-option ${formato === 'csv' ? 'selected' : ''}`}
              onClick={() => setFormato('csv')}
            >
              <div className="format-content">
                <div className="format-icon">CSV</div>
                <div className="format-info">
                  <strong>Excel (CSV)</strong>
                  <small>Compatible con Excel y Google Sheets</small>
                </div>
                {formato === 'csv' && <span className="format-check">✓</span>}
              </div>
            </button>
            <button
              type="button"
              className={`format-option ${formato === 'pdf' ? 'selected' : ''}`}
              onClick={() => setFormato('pdf')}
            >
              <div className="format-content">
                <div className="format-icon">PDF</div>
                <div className="format-info">
                  <strong>Documento PDF</strong>
                  <small>Para imprimir o compartir</small>
                </div>
                {formato === 'pdf' && <span className="format-check">✓</span>}
              </div>
            </button>
          </div>
        </div>

        <div className="modern-form-actions">
          <button 
            type="submit" 
            className="btn-modern-primary" 
            disabled={!tipo || !formato || generating}
            style={{ width: '100%' }}
          >
            {generating ? '⏳ Generando reporte...' : '📄 Generar Reporte'}
          </button>
        </div>
      </form>
    </div>
  );
}