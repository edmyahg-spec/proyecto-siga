const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../models/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Obtener usuarios (solo admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nombre, usuario, rol, estado, created_at FROM usuarios ORDER BY id DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar usuarios' });
  }
});

// Crear usuario
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { nombre, usuario, password, rol, estado } = req.body;

  if (!nombre || !usuario) {
    return res.status(400).json({ error: 'Nombre y usuario son requeridos' });
  }

  try {
    // Verificar si el usuario ya existe
    const [existing] = await db.query("SELECT id FROM usuarios WHERE usuario = ?", [usuario]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password || '123456', 10);
    
    await db.query(
      "INSERT INTO usuarios (nombre, usuario, password, rol, estado) VALUES (?, ?, ?, ?, ?)",
      [nombre, usuario, hashedPassword, rol || 'empleado', estado || 'activo']
    );

    res.json({ message: 'Usuario creado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Actualizar usuario
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const id = req.params.id;
  const { nombre, usuario, password, rol, estado } = req.body;

  if (!nombre || !usuario) {
    return res.status(400).json({ error: 'Nombre y usuario son requeridos' });
  }

  try {
    // Verificar si el usuario ya existe (excluyendo el actual)
    const [existing] = await db.query("SELECT id FROM usuarios WHERE usuario = ? AND id != ?", [usuario, id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        "UPDATE usuarios SET nombre=?, usuario=?, password=?, rol=?, estado=? WHERE id=?",
        [nombre, usuario, hashedPassword, rol, estado, id]
      );
    } else {
      await db.query(
        "UPDATE usuarios SET nombre=?, usuario=?, rol=?, estado=? WHERE id=?",
        [nombre, usuario, rol, estado, id]
      );
    }

    res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Eliminar usuario
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const id = req.params.id;
  
  try {
    await db.query("DELETE FROM usuarios WHERE id = ?", [id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router;