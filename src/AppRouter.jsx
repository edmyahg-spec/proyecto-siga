import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout/Layout';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Productos from './components/Productos/Productos';
import Ventas from './components/Ventas/Ventas';
import Compras from './components/Compras/Compras';
import Inventario from './components/Inventario/Inventario';
import Usuarios from './components/Usuarios/Usuarios';
import Reportes from './components/Reportes/Reportes';
import Ticket from './components/Ticket/Ticket';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }
  
  return isAuthenticated && user?.rol === 'admin' ? children : <Navigate to="/dashboard" />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/ticket/:id" element={<Ticket />} />
      
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="productos" element={<Productos />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="compras" element={<Compras />} />
        <Route path="inventario" element={
          <AdminRoute>
            <Inventario />
          </AdminRoute>
        } />
        <Route path="usuarios" element={
          <AdminRoute>
            <Usuarios />
          </AdminRoute>
        } />
        <Route path="reportes" element={
          <AdminRoute>
            <Reportes />
          </AdminRoute>
        } />
      </Route>
    </Routes>
  );
}