import React from 'react';
import { FiAlertCircle, FiTrendingUp } from 'react-icons/fi';

export default function RecentTables({ productosBajoStock, productosMasVendidos }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Productos con Bajo Stock */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-[#f59e0b] to-[#f97316]">
          <div className="flex items-center gap-2 text-white">
            <FiAlertCircle size={20} />
            <h3 className="font-semibold">Productos con Bajo Stock</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Código</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Producto</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Stock</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Mínimo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productosBajoStock.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                    No hay productos con bajo stock
                  </td>
                </tr>
              ) : (
                productosBajoStock.map((producto, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{producto.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{producto.nombre}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {producto.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-500">{producto.stock_min}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Productos Más Vendidos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-[#10b981] to-[#059669]">
          <div className="flex items-center gap-2 text-white">
            <FiTrendingUp size={20} />
            <h3 className="font-semibold">Productos Más Vendidos</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Producto</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Unidades Vendidas</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productosMasVendidos.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-4 py-8 text-center text-gray-400">
                    No hay datos de productos vendidos
                  </td>
                </tr>
              ) : (
                productosMasVendidos.map((producto, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{producto.nombre}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="font-semibold text-[#10b981]">{producto.total_vendido}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Popular
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}