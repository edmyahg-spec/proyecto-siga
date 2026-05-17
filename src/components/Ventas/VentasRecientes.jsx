import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiPrinter } from 'react-icons/fi';

export default function VentasRecientes() {
  console.log('🟢 VentasRecientes component mounted');
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarVentasRecientes();
  }, []);

 const cargarVentasRecientes = async () => {
  try {
    const token = localStorage.getItem('token');
    console.log('Token:', token ? 'Existe' : 'No existe');
    
    const response = await fetch('http://localhost:3001/api/ventas/recientes', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    const data = await response.json();
    console.log('Ventas cargadas:', data);
    setVentas(data);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};

  const handlePrintTicket = (ventaId) => {
    window.open(`/ticket/${ventaId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-3 border-[#6b4f3a] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  console.log('5. Renderizando ventas:', ventas.length);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-[#6b4f3a] to-[#9b7a59]">
        <h3 className="font-semibold text-white">Ventas Recientes</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Folio</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Productos</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Usuario</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Ticket</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ventas.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                  No hay ventas recientes
                </td>
              </tr>
            ) : (
              ventas.map((venta) => (
                <tr key={venta.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(venta.fecha).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-semibold text-[#6b4f3a]">{venta.folio}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {venta.productos_detalle || `${venta.total_productos || 0} productos`}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-700">
                   ${(parseFloat(venta.total) || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{venta.usuario}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handlePrintTicket(venta.id)}
                      className="text-[#6b4f3a] hover:text-[#9b7a59] transition-colors"
                      title="Imprimir ticket"
                    >
                      <FiPrinter size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}