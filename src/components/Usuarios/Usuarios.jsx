import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import toast from 'react-hot-toast';
import UserForm from './UserForm';
import UserList from './UserList';

export default function Usuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const response = await api.get('/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      if (editUser) {
        await api.put(`/usuarios/${editUser.id}`, userData);
        toast.success('Usuario actualizado correctamente');
      } else {
        await api.post('/usuarios', userData);
        toast.success('Usuario creado correctamente');
      }
      setEditUser(null);
      await cargarUsuarios();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.response?.data?.error || 'Error al guardar usuario');
      throw error;
    }
  };

  const handleDeleteUser = async (id) => {
    if (id === user?.id) {
      toast.error('No puede eliminar su propio usuario');
      return;
    }
    
    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      try {
        await api.delete(`/usuarios/${id}`);
        toast.success('Usuario eliminado correctamente');
        await cargarUsuarios();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Error al eliminar usuario');
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="usuarios-container">
      <div className="page-header">
        <h1>Gestión de Usuarios</h1>
        <p>Administre los usuarios del sistema</p>
      </div>

      <div className="usuarios-grid">
        <UserForm 
          editUser={editUser} 
          onSave={handleSaveUser}
          onCancel={() => setEditUser(null)}
        />
        
        <div className="info-card-roles">
          <div className="info-card-header-roles">
            <h3>Información de Roles</h3>
          </div>
          <div className="info-card-body-roles">
            <div className="role-item admin-role">
              <div className="role-header">
                <span className="role-icon">👑</span>
                <h4>Administrador</h4>
              </div>
              <p>Acceso completo a todos los módulos del sistema: productos, ventas, compras, reportes, usuarios e inventario.</p>
            </div>
            <div className="role-item employee-role">
              <div className="role-header">
                <span className="role-icon">👤</span>
                <h4>Empleado</h4>
              </div>
              <p>Acceso limitado a módulos operativos: ventas, consulta de productos y carrito de compras.</p>
            </div>
            <div className="info-note">
              <p><strong>Nota:</strong> La contraseña por defecto para nuevos usuarios es <strong>123456</strong>. Se recomienda cambiarla después del primer acceso.</p>
            </div>
          </div>
        </div>
      </div>

      <UserList 
        usuarios={usuarios}
        currentUserId={user?.id}
        onEdit={setEditUser}
        onDelete={handleDeleteUser}
      />
    </div>
  );
}