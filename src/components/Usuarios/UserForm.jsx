import React, { useState, useEffect } from 'react';

export default function UserForm({ editUser, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    usuario: '',
    nombre: '',
    password: '',
    rol: 'empleado',
    estado: 'activo'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editUser) {
      setFormData({
        usuario: editUser.usuario,
        nombre: editUser.nombre,
        password: '',
        rol: editUser.rol,
        estado: editUser.estado
      });
    }
  }, [editUser]);

  const validate = () => {
    const newErrors = {};
    if (!formData.usuario.trim()) newErrors.usuario = 'El nombre de usuario es requerido';
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre completo es requerido';
    if (!editUser && !formData.password) newErrors.password = 'La contraseña es requerida';
    if (formData.password && formData.password.length < 4) {
      newErrors.password = 'La contraseña debe tener al menos 4 caracteres';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const submitData = { ...formData };
      if (!submitData.password) delete submitData.password;
      await onSave(submitData);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      usuario: '',
      nombre: '',
      password: '',
      rol: 'empleado',
      estado: 'activo'
    });
    setErrors({});
  };

  return (
    <div className="modern-form-card">
      <div className="modern-form-header">
        <h3>{editUser ? 'Editar Usuario' : 'Agregar Usuario'}</h3>
      </div>

      <form onSubmit={handleSubmit} className="modern-form-body">
        <div className="modern-form-group">
          <label>Nombre de Usuario *</label>
          <input
            type="text"
            value={formData.usuario}
            onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
            className={errors.usuario ? 'error' : ''}
            placeholder="usuario@ejemplo.com"
          />
          {errors.usuario && <span className="error-message">{errors.usuario}</span>}
        </div>

        <div className="modern-form-group">
          <label>Nombre Completo *</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            className={errors.nombre ? 'error' : ''}
            placeholder="Nombre completo del usuario"
          />
          {errors.nombre && <span className="error-message">{errors.nombre}</span>}
        </div>

        <div className="modern-form-group">
          <label>Contraseña {!editUser && '*'}</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={errors.password ? 'error' : ''}
            placeholder={editUser ? 'Dejar en blanco para no cambiar' : 'Ingrese contraseña'}
          />
          {errors.password && <span className="error-message">{errors.password}</span>}
          {editUser && (
            <span className="input-hint">Dejar en blanco para mantener la contraseña actual</span>
          )}
        </div>

        <div className="modern-form-row">
          <div className="modern-form-group">
            <label>Rol</label>
            <select
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
            >
              <option value="empleado">Empleado</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="modern-form-group">
            <label>Estado</label>
            <div className="status-toggle">
              <button
                type="button"
                className={`status-option ${formData.estado === 'activo' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, estado: 'activo' })}
              >
                Activo
              </button>
              <button
                type="button"
                className={`status-option ${formData.estado === 'inactivo' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, estado: 'inactivo' })}
              >
                Inactivo
              </button>
            </div>
          </div>
        </div>

        <div className="modern-form-actions">
          <button type="submit" className="btn-modern-primary" disabled={loading}>
            {loading ? 'Guardando...' : (editUser ? 'Actualizar Usuario' : 'Guardar Usuario')}
          </button>
          {editUser && (
            <button type="button" className="btn-modern-secondary" onClick={onCancel}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}