import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export default function Charts({ ventasUltimaSemana, stockPorCategoria }) {
  const lineChartData = {
    labels: ventasUltimaSemana.map(item => item.dia),
    datasets: [
      {
        label: 'Ventas ($)',
        data: ventasUltimaSemana.map(item => item.total),
        borderColor: '#6b4f3a',
        backgroundColor: 'rgba(107, 79, 58, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#6b4f3a',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#5d4037',
          font: { weight: 'bold' }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => `$${context.raw.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { 
          callback: (value) => `$${value.toLocaleString('es-MX')}`,
          color: '#757575'
        }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#757575' }
      }
    }
  };

  const doughnutColors = [
    '#6b4f3a', '#9b7a59', '#c4a88b', '#5d4037', 
    '#8d6e63', '#a1887f', '#795548', '#bcaaa4'
  ];

  const doughnutChartData = {
    labels: stockPorCategoria.map(item => item.categoria),
    datasets: [
      {
        data: stockPorCategoria.map(item => item.stock_total),
        backgroundColor: doughnutColors,
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#5d4037',
          font: { size: 11 },
          boxWidth: 12,
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-lg font-semibold text-[#5d4037] mb-4 pb-2 border-b border-gray-200">
          Ventas de la Última Semana
        </h3>
        <div className="h-80">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-lg font-semibold text-[#5d4037] mb-4 pb-2 border-b border-gray-200">
          Stock por Categoría
        </h3>
        <div className="h-80">
          <Doughnut data={doughnutChartData} options={doughnutOptions} />
        </div>
      </div>
    </div>
  );
}