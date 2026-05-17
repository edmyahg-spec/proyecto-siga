import React from 'react';

export default function UserList({ usuarios, currentUserId, onEdit, onDelete }) {
  if (usuarios.length === 0) {
    return (
      <div className="modern-table-card">
        <div className="modern-table-header">
          <h3>Listado de Usuarios</h3>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <p>No hay usuarios registrados</p>
          <small>Utilice el formulario para agregar usuarios</small>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-table-card">
      <div className="modern-table-header">
        <h3>Listado de Usuarios</h3>
      </div>

      <div className="modern-table">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre Completo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Fecha Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td>
                  <span className="username-cell">{usuario.usuario}</span>
                </td>
                <td className="name-cell">{usuario.nombre}</td>
                <td>
                  <span className={`role-badge ${usuario.rol === 'admin' ? 'role-admin' : 'role-employee'}`}>
                    {usuario.rol === 'admin' ? 'Administrador' : 'Empleado'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${usuario.estado === 'activo' ? 'status-active' : 'status-inactive'}`}>
                    {usuario.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="date-cell">
                  {new Date(usuario.created_at).toLocaleDateString('es-MX')}
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => onEdit(usuario)} 
                      className="btn-action edit" 
                      title="Editar"
                    >
                      ✏️
                    </button>
                    {usuario.id !== currentUserId && (
                      <button 
                        onClick={() => onDelete(usuario.id)} 
                        className="btn-action delete" 
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    )}
                    {usuario.id === currentUserId && (
                      <span className="current-badge">Actual</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}