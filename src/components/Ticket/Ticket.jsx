import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function Ticket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venta, setVenta] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError('No se encontró el ID de la venta');
      setLoading(false);
      return;
    }
    cargarTicket();
  }, [id]);

  const cargarTicket = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Cargando ticket para venta ID:', id);
      
      const response = await api.get(`/ventas/${id}/ticket`);
      console.log('Respuesta del ticket:', response.data);
      
      setVenta(response.data.venta);
      
      // Asegurar que los valores numéricos sean números
      const detallesFormateados = (response.data.detalles || []).map(item => ({
        ...item,
        cantidad: Number(item.cantidad) || 0,
        precio_unit: Number(item.precio_unit) || 0,
        descuento: Number(item.descuento) || 0,
        subtotal: Number(item.subtotal) || 0
      }));
      
      setDetalles(detallesFormateados);
      
    } catch (error) {
      console.error('Error loading ticket:', error);
      let errorMsg = 'Error al cargar el ticket';
      if (error.response?.status === 404) {
        errorMsg = 'Venta no encontrada';
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner"></div>
        <p style={{ marginLeft: '12px' }}>Cargando ticket...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: '#1F2937', marginBottom: '8px' }}>Error</h2>
          <p style={{ color: '#6B7280', marginBottom: '24px' }}>{error}</p>
          <button 
            onClick={() => navigate('/ventas')}
            style={{
              background: '#8B5E3C',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Volver a Ventas
          </button>
        </div>
      </div>
    );
  }

  if (!venta) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>No se encontró información de la venta</p>
      </div>
    );
  }

  // Calcular subtotal y descuento total usando números
  const subtotal = detalles.reduce((sum, item) => sum + (item.precio_unit * item.cantidad), 0);
  const totalDescuento = detalles.reduce((sum, item) => sum + (item.descuento || 0), 0);
  const totalVenta = venta.total ? Number(venta.total) : (subtotal - totalDescuento);

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', padding: '20px' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        {/* Ticket */}
        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 35px -10px rgba(0,0,0,0.1)' }}>
          
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #8B5E3C, #6B4226)', textAlign: 'center', padding: '24px' }}>
            <img 
              src="/img/ga.jpg" 
              alt="Logo" 
              style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '12px', border: '3px solid white', objectFit: 'cover' }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '4px' }}>Vidrios y Aluminios</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>Grupo Águila</p>
          </div>

          {/* Info */}
          <div style={{ background: '#F8FAFC', padding: '16px', borderBottom: '2px dashed #E5E7EB', textAlign: 'center' }}>
            <p style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px', color: '#8B5E3C', marginBottom: '4px' }}>
              {venta.folio || 'N/A'}
            </p>
            <p style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>
              {venta.fecha ? new Date(venta.fecha).toLocaleString('es-MX') : 'N/A'}
            </p>
            <p style={{ fontSize: '11px', color: '#6B7280' }}>
              Atendió: {venta.usuario || 'N/A'}
            </p>
          </div>

          {/* Detalles */}
          <div style={{ padding: '16px' }}>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ textAlign: 'left', padding: '8px 4px', color: '#4B5563' }}>Producto</th>
                  <th style={{ textAlign: 'center', padding: '8px 4px', color: '#4B5563' }}>Cant</th>
                  <th style={{ textAlign: 'right', padding: '8px 4px', color: '#4B5563' }}>P.Unit</th>
                  <th style={{ textAlign: 'right', padding: '8px 4px', color: '#4B5563' }}>Importe</th>
                </tr>
              </thead>
              <tbody>
                {detalles.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF' }}>
                      No hay productos en esta venta
                    </td>
                  </tr>
                ) : (
                  detalles.map((item, idx) => {
                    const importe = (item.precio_unit * item.cantidad) - (item.descuento || 0);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '8px 4px' }}>
                          <div style={{ fontWeight: '600', color: '#1F2937' }}>{item.nombre || 'Producto'}</div>
                          <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{item.codigo || ''}</div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '8px 4px' }}>{item.cantidad}</td>
                        <td style={{ textAlign: 'right', padding: '8px 4px' }}>
                          ${item.precio_unit.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px 4px', fontWeight: '500' }}>
                          ${importe.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div style={{ padding: '16px', background: '#F8FAFC', borderTop: '2px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {totalDescuento > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', color: '#EF4444' }}>
                <span>Descuento:</span>
                <span>-${totalDescuento.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #E5E7EB' }}>
              <span>TOTAL:</span>
              <span>${totalVenta.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '16px', textAlign: 'center', fontSize: '11px', color: '#6B7280', borderTop: '1px solid #F3F4F6' }}>
            <p>Método: <strong>{venta.metodo_pago || 'No especificado'}</strong></p>
            {venta.notas && (
              <p style={{ marginTop: '8px', color: '#9CA3AF', fontSize: '10px' }}>{venta.notas}</p>
            )}
            <p style={{ marginTop: '12px', fontWeight: '600', color: '#8B5E3C' }}>
              ¡Gracias por su preferencia!
            </p>
          </div>
        </div>

        {/* Botones */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
          <button
            onClick={handlePrint}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #8B5E3C, #6B4226)',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={() => navigate('/ventas')}
            style={{
              flex: 1,
              background: 'white',
              color: '#4B5563',
              border: '1px solid #E5E7EB',
              padding: '12px',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Volver a Ventas
          </button>
        </div>
      </div>
    </div>
  );
}