import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ReporteGenerator from './ReporteGenerator';

export default function Reportes() {
  const [generating, setGenerating] = useState(false);

  const handleGenerateReport = async (tipo, formato, filtros = {}) => {
    setGenerating(true);
    try {
      let url = `/reportes/${tipo}`;
      const params = new URLSearchParams({ formato, ...filtros });
      
      const response = await api.get(url, {
        params: { formato, ...filtros },
        responseType: 'blob'
      });

      const contentType = response.headers['content-type'];
      let extension = formato === 'csv' ? 'csv' : 'pdf';
      let mimeType = formato === 'csv' ? 'text/csv;charset=utf-8' : 'application/pdf';
      
      const blob = new Blob([response.data], { type: mimeType });
      const link = document.createElement('a');
      const urlBlob = URL.createObjectURL(blob);
      link.href = urlBlob;
      const fecha = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.setAttribute('download', `reporte_${tipo}_${fecha}.${extension}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(urlBlob);
      
      toast.success('Reporte descargado correctamente');
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
            </div>
            <div className="report-info-item">
              <h4>Ventas</h4>
              <p>Historial completo de ventas realizadas con detalles de productos.</p>
            </div>
            <div className="report-info-item">
              <h4>Movimientos</h4>
              <p>Todas las transacciones de inventario (entradas y salidas).</p>
            </div>
            <div className="report-info-item">
              <h4>Compras</h4>
              <p>Historial completo de compras con filtros por proveedor y fechas.</p>
            </div>
            <div className="report-info-item">
              <h4>Usuarios</h4>
              <p>Listado del personal del sistema con roles y estados.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}