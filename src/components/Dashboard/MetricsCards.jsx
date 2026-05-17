import React from 'react';
import { 
  FiPackage, 
  FiAlertTriangle, 
  FiShoppingBag, 
  FiTruck, 
  FiUsers, 
  FiCalendar,
  FiBox
} from 'react-icons/fi';

const cards = [
  { key: 'totalProductos', icon: FiPackage, label: 'Productos Totales', color: 'from-[#6b4f3a] to-[#9b7a59]' },
  { key: 'lowStock', icon: FiAlertTriangle, label: 'Bajo Stock', color: 'from-[#f59e0b] to-[#f97316]' },
  { key: 'outStock', icon: FiBox, label: 'Agotados', color: 'from-[#ef4444] to-[#dc2626]' },
  { key: 'ventasHoy', icon: FiShoppingBag, label: 'Ventas Hoy', color: 'from-[#10b981] to-[#059669]', prefix: '$' },
  { key: 'comprasHoy', icon: FiTruck, label: 'Compras Hoy', color: 'from-[#3b82f6] to-[#2563eb]', prefix: '$' },
  { key: 'totalUsuarios', icon: FiUsers, label: 'Usuarios', color: 'from-[#8b5cf6] to-[#7c3aed]' },
  { key: 'ventasMes', icon: FiCalendar, label: 'Ventas del Mes', color: 'from-[#ec4899] to-[#db2777]', prefix: '$' },
];

export default function MetricsCards({ metrics }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card) => {
        const value = metrics[card.key] || 0;
        const formattedValue = card.prefix === '$' 
          ? `${card.prefix}${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : value.toLocaleString('es-MX');
        
        return (
          <div 
            key={card.key}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            <div className={`bg-gradient-to-r ${card.color} p-4 text-white`}>
              <div className="flex justify-between items-center">
                <card.icon size={28} className="opacity-90" />
                <span className="text-2xl font-bold">{formattedValue}</span>
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-gray-600 font-medium">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}