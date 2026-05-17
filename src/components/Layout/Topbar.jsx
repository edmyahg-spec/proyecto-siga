import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="topbar">
      <div className="page-title">
        <h2>Tablero</h2>
        <p>Sistema de Gestión Comercial</p>
      </div>
      <div className="user-info">
        <div className="user-name">
          <strong>{user?.nombre}</strong>
          <span>{user?.rol === 'admin' ? 'Administrador' : 'Empleado'}</span>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}