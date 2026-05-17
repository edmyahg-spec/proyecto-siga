const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'grupo-aguila-secret-key-2024';

const loginAttempts = new Map();

router.post('/login', async (req, res) => {
  const { usuario, password } = req.body;
  const ip = req.ip;

  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: Date.now() };
  const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
  
  if (attempts.count >= 5 && timeSinceLastAttempt < 300000) {
    return res.status(429).json({ error: 'Demasiados intentos. Espere 5 minutos.' });
  }

  if (!usuario || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, nombre, usuario, password, rol, estado FROM usuarios WHERE usuario = ?',
      [usuario]
    );

    if (rows.length === 0) {
      loginAttempts.set(ip, { count: attempts.count + 1, lastAttempt: Date.now() });
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const user = rows[0];

    if (user.estado !== 'activo') {
      return res.status(401).json({ error: 'Usuario inactivo' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      loginAttempts.set(ip, { count: attempts.count + 1, lastAttempt: Date.now() });
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    loginAttempts.delete(ip);

    const token = jwt.sign(
      { id: user.id, usuario: user.usuario, rol: user.rol, nombre: user.nombre },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        usuario: user.usuario,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;