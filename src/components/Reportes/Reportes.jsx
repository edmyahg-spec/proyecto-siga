import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ReporteGenerator from './ReporteGenerator';

export default function Reportes() {
  const [generating, setGenerating] = useState(false);

  const handleGenerateReport = async (tipo, formato) => {
    setGenerating(true);
    try {
      const response = await api.get(`/reportes/${tipo}`, {
        params: { formato },
        responseType: formato === 'pdf' ? 'blob' : 'text'
      });

      if (formato === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        const fecha = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.setAttribute('download', `reporte_${tipo}_${fecha}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Reporte descargado correctamente');
      } else if (formato === 'pdf') {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 100);
        toast.success('Reporte generado correctamente');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(error.response?.data?.error || 'Error al generar el reporte');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="reportes-container">
      <div className="page-header">
        <h1>Reportes</h1>
        <p>Exporte datos del sistema en diferentes formatos</p>
      </div>

      <div className="reportes-grid">
        <ReporteGenerator 
          onGenerate={handleGenerateReport}
          generating={generating}
        />
        
        <div className="info-card-reportes">
          <div className="info-card-header-reportes">
            <h3>Tipos de Reportes</h3>
          </div>
          <div className="info-card-body-reportes">
            <div className="report-info-item">
              <h4>Inventario</h4>
              <p>Listado completo de productos con stock actual, precios y estado.</p>
              <div className="report-fields">
                <span>Código</span>
                <span>Nombre</span>
                <span>Categoría</span>
                <span>Stock</span>
                <span>Estado</span>
              </div>
            </div>
            <div className="report-info-item">
              <h4>Ventas</h4>
              <p>Historial completo de ventas realizadas con detalles de productos.</p>
              <div className="report-fields">
                <span>Fecha</span>
                <span>Folio</span>
                <span>Productos</span>
                <span>Total</span>
                <span>Usuario</span>
              </div>
            </div>
            <div className="report-info-item">
              <h4>Movimientos</h4>
              <p>Todas las transacciones de inventario (entradas y salidas).</p>
              <div className="report-fields">
                <span>Fecha</span>
                <span>Tipo</span>
                <span>Producto</span>
                <span>Cantidad</span>
                <span>Usuario</span>
              </div>
            </div>
            <div className="report-info-item">
              <h4>Usuarios</h4>
              <p>Listado del personal del sistema con roles y estados.</p>
              <div className="report-fields">
                <span>Usuario</span>
                <span>Nombre</span>
                <span>Rol</span>
                <span>Estado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}