import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function Sidebar() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { path: '/dashboard', label: 'Tablero', icon: '📊' },
    { path: '/productos', label: 'Productos', icon: '📦' },
    { path: '/ventas', label: 'Ventas', icon: '💰' },
    { path: '/compras', label: 'Compras', icon: '🚚' },
  ];

  const adminItems = [
    { path: '/usuarios', label: 'Usuarios', icon: '👥' },
    { path: '/reportes', label: 'Reportes', icon: '📈' },
    { path: '/inventario', label: 'Inventario', icon: '📋' },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'fixed', top: 16, left: 16, zIndex: 101, display: 'none' }}
      >
        ☰
      </button>

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/img/ga.jpg" alt="Logo" />
            <div>
              <h1>VIDRIOS Y ALUMINIOS</h1>
              <p>Grupo Águila</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
              onClick={() => setIsOpen(false)}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          {user?.rol === 'admin' && (
            <>
              <div className="sidebar-divider" />
              {adminItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `sidebar-nav-item ${isActive ? 'active' : ''}`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </div>
    </>
  );
}