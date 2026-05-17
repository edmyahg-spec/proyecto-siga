import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import CompraForm from './CompraForm';
import HistorialCompras from './HistorialCompras';

export default function Compras() {
  const [productos, setProductos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [productosRes, comprasRes] = await Promise.all([
        api.get('/productos'),
        api.get('/compras')
      ]);
      setProductos(productosRes.data || []);
      setCompras(comprasRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarCompra = async (compraData) => {
    try {
      const response = await api.post('/compras', compraData);
      toast.success('Compra registrada correctamente');
      await cargarDatos();
      return response.data;
    } catch (error) {
      console.error('Error registering purchase:', error);
      toast.error(error.response?.data?.error || 'Error al registrar compra');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="compras-container">
      <div className="page-header">
        <h1>Gestión de Compras</h1>
        <p>Registro de compras a proveedores</p>
      </div>

      <div className="compras-grid">
        <CompraForm productos={productos} onRegistrar={handleRegistrarCompra} />
        <HistorialCompras compras={compras} />
      </div>
    </div>
  );
}