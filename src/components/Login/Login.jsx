import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!usuario || !password) {
      toast.error('Por favor ingrese usuario y contraseña');
      return;
    }

    setLoading(true);
    const result = await login(usuario, password);
    setLoading(false);

    if (result.success) {
      toast.success('¡Bienvenido!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src="/img/ga.jpg" alt="Logo" className="login-logo" />
        <h1>VIDRIOS Y ALUMINIOS</h1>
        <p>Grupo Águila</p>

        <form onSubmit={handleSubmit}>
          <div className="login-input">
            <label>USUARIO</label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ingrese su usuario"
            />
          </div>

          <div className="login-input">
            <label>CONTRASEÑA</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Ingresando...' : 'INICIAR SESIÓN'}
          </button>
        </form>

        <div className="login-credentials">
          <strong>Usuario:</strong> admin &nbsp;|&nbsp; 
          <strong>Contraseña:</strong> Admin123!
        </div>
      </div>
    </div>
  );
}